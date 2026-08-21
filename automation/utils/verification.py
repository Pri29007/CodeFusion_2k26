"""
verification.py

Handles OTP and CAPTCHA verification for the mock portals.

Flow:

    Playwright reaches OTP/CAPTCHA
            |
            v
    request-input endpoint is called
            |
            v
    Backend stores:
        pending_input_type
        pending_input_image_url
        pending_input_resolved = False
            |
            v
    Frontend detects pending input
            |
            v
    User enters OTP/CAPTCHA
            |
            v
    Frontend calls submit-input endpoint
            |
            v
    pending_input_resolved = True
            |
            v
    This file detects the answer
            |
            v
    Playwright fills the answer and continues
"""

import base64
import time
import requests
import config


# Backend URL.
#
# Add BACKEND_BASE_URL to config.py if it does not already exist.
# Example:
#
# BACKEND_BASE_URL = "http://127.0.0.1:8000"

BACKEND_BASE_URL = getattr(
    config,
    "BACKEND_BASE_URL",
    "http://127.0.0.1:8000",
).rstrip("/")


# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------

def is_otp_stage(page) -> bool:
    """Return True if the current page is the OTP verification stage."""
    return page.get_by_test_id("otp-verification").is_visible()


def is_captcha_stage(page) -> bool:
    """Return True if the current page is the CAPTCHA verification stage."""
    return page.get_by_test_id("captcha-verification").is_visible()


# ---------------------------------------------------------------------------
# Backend human-input communication
# ---------------------------------------------------------------------------

def request_human_input(
    application_id: str,
    input_type: str,
    image_url: str | None = None,
):
    """
    Tell the backend that the automation requires user input.

    input_type:
        "otp" or "captcha"

    image_url:
        For CAPTCHA, this can contain a Base64 data URL representing
        a screenshot of the CAPTCHA.
    """

    url = (
        f"{BACKEND_BASE_URL}/applications/"
        f"{application_id}/request-input"
    )

    response = requests.post(
        url,
        json={
            "input_type": input_type,
            "image_url": image_url,
        },
        timeout=10,
    )

    response.raise_for_status()


def wait_for_human_input(
    application_id: str,
    input_type: str,
    image_url: str | None = None,
    poll_interval: int = 2,
) -> str:
    """
    Tell the backend that OTP/CAPTCHA input is required, then continuously
    poll the application until the frontend user submits an answer.

    Returns the value entered by the user.
    """

    print(f"Requesting {input_type} input from user...")

    request_human_input(
        application_id=application_id,
        input_type=input_type,
        image_url=image_url,
    )

    print(f"Waiting for user to provide {input_type}...")

    url = f"{BACKEND_BASE_URL}/applications/{application_id}"

    while True:
        try:
            response = requests.get(
                url,
                timeout=10,
            )

            response.raise_for_status()

            application_data = response.json()

            if application_data.get("pending_input_resolved"):
                value = application_data.get(
                    "pending_input_value"
                )

                if value:
                    print(
                        f"Received {input_type} from user. "
                        "Resuming automation..."
                    )

                    return str(value).strip()

            time.sleep(poll_interval)

        except requests.RequestException as error:
            print(
                f"Error while checking for {input_type}: {error}"
            )

            time.sleep(poll_interval)


# ---------------------------------------------------------------------------
# CAPTCHA screenshot
# ---------------------------------------------------------------------------

def get_captcha_image(page) -> str:
    """
    Takes a screenshot of the CAPTCHA section and converts it into a
    Base64 data URL.

    This can be stored in the database and directly used by the frontend:

        <img src={pending_input_image_url} />

    Returns:
        data:image/png;base64,...
    """

    captcha_container = page.get_by_test_id(
        "captcha-verification"
    )

    screenshot_bytes = captcha_container.screenshot()

    encoded_image = base64.b64encode(
        screenshot_bytes
    ).decode("utf-8")

    return f"data:image/png;base64,{encoded_image}"


