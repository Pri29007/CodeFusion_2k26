"""
ayushman.py

Full automation for the Ayushman Bharat mock portal.

Flow (confirmed from mock-portals/src/data/schemeConfigs.js -> schemes.ayushman):

    Open apply page -> Fill Applicant Details -> Next
    -> Fill Family Details -> Next
    -> Fill Socioeconomic Details -> Next
    -> Upload Documents -> Next
    -> Verification (OTP) -> Next
    -> Review -> Submit
    -> Extract Application ID + Status
    -> Return structured result

All selectors and dropdown option values below were confirmed by inspecting
mock-portals source, not guessed.

Note: unlike PM-KISAN, the Ayushman "Applicant Details" step does NOT
include a village field, and the family step's count field is
"family-size" (not "family-member-count" like PMAY) — but the generated
per-member rows still use the shared family-member-{i}-name/age/relationship
testids (confirmed in mock-portals/src/components/FamilyMembers.jsx, which
hardcodes those testids regardless of which count field drove them).
"""

import config
from utils.verification import resolve_verification_stage


def apply_ayushman(page, user_data: dict) -> dict:
    """
    Fills out and submits the Ayushman Bharat application using the given
    user_data (expects the shape found in data/sample_user_data.json,
    specifically the "personal" and "ayushman" sections).

    Returns a structured result:
        {
            "success": True,
            "scheme": "ayushman",
            "application_id": "AYU-2026-XXXXX",
            "status": "Submitted",
        }
    On failure, returns {"success": False, "scheme": "ayushman", "error": "..."}.
    """
    personal = user_data["personal"]
    ayushman = user_data["ayushman"]

    try:
        print("Opening Ayushman Bharat apply page...")
        page.goto(config.AYUSHMAN_APPLY_URL, wait_until="networkidle")

        # ---- Step 1: Applicant Details ----
        # No "village" field here, unlike PM-KISAN — confirmed in schemeConfigs.js.
        print("Filling Applicant Details...")
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
        # The count field here is "family-size" (Ayushman-specific), but the
        # generated rows use the same shared family-member-{i}-name/age/
        # relationship testids as PMAY. Playwright locators auto-wait for
        # these dynamically-rendered fields, so no manual wait is needed.
        #
        # NOTE (data mismatch, not silently fixed): sample_user_data.json's
        # ayushman.family_size is "3" but ayushman.family_members only has
        # 2 entries. We fill the count field with family_size as given, but
        # loop over family_members (matching pmay.py's pattern), so only 2
        # rows actually get filled even though family_size says 3. Flagging
        # this rather than editing the JSON.
        print("Filling Family Details...")
        page.get_by_test_id("family-size").fill(ayushman["family_size"])
        for i, member in enumerate(ayushman["family_members"]):
            page.get_by_test_id(f"family-member-{i}-name").fill(member["name"])
            page.get_by_test_id(f"family-member-{i}-age").fill(member["age"])
            page.get_by_test_id(f"family-member-{i}-relationship").fill(member["relationship"])
        page.get_by_test_id("next-button").click()

        # ---- Step 3: Socioeconomic Details ----
        # income-category options: ["BPL", "APL", "EWS"]
        # household-category options: ["Rural", "Urban"]
        print("Filling Socioeconomic Details...")
        page.get_by_test_id("income-category").select_option(ayushman["income_category"])
        page.get_by_test_id("occupation").fill(ayushman["occupation"])
        page.get_by_test_id("household-category").select_option(ayushman["household_category"])
        page.get_by_test_id("next-button").click()

        # ---- Step 4: Documents ----
        # Ayushman only requires two documents (no bank/land proof, unlike
        # the other schemes) — confirmed in schemeConfigs.js.
        print("Uploading documents...")
        dummy_file = user_data.get("_dummy_file_path", "sample_document.pdf")
        page.get_by_test_id("aadhaar-upload").set_input_files(dummy_file)
        page.get_by_test_id("income-certificate-upload").set_input_files(dummy_file)
        page.get_by_test_id("next-button").click()

        # ---- Step 5: Verification (OTP for Ayushman) ----
        # Reuses the shared verification system — no OTP logic is
        # duplicated here. resolve_verification_stage() detects the OTP
        # stage and pauses for real human input via the terminal (see
        # utils/verification.py).
        print("Resolving verification stage...")
        resolve_verification_stage(page)
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

        print(f"Ayushman Bharat application submitted: {application_id} ({status})")

        return {
            "success": True,
            "scheme": "ayushman",
            "application_id": application_id,
            "aadhaar_number": user_data["personal"]["aadhaar"],
            "status": status,
        }

    except Exception as error:
        print(f"Ayushman Bharat automation failed: {error}")
        return {
            "success": False,
            "scheme": "ayushman",
            "error": str(error),
        }
