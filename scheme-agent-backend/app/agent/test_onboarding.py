"""
Tests run_scheme_matching_for_user() — the function B's Celery task calls.
Since we no longer write user data ourselves, this test first inserts a
fake user row directly (simulating what her /users/ signup endpoint does),
then runs your actual pipeline against it.
"""
from dotenv import load_dotenv
load_dotenv()

import uuid
from db_writer import get_client
from onboarding_pipeline import run_scheme_matching_for_user

TEST_AADHAAR = "999999999999"

def insert_test_user():
    """Simulates what Person B's signup endpoint already does — for local testing only."""
    client = get_client()
    client.table("users").upsert({
        "aadhaar_number": TEST_AADHAAR,
        "auth_id": str(uuid.uuid4()),
        "phone_number": "+911234567890",
        "preferred_language": "hi",
        "first_name": "Test",
        "last_name": "User",
        "state": "Maharashtra",
        "category": "obc",
        "annual_income_range": "1l_to_2_5l",
        "ration_card_type": "bpl",
        "housing_type": "kutcha",
        "owns_agricultural_land": True,
        "occupation": "Farmer",
    }, on_conflict="aadhaar_number").execute()
    print(f"✅ Test user inserted/updated: {TEST_AADHAAR}")


if __name__ == "__main__":
    insert_test_user()

    print("\n--- RUNNING ELIGIBILITY PIPELINE ---")
    result = run_scheme_matching_for_user(TEST_AADHAAR)

    print("\n--- RESULT STATUS ---", result["status"])

    if result["status"] == "completed":
        print("\n--- ELIGIBILITY VERDICTS ---")
        for v in result["eligibility"]["verdicts"]:
            status = "ELIGIBLE" if v["eligible"] else "NOT ELIGIBLE"
            auto = " 🤖" if v["is_automatable"] else ""
            print(f"{v['scheme_name']}{auto}: {status} ({v['confidence']})")

        print("\n--- AUDIO URL ---")
        print(result["audio_url"])
    else:
        print("Error:", result.get("reason"))