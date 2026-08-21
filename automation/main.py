
"""
main.py

Runs the automation for a chosen scheme end-to-end, using either:
  - a real user's data fetched from the backend (--aadhaar), or
  - the sample data in data/sample_user_data.json (default)

Run this with:

    python main.py
    python main.py pm_kisan
    python main.py pmay
    python main.py ayushman

With real backend data:

    python main.py pm_kisan --aadhaar 123412341234

When triggered by the backend:

    python main.py pm_kisan --aadhaar 123412341234 --application-id SOME-ID
"""

import argparse
import json
import os
import tempfile

import requests

from utils.browser import get_browser_and_page, close_browser
from schemes.pm_kisan import apply_pm_kisan
from schemes.pmay import apply_pmay
from schemes.ayushman import apply_ayushman


BACKEND_BASE_URL = os.getenv(
    "BACKEND_BASE_URL",
    "http://localhost:8000"
)


def load_sample_user_data() -> dict:
    """Loads the fake test data used to fill out the forms."""

    data_path = os.path.join(
        os.path.dirname(__file__),
        "data",
        "sample_user_data.json",
    )

    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_real_user_data(aadhaar_number: str) -> dict:
    """
    Fetches a user from the backend and reshapes the data into the
    structure expected by the scheme automation files.
    """

    res = requests.get(
        f"{BACKEND_BASE_URL}/users/{aadhaar_number}"
    )

    if res.status_code == 404:
        raise ValueError(
            f"No user found with Aadhaar number {aadhaar_number}"
        )

    res.raise_for_status()

    user = res.json()

    family_members = user.get("family_members") or []

    def s(key):
        """Safely convert backend values to strings."""
        value = user.get(key)
        return str(value) if value is not None else ""

    personal = {
        "full_name": (
            f"{s('first_name')} {s('last_name')}"
        ).strip(),

        "dob": s("date_of_birth"),

        "gender": (
            user.get("gender").capitalize()
            if user.get("gender")
            else ""
        ),

        "mobile": s("phone_number"),
        "aadhaar": s("aadhaar_number"),
        "address": s("address"),
        "state": s("state"),
        "district": s("district"),
        "village": s("village"),
    }

    pm_kisan = {
        "land_record_id": s("land_record_id"),
        "survey_number": s("survey_number"),
        "land_area": s("land_area_acres"),
        "land_location": s("land_location"),
        "land_district": s("district"),
        "land_state": s("state"),

        "account_holder_name": s("account_holder_name"),
        "bank_name": s("bank_name"),
        "account_number": s("account_number"),
        "ifsc_code": s("ifsc_code"),
    }

    pmay = {
        "family_member_count": (
            str(len(family_members))
            if family_members
            else s("family_members_dependents") or "0"
        ),

        "family_members": family_members,

        "annual_income": s("annual_income_range"),
        "occupation": s("occupation"),
        "employment_status": s("employment_status"),

        "housing_type": s("housing_type"),
        "ownership_status": s("ownership_status"),
        "living_conditions": s("living_conditions"),

        "account_holder_name": s("account_holder_name"),
        "bank_name": s("bank_name"),
        "account_number": s("account_number"),
        "ifsc_code": s("ifsc_code"),
    }

    ayushman = {
        "family_size": (
            str(len(family_members))
            if family_members
            else s("family_members_dependents") or "0"
        ),

        "family_members": family_members,

        "income_category": s("income_category"),
        "occupation": s("occupation"),
        "household_category": s("household_category"),
    }

    return {
        "personal": personal,
        "pm_kisan": pm_kisan,
        "pmay": pmay,
        "ayushman": ayushman,
    }


def create_dummy_document() -> str:
    """
    Creates a temporary dummy PDF for mock portal document uploads.
    """

    tmp_dir = tempfile.gettempdir()

    dummy_path = os.path.join(
        tmp_dir,
        "yojanamitra_dummy_document.pdf",
    )

    with open(dummy_path, "wb") as f:
        f.write(
            b"%PDF-1.4 dummy test document for automation\n"
        )

    return dummy_path


# Maps the scheme name to the corresponding automation function.
SCHEME_FUNCTIONS = {
    "pm_kisan": apply_pm_kisan,
    "pmay": apply_pmay,
    "ayushman": apply_ayushman,
}


def run_automation(
    scheme: str,
    aadhaar_number: str | None,
    application_id: str | None,
):
    """
    Starts Playwright and runs the selected scheme automation.
    """

    if scheme not in SCHEME_FUNCTIONS:
        print(
            f"Unknown scheme '{scheme}'. "
            f"Choose one of: {', '.join(SCHEME_FUNCTIONS)}"
        )
        return

    # The backend should provide this ID when real automation is triggered.
    if not application_id:
        application_id = "local-demo"

    apply_function = SCHEME_FUNCTIONS[scheme]

    print("Starting Playwright...")

    playwright, browser, page = get_browser_and_page(
        headless=False
    )

    try:
        if aadhaar_number:
            print(
                f"Fetching real user data for Aadhaar "
                f"{aadhaar_number} from backend..."
            )

            user_data = fetch_real_user_data(
                aadhaar_number
            )

        else:
            print("Using sample test data...")

            user_data = load_sample_user_data()

        # Add temporary file path for document uploads.
        user_data["_dummy_file_path"] = (
            create_dummy_document()
        )

        print(
            f"Starting {scheme} automation "
            f"for application ID: {application_id}"
        )

        # Every scheme function now receives:
        # page, user_data, application_id
        result = apply_function(
            page,
            user_data,
            application_id,
        )

        print("\n--- RESULT ---")

        print(
            json.dumps(
                result,
                indent=2,
            )
        )

    except Exception as error:

        print("\n--- AUTOMATION ERROR ---")
        print(error)

        raise

    finally:

        # Keep browser open only when running manually.
        # When called from FastAPI, remove/comment this input line
        # because subprocess.run() can get stuck waiting for terminal input.

        if not aadhaar_number:
            input(
                "\nPress Enter to close the browser..."
            )

        print("Closing browser...")

        close_browser(
            playwright,
            browser,
        )


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="Run scheme application automation."
    )

    parser.add_argument(
        "scheme",
        nargs="?",
        default="pm_kisan",
        help=(
            "Scheme to run: "
            "pm_kisan, pmay, or ayushman"
        ),
    )

    parser.add_argument(
        "--aadhaar",
        default=None,
        help=(
            "Aadhaar number used to fetch "
            "real user data from the backend"
        ),
    )

    parser.add_argument(
        "--application-id",
        default=None,
        help=(
            "Unique backend application ID used "
            "for OTP/CAPTCHA communication"
        ),
    )

    args = parser.parse_args()

    run_automation(
        args.scheme,
        args.aadhaar,
        args.application_id,
    )

