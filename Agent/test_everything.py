"""
test_everything.py — full pipeline test, DB-dependent (since profile data
now comes from the users table, not documents). Tests eligibility matching
+ voice summary across all 4 languages against one test user.
"""
from dotenv import load_dotenv
load_dotenv()

import uuid
from db_writer import get_client
from onboarding_pipeline import run_scheme_matching_for_user

TEST_AADHAAR = "888888888888"


def insert_test_user(preferred_language: str):
    client = get_client()
    client.table("users").upsert({
        "aadhaar_number": TEST_AADHAAR,
        "auth_id": str(uuid.uuid4()),
        "phone_number": "+911234567891",
        "preferred_language": preferred_language,
        "first_name": "Ramesh",
        "last_name": "Kumar",
        "age": 42,
        "state": "Maharashtra",
        "category": "obc",
        "annual_income_range": "1l_to_2_5l",
        "housing_type": "kutcha",
        "owns_agricultural_land": True,
        "occupation": "Farmer",
    }, on_conflict="aadhaar_number").execute()


def run_test(lang_code: str):
    print(f"\n{'='*60}")
    print(f"FULL PIPELINE TEST — language: {lang_code}")
    print(f"{'='*60}")

    insert_test_user(lang_code)
    result = run_scheme_matching_for_user(TEST_AADHAAR)

    if result["status"] != "completed":
        print("❌ FAILED:", result.get("reason"))
        return

    for v in result["eligibility"]["verdicts"]:
        status = "ELIGIBLE" if v["eligible"] else "NOT ELIGIBLE"
        auto = " 🤖" if v["is_automatable"] else ""
        print(f"  {v['scheme_name']}{auto}: {status} ({v['confidence']})")

    print(f"\n  Audio URL: {result['audio_url']}")
    print(f"\n✅ PASSED for '{lang_code}'")


if __name__ == "__main__":
    for lang in ["en", "hi", "pa", "mr"]:
        run_test(lang)