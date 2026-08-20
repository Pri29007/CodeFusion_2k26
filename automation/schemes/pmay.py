"""
pmay.py

Full automation for the PMAY mock portal.

Flow:

    Open apply page -> Fill Personal Details -> Next
    -> Fill Family Details -> Next
    -> Fill Financial Details -> Next
    -> Fill Housing Details -> Next
    -> Fill Bank Details -> Next
    -> Upload Documents -> Next
    -> Verification (CAPTCHA) -> Next
    -> Review -> Submit
    -> Extract Application ID + Status
    -> Return structured result

All selectors and dropdown option values below were confirmed by inspecting
mock-portals source (src/data/schemeConfigs.js), not guessed.
"""

import config
from utils.verification import resolve_verification_stage


def apply_pmay(page, user_data: dict) -> dict:
    """
    Fills out and submits the PMAY application using the given user_data
    (expects the shape found in data/sample_user_data.json, specifically
    the "personal" and "pmay" sections).

    Returns a structured result:
        {
            "success": True,
            "scheme": "pmay",
            "application_id": "PMAY-2026-XXXXX",
            "status": "Submitted",
        }
    On failure, returns {"success": False, "scheme": "pmay", "error": "..."}.
    """
    personal = user_data["personal"]
    pmay = user_data["pmay"]

    try:
        print("Opening PMAY apply page...")
        page.goto(config.PMAY_APPLY_URL, wait_until="networkidle")

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
        page.get_by_test_id("next-button").click()

        # ---- Step 2: Family Details ----
        # Filling family-member-count first causes the portal to render
        # that many dynamic rows (family-member-{i}-name/age/relationship).
        # Playwright locators auto-wait for elements to appear, so no
        # explicit wait is needed before filling the generated rows.
        print("Filling Family Details...")
        page.get_by_test_id("family-member-count").fill(pmay["family_member_count"])
        for i, member in enumerate(pmay["family_members"]):
            page.get_by_test_id(f"family-member-{i}-name").fill(member["name"])
            page.get_by_test_id(f"family-member-{i}-age").fill(member["age"])
            page.get_by_test_id(f"family-member-{i}-relationship").fill(member["relationship"])
        page.get_by_test_id("next-button").click()

        # ---- Step 3: Financial Details ----
        # employment-status is a <select> with fixed options:
        # ["Salaried", "Self-employed", "Daily wage", "Unemployed"]
        print("Filling Financial Details...")
        page.get_by_test_id("annual-income").fill(pmay["annual_income"])
        page.get_by_test_id("occupation").fill(pmay["occupation"])
        page.get_by_test_id("employment-status").select_option(pmay["employment_status"])
        page.get_by_test_id("next-button").click()

        # ---- Step 4: Housing Details ----
        # housing-type options: ["Kutcha", "Semi-pucca", "Rented", "Homeless"]
        # ownership-status options: ["No house owned", "Jointly owned", "Owned elsewhere"]
        print("Filling Housing Details...")
        page.get_by_test_id("housing-type").select_option(pmay["housing_type"])
        page.get_by_test_id("ownership-status").select_option(pmay["ownership_status"])
        page.get_by_test_id("living-conditions").fill(pmay["living_conditions"])
        page.get_by_test_id("next-button").click()

        # ---- Step 5: Bank Details ----
        print("Filling Bank Details...")
        page.get_by_test_id("account-holder-name").fill(pmay["account_holder_name"])
        page.get_by_test_id("bank-name").fill(pmay["bank_name"])
        page.get_by_test_id("account-number").fill(pmay["account_number"])
        page.get_by_test_id("ifsc-code").fill(pmay["ifsc_code"])
        page.get_by_test_id("next-button").click()

        # ---- Step 6: Document Upload ----
        # The mock portal only stores the filename, so any real, readable
        # file works here. A tiny dummy PDF is created by the caller (see
        # main.py) and its path passed in via user_data.
        print("Uploading documents...")
        dummy_file = user_data.get("_dummy_file_path", "sample_document.pdf")
        page.get_by_test_id("aadhaar-upload").set_input_files(dummy_file)
        page.get_by_test_id("income-certificate-upload").set_input_files(dummy_file)
        page.get_by_test_id("address-proof-upload").set_input_files(dummy_file)
        page.get_by_test_id("next-button").click()

        # ---- Step 7: Verification (CAPTCHA for PMAY) ----
        # Reuses the shared verification system — no CAPTCHA logic is
        # duplicated here. resolve_verification_stage() detects the CAPTCHA
        # stage and pauses for real human input via the terminal (see
        # utils/verification.py).
        print("Resolving verification stage...")
        resolve_verification_stage(page)
        page.get_by_test_id("next-button").click()

        # ---- Step 8: Review + Submit ----
        print("Reviewing and submitting...")
        page.get_by_test_id("application-review").wait_for(state="visible")
        page.get_by_test_id("declaration-checkbox").check()
        page.get_by_test_id("submit-button").click()

        # ---- Step 9: Extract result ----
        page.get_by_test_id("submission-success").wait_for(
            state="visible", timeout=config.DEFAULT_TIMEOUT_MS
        )
        application_id = page.get_by_test_id("application-id").inner_text()
        status = page.get_by_test_id("application-status").inner_text()

        print(f"PMAY application submitted: {application_id} ({status})")

        return {
            "success": True,
            "scheme": "pmay",
            "application_id": application_id,
            "aadhaar_number": user_data["personal"]["aadhaar"],
            "status": status,
        }

    except Exception as error:
        print(f"PMAY automation failed: {error}")
        return {
            "success": False,
            "scheme": "pmay",
            "error": str(error),
        }
