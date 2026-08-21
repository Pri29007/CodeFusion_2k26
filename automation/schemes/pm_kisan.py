"""
pm_kisan.py

Full automation for the PM-KISAN mock portal.

Flow:

    Open apply page -> Fill Personal Details -> Next
    -> Fill Land Details -> Next
    -> Fill Bank Details -> Next
    -> Upload Documents -> Next
    -> Verification (OTP) -> Next
    -> Review -> Submit
    -> Extract Application ID + Status
    -> Return structured result

All selectors below were confirmed by inspecting mock-portals source
(src/data/schemeConfigs.js), not guessed.
"""

import config
from utils.verification import resolve_verification_stage


def apply_pm_kisan(
    page,
    user_data: dict,
    application_id: str,
) -> dict:
    """
    Fills out and submits the PM-KISAN application using the given
    user_data (expects the shape found in data/sample_user_data.json,
    specifically the "personal" and "pm_kisan" sections).

    Returns a structured result:
        {
            "success": True,
            "scheme": "pm_kisan",
            "application_id": "PMK-2026-XXXXX",
            "status": "Submitted",
        }
    On failure, returns {"success": False, "scheme": "pm_kisan", "error": "..."}.
    """
    personal = user_data["personal"]
    pmk = user_data["pm_kisan"]

    try:
        print("Opening PM-KISAN apply page...")
        page.goto(config.PM_KISAN_APPLY_URL, wait_until="networkidle")

        # ---- Step 1: Personal Details ----
        print("Filling Personal Details...")
        page.get_by_test_id("full-name").fill(personal["full_name"])
        page.get_by_test_id("dob").fill(personal["dob"])
        page.get_by_test_id("gender").select_option(personal["gender"])
        page.get_by_test_id("mobile-number").fill(personal["mobile"])
        page.get_by_test_id("aadhaar-number").fill(personal["aadhaar"])
        page.get_by_test_id("address").fill(personal["address"])
        page.get_by_test_id("state").fill(personal["state"])
        page.get_by_test_id("district").fill(personal["district"])
        page.get_by_test_id("village").fill(personal["village"])
        page.get_by_test_id("next-button").click()

        # ---- Step 2: Land Details ----
        print("Filling Land Details...")
        page.get_by_test_id("land-record-id").fill(pmk["land_record_id"])
        page.get_by_test_id("survey-number").fill(pmk["survey_number"])
        page.get_by_test_id("land-area").fill(pmk["land_area"])
        page.get_by_test_id("land-location").fill(pmk["land_location"])
        page.get_by_test_id("land-district").fill(pmk["land_district"])
        page.get_by_test_id("land-state").fill(pmk["land_state"])
        page.get_by_test_id("next-button").click()

        # ---- Step 3: Bank Details ----
        print("Filling Bank Details...")
        page.get_by_test_id("account-holder-name").fill(pmk["account_holder_name"])
        page.get_by_test_id("bank-name").fill(pmk["bank_name"])
        page.get_by_test_id("account-number").fill(pmk["account_number"])
        page.get_by_test_id("ifsc-code").fill(pmk["ifsc_code"])
        page.get_by_test_id("next-button").click()

        # ---- Step 4: Documents ----
        # The mock portal only stores the filename, so any real, readable
        # file works here. A tiny dummy PDF is created by the caller (see
        # main.py) and its path passed in via user_data.
        print("Uploading documents...")
        dummy_file = user_data.get("_dummy_file_path", "sample_document.pdf")
        page.get_by_test_id("aadhaar-upload").set_input_files(dummy_file)
        page.get_by_test_id("land-record-upload").set_input_files(dummy_file)
        page.get_by_test_id("bank-proof-upload").set_input_files(dummy_file)
        page.get_by_test_id("next-button").click()

        # ---- Step 5: Verification (OTP for PM-KISAN) ----
        print("Resolving verification stage...")
        resolve_verification_stage(page, application_id)
        page.get_by_test_id("next-button").click()

        # ---- Step 6: Review + Submit ----
        print("Reviewing and submitting...")
        page.get_by_test_id("application-review").wait_for(state="visible")
        page.get_by_test_id("declaration-checkbox").check()
        page.get_by_test_id("submit-button").click()

        # ---- Step 7: Extract result ----
        page.get_by_test_id("submission-success").wait_for(
            state="visible", timeout=config.DEFAULT_TIMEOUT_MS
        )
        application_id = page.get_by_test_id("application-id").inner_text()
        status = page.get_by_test_id("application-status").inner_text()

        print(f"PM-KISAN application submitted: {application_id} ({status})")

        return {
    "success": True,
    "scheme": "pm_kisan",
    "application_id": application_id,
    "aadhaar_number": user_data["personal"]["aadhaar"],
    "status": status
}
    except Exception as error:
        print(f"PM-KISAN automation failed: {error}")
        return {
            "success": False,
            "scheme": "pm_kisan",
            "error": str(error),
        }
