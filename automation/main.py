"""
main.py

Runs the automation for a chosen scheme end-to-end using the sample data in
data/sample_user_data.json, and prints the structured result.

Run this with:

    python main.py               (defaults to PM-KISAN)
    python main.py pm_kisan
    python main.py pmay
    python main.py ayushman

(after activating your virtual environment, installing dependencies, and
starting the mock-portals dev server — see README.md for exact steps).
"""

import json
import os
import sys
import tempfile

from utils.browser import get_browser_and_page, close_browser
from schemes.pm_kisan import apply_pm_kisan
from schemes.pmay import apply_pmay
from schemes.ayushman import apply_ayushman


def load_sample_user_data() -> dict:
    """Loads the fake test data used to fill out the forms."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "sample_user_data.json")
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


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


def run_automation(scheme: str):
    if scheme not in SCHEME_FUNCTIONS:
        print(f"Unknown scheme '{scheme}'. Choose one of: {', '.join(SCHEME_FUNCTIONS)}")
        return

    apply_function = SCHEME_FUNCTIONS[scheme]

    print("Starting Playwright...")
    playwright, browser, page = get_browser_and_page(headless=False)

    try:
        user_data = load_sample_user_data()
        user_data["_dummy_file_path"] = create_dummy_document()

        result = apply_function(page, user_data)

        print("\n--- RESULT ---")
        print(json.dumps(result, indent=2))

    finally:
        print("Closing browser...")
        close_browser(playwright, browser)


if __name__ == "__main__":
    chosen_scheme = sys.argv[1] if len(sys.argv) > 1 else "pm_kisan"
    run_automation(chosen_scheme)