# ---------------------------------------------------------------------------
# OTP
# ---------------------------------------------------------------------------

def submit_otp(
    page,
    application_id: str,
    max_attempts: int = 3,
) -> str:
    """
    Requests an OTP from the user through the backend.

    Once the frontend submits the OTP, Playwright automatically fills it
    into the mock portal.

    Retries up to max_attempts if the OTP is rejected.
    """

    print("OTP verification required. Automation paused.")

    for attempt in range(1, max_attempts + 1):

        otp_code = wait_for_human_input(
            application_id=application_id,
            input_type="otp",
        )

        page.get_by_test_id(
            "otp-input"
        ).fill(otp_code)

        page.get_by_test_id(
            "verify-otp-button"
        ).click()

        page.wait_for_function(
            """() => {
                const btn = document.querySelector(
                    '[data-testid="next-button"]'
                );

                const err = document.querySelector(
                    '[data-testid="otp-error"]'
                );

                return (btn && !btn.disabled) || err;
            }""",
            timeout=10000,
        )

        if page.get_by_test_id(
            "otp-error"
        ).is_visible():

            print(
                f"Incorrect OTP. "
                f"Attempt {attempt}/{max_attempts}"
            )

            # Loop again.
            # A new request-input call will reset:
            #
            # pending_input_resolved = False
            # pending_input_value = None
            #
            # so the frontend can submit a new value.

            continue

        print("OTP verified successfully.")

        return otp_code

    raise RuntimeError(
        f"OTP verification failed after "
        f"{max_attempts} attempts."
    )


# ---------------------------------------------------------------------------
# CAPTCHA
# ---------------------------------------------------------------------------

def submit_captcha(
    page,
    application_id: str,
    max_attempts: int = 3,
) -> str:
    """
    Takes a screenshot of the CAPTCHA and sends it to the backend.

    The frontend can display the screenshot to the user. Once the user
    enters the CAPTCHA and calls submit-input, Playwright automatically
    fills the value into the mock portal.
    """

    print("CAPTCHA verification required. Automation paused.")

    for attempt in range(1, max_attempts + 1):

        # Capture the CAPTCHA currently visible in Playwright.
        captcha_image = get_captcha_image(page)

        code = wait_for_human_input(
            application_id=application_id,
            input_type="captcha",
            image_url=captcha_image,
        )

        page.get_by_test_id(
            "captcha-input"
        ).fill(code)

        page.get_by_test_id(
            "verify-captcha-button"
        ).click()

        page.wait_for_function(
            """() => {
                const btn = document.querySelector(
                    '[data-testid="next-button"]'
                );

                const err = document.querySelector(
                    '[data-testid="captcha-error"]'
                );

                return (btn && !btn.disabled) || err;
            }""",
            timeout=10000,
        )

        if page.get_by_test_id(
            "captcha-error"
        ).is_visible():

            print(
                f"Incorrect CAPTCHA. "
                f"Attempt {attempt}/{max_attempts}"
            )

            continue

        print("CAPTCHA verified successfully.")

        return code

    raise RuntimeError(
        f"CAPTCHA verification failed after "
        f"{max_attempts} attempts."
    )


# ---------------------------------------------------------------------------
# Shared entry point
# ---------------------------------------------------------------------------

def resolve_verification_stage(
    page,
    application_id: str,
):
    """
    Detect whether the current verification screen requires OTP or CAPTCHA
    and resolve it using the backend/frontend human-input flow.
    """

    if is_otp_stage(page):

        submit_otp(
            page=page,
            application_id=application_id,
        )

    elif is_captcha_stage(page):

        submit_captcha(
            page=page,
            application_id=application_id,
        )

    else:
        raise RuntimeError(
            "resolve_verification_stage() was called but neither "
            "the OTP nor CAPTCHA stage is visible."
        )