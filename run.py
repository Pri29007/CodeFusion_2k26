"""
End-to-end test runner for Person C's pipeline — no scheme catalog needed.
"""
import os
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

from dotenv import load_dotenv
load_dotenv()

from document_extraction import ExtractedProfile, extract_from_image, merge_profiles
from eligibility_matching import match_eligibility


def check_env():
    missing = [k for k in ("GROQ_API_KEY", "GEMINI_API_KEY") if not os.getenv(k)]
    if missing:
        print(f"⚠️  Missing env vars: {missing}")
    else:
        print("✅ API keys loaded.")


def test_document_extraction(image_path: str):
    print("\n--- Testing document extraction ---")
    if not os.path.exists(image_path):
        print(f"⚠️  No sample image at {image_path} — skipping.")
        return None
    profile = extract_from_image(image_path)
    print(profile.model_dump_json(indent=2))
    return profile


def test_eligibility_matching(profile: ExtractedProfile = None):
    print("\n--- Testing eligibility matching (open-ended, all schemes) ---")
    if profile is None:
        profile = ExtractedProfile(
            full_name="Ramesh Kumar",
            age=42,
            annual_income=250000,
            owns_land=True,
            land_area_acres=2.5,
            owns_pucca_house=False,
            is_government_employee=False,
            pays_income_tax=False,
            caste_category="OBC",
            state="Maharashtra",
        )
    result = match_eligibility(profile)
    for v in result.verdicts:
        status = "ELIGIBLE" if v.eligible else "NOT ELIGIBLE"
        auto = " 🤖 AUTOMATABLE" if v.is_automatable else ""
        print(f"\n{v.scheme_name} [{v.level}]{auto}: {status} ({v.confidence})")
        print(f"  Reason: {v.reason}")
        if v.missing_info:
            print(f"  Missing: {v.missing_info}")
    print(f"\nTotal eligible: {len(result.eligible_schemes)}")
    print(f"Automatable + eligible: {len(result.automatable_eligible_schemes)}")
    return result


if __name__ == "__main__":
    check_env()
    profile = test_document_extraction("sample_docs/aadhaar_sample.jpg")
    test_eligibility_matching(profile)
    print("\n✅ Run complete.")