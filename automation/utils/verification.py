"""
verification.py

OTP / CAPTCHA detection and human-in-the-loop handling for the mock portals.

Both OTP (PM-KISAN, Ayushman Bharat) and CAPTCHA (PMAY) now pause real
automation and wait for a human to supply the answer, following the same
"swappable provider function" pattern:

    submit_otp(page, otp_provider=get_otp_from_terminal, ...)
    submit_captcha(page, captcha_provider=get_captcha_from_terminal, ...)

Today, both providers just call Python's input(). Later, when this connects
to the real YojanaMitra backend / LangGraph resume flow, only the provider
function needs to change (e.g. one that reads the value a citizen typed
into the actual frontend, delivered back through a resumed graph state) —
submit_otp() / submit_captcha() themselves don't need to change.

get_captcha_from_dom_debug() is kept ONLY as an explicit, opt-in
demo/testing fallback for headless/CI-style runs where no human is present
to answer the terminal prompt. It is never used by default.
"""

import config


def is_otp_stage(page) -> bool:
    """True if the current step is the OTP verification screen."""
    return page.get_by_test_id("otp-verification").is_visible()


def is_captcha_stage(page) -> bool:
    """True if the current step is the CAPTCHA verification screen."""
    return page.get_by_test_id("captcha-verification").is_visible()


# ---------------------------------------------------------------------------
# OTP
# ---------------------------------------------------------------------------

def get_otp_from_terminal(context: dict | None = None) -> str:
    """
    Default OTP provider: pauses and waits for a human to type the OTP
    into the terminal.

    `context` is accepted (and currently unused) so future providers with
    the same signature can use application/scheme context if needed,
    without changing the call site in submit_otp().
    """
    return input("Enter the OTP: ").strip()


def submit_otp(page, otp_provider=get_otp_from_terminal, max_attempts: int = 3) -> str:
    """
    Pauses automation and waits for an OTP from otp_provider (defaults to
    a terminal prompt), then fills and submits it. Retries up to
    max_attempts times if the portal rejects the OTP.

    Returns the OTP that was ultimately accepted.
    """
    print("OTP verification required. Automation paused.")

    for attempt in range(1, max_attempts + 1):
        otp_code = otp_provider()

        page.get_by_test_id("otp-input").fill(otp_code)
        page.get_by_test_id("verify-otp-button").click()

        # The mock portal has a simulated ~500ms network delay before
        # resolving the OTP check. Wait for the actual outcome (Continue
        # enabled = success, otp-error visible = wrong code) instead of
        # guessing a fixed sleep duration.
        page.wait_for_function(
            """() => {
                const btn = document.querySelector('[data-testid="next-button"]');
                const err = document.querySelector('[data-testid="otp-error"]');
                return (btn && !btn.disabled) || err;
            }"""
        )

        if page.get_by_test_id("otp-error").is_visible():
            print(f"Incorrect OTP. Please try again. (attempt {attempt}/{max_attempts})")
            continue

        print("OTP verified. Resuming automation...")
        return otp_code

    raise RuntimeError(f"OTP verification failed after {max_attempts} attempts.")


# ---------------------------------------------------------------------------
# CAPTCHA
# ---------------------------------------------------------------------------

def get_captcha_from_terminal(context: dict | None = None) -> str:
    """
    Default CAPTCHA provider: pauses and waits for a human to read the
    CAPTCHA characters shown in the (visible) browser window and type them
    into the terminal. Deliberately does NOT print the answer — the whole
    point is that a real person reads it off the screen.
    """
    return input("Enter the CAPTCHA shown on the portal: ").strip()


def get_captcha_from_dom_debug(page) -> str:
    """
    OPTIONAL DEMO/TESTING FALLBACK ONLY.

    Reads the CAPTCHA answer directly from the data-captcha-answer
    attribute the mock portal exposes on [data-testid="captcha-verification"],
    instead of requiring a human to read and type it. This bypasses the
    human-in-the-loop check entirely.

    Only use this for headless/CI-style automated test runs where no human
    is present to answer the terminal prompt — never as the default
    behavior. To use it, pass it in wrapped so it matches the no-argument
    provider signature, e.g.:

        submit_captcha(page, captcha_provider=lambda: get_captcha_from_dom_debug(page))
    """
    container = page.get_by_test_id("captcha-verification")
    return container.get_attribute("data-captcha-answer")


def submit_captcha(page, captcha_provider=get_captcha_from_terminal, max_attempts: int = 3) -> str:
    """
    Pauses automation and waits for a CAPTCHA answer from captcha_provider
    (defaults to a terminal prompt), then fills and submits it. Retries up
    to max_attempts times if the portal rejects the answer.

    Returns the CAPTCHA text that was ultimately accepted.
    """
    print("CAPTCHA verification required. Automation paused.")

    for attempt in range(1, max_attempts + 1):
        code = captcha_provider()

        page.get_by_test_id("captcha-input").fill(code)
        page.get_by_test_id("verify-captcha-button").click()

        # The mock portal's CAPTCHA check is synchronous (no simulated
        # network delay), but we still wait for the actual DOM outcome
        # rather than assuming it's instant, since React state updates
        # aren't guaranteed to be reflected the instant click() returns.
        page.wait_for_function(
            """() => {
                const btn = document.querySelector('[data-testid="next-button"]');
                const err = document.querySelector('[data-testid="captcha-error"]');
                return (btn && !btn.disabled) || err;
            }""",
            timeout=5000,
        )

        if page.get_by_test_id("captcha-error").is_visible():
            print(f"Incorrect CAPTCHA. Please try again. (attempt {attempt}/{max_attempts})")
            continue

        print("CAPTCHA verified. Resuming automation...")
        return code

    raise RuntimeError(f"CAPTCHA verification failed after {max_attempts} attempts.")


# ---------------------------------------------------------------------------
# Shared entry point
# ---------------------------------------------------------------------------

def resolve_verification_stage(page):
    """
    Convenience function: detects whichever verification type is present
    on the current step and resolves it. Both OTP and CAPTCHA now pause
    for real human input via the terminal by default.
    """
    if is_otp_stage(page):
        submit_otp(page)
    elif is_captcha_stage(page):
        submit_captcha(page)
    else:
        raise RuntimeError(
            "resolve_verification_stage() was called but neither the OTP "
            "nor CAPTCHA stage is visible. Check that the form actually "
            "reached the verification step."
        )
