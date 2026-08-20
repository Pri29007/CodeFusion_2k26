"""
main.py

Runs the automation for a chosen scheme end-to-end, using either:
  - a real user's data fetched from the backend (--aadhaar), or
  - the sample data in data/sample_user_data.json (default)

and prints the structured result.

Run this with:

    python main.py                                   (sample data, PM-KISAN)
    python main.py pm_kisan
    python main.py pmay
    python main.py ayushman
    python main.py pm_kisan --aadhaar 123412341234    (real user from backend)

(after activating your virtual environment, installing dependencies, and
starting the mock-portals dev server — see README.md for exact steps).
"""

import argparse
import json
import os
import sys
import tempfile

import requests

from utils.browser import get_browser_and_page, close_browser
from schemes.pm_kisan import apply_pm_kisan
from schemes.pmay import apply_pmay
from schemes.ayushman import apply_ayushman


BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")


def load_sample_user_data() -> dict:
    """Loads the fake test data used to fill out the forms."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "sample_user_data.json")
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_real_user_data(aadhaar_number: str) -> dict:
    """
    Fetches a real user from the backend (GET /users/{aadhaar_number}) and
    reshapes it into the same structure the scheme functions expect
    (personal / pm_kisan / pmay / ayushman), matching sample_user_data.json.
    """
    res = requests.get(f"{BACKEND_BASE_URL}/users/{aadhaar_number}")
    if res.status_code == 404:
        raise ValueError(f"No user found with Aadhaar number {aadhaar_number}")
    res.raise_for_status()
    user = res.json()

    family_members = user.get("family_members") or []

    def s(key):
        """Get a value as a safe string for Playwright .fill() calls — never None."""
        value = user.get(key)
        return str(value) if value is not None else ""

    personal = {
        "full_name": f"{s('first_name')} {s('last_name')}".strip(),
        "dob": s("date_of_birth"),
        "gender": user.get("gender").capitalize() if user.get("gender") else "",
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
        "family_member_count": str(len(family_members)) if family_members else s("family_members_dependents") or "0",
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
        "family_size": str(len(family_members)) if family_members else s("family_members_dependents") or "0",
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
    Creates a small throwaway file to use for document upload fields.
    The mock portal only records the filename, so real file content
    doesn't matter here.
    """
    tmp_dir = tempfile.gettempdir()
    dummy_path = os.path.join(tmp_dir, "yojanamitra_dummy_document.pdf")
    with open(dummy_path, "wb") as f:
        f.write(b"%PDF-1.4 dummy test document for automation\n")
    return dummy_path


# Maps a scheme name (as typed on the command line) to its automation
# function. Adding a 4th scheme later just means adding one line here.
SCHEME_FUNCTIONS = {
    "pm_kisan": apply_pm_kisan,
    "pmay": apply_pmay,
    "ayushman": apply_ayushman,
}


def run_automation(scheme: str, aadhaar_number: str | None):
    if scheme not in SCHEME_FUNCTIONS:
        print(f"Unknown scheme '{scheme}'. Choose one of: {', '.join(SCHEME_FUNCTIONS)}")
        return

    apply_function = SCHEME_FUNCTIONS[scheme]

    print("Starting Playwright...")
    playwright, browser, page = get_browser_and_page(headless=False)

    try:
        if aadhaar_number:
            print(f"Fetching real user data for Aadhaar {aadhaar_number} from backend...")
            user_data = fetch_real_user_data(aadhaar_number)
        else:
            print("Using sample test data...")
            user_data = load_sample_user_data()

        user_data["_dummy_file_path"] = create_dummy_document()

        result = apply_function(page, user_data)

        print("\n--- RESULT ---")
        print(json.dumps(result, indent=2))

    finally:
        print("Closing browser...")
        close_browser(playwright, browser)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run scheme application automation.")
    parser.add_argument("scheme", nargs="?", default="pm_kisan", help="Scheme to run: pm_kisan, pmay, or ayushman")
    parser.add_argument("--aadhaar", default=None, help="Aadhaar number to fetch real user data from the backend")
    args = parser.parse_args()

    run_automation(args.scheme, args.aadhaar)