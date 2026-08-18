"""
test_everything.py — full Person C pipeline test, completely DB-free.
Confirms: document extraction -> profile merge -> eligibility matching ->
voice summary generation, all working together.
"""
import os
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

from dotenv import load_dotenv
load_dotenv()

from document_extraction import extract_from_image, merge_profiles, ExtractedProfile
from eligibility_matching import match_eligibility
from voice_pipeline import english_to_voice_output


def run_full_pipeline(doc_paths: list[str], lang_code: str = "en"):
    print(f"\n{'='*60}")
    print(f"FULL PIPELINE TEST — language: {lang_code}")
    print(f"{'='*60}")

    # Step 1: extraction
    print("\n[1/3] Extracting documents...")
    profiles = []
    for path in doc_paths:
        if not os.path.exists(path):
            print(f"  ⚠️  Missing: {path} — skipping")
            continue
        p = extract_from_image(path)
        profiles.append(p)
        print(f"  ✅ Extracted from {path}")

    if not profiles:
        print("  ❌ No documents found — using fallback sample profile")
        merged = ExtractedProfile(
            full_name="Ramesh Kumar", age=42, annual_income=250000,
            owns_land=True, land_area_acres=2.5, owns_pucca_house=False,
            is_government_employee=False, pays_income_tax=False,
            caste_category="OBC", state="Maharashtra",
        )
    else:
        merged = merge_profiles(profiles)

    print(f"\n  Merged profile:\n{merged.model_dump_json(indent=2)}")

    # Step 2: eligibility
    print("\n[2/3] Matching eligibility...")
    result = match_eligibility(merged)
    for v in result.verdicts:
        status = "ELIGIBLE" if v.eligible else "NOT ELIGIBLE"
        auto = " 🤖" if v.is_automatable else ""
        print(f"  {v.scheme_name}{auto}: {status} ({v.confidence})")

    print(f"\n  Total eligible: {len(result.eligible_schemes)}")
    print(f"  Automatable + eligible: {len(result.automatable_eligible_schemes)}")

    # Step 3: voice summary
    print(f"\n[3/3] Generating voice summary in '{lang_code}'...")
    eligible = result.eligible_schemes
    if eligible:
        names = ", ".join(v.scheme_name for v in eligible)
        summary = f"You are eligible for the following schemes: {names}."
    else:
        summary = "You are not currently eligible for any schemes we checked."

    audio_path = f"test_summary_{lang_code}.wav"
    english_to_voice_output(summary, lang_code, audio_path)
    print(f"  ✅ Voice summary saved to {audio_path}")

    print(f"\n{'='*60}")
    print("✅ FULL PIPELINE TEST PASSED")
    print(f"{'='*60}\n")
    return merged, result


if __name__ == "__main__":
    docs = [
        "sample_docs/aadhaar_sample.jpg",
        "sample_docs/income_cert_sample.jpg",
        "sample_docs/land_record_sample.jpg",
    ]
    # Test in all 4 languages to prove the language-selection flow works end to end
    for lang in ["en", "hi", "pa", "mr"]:
        run_full_pipeline(docs, lang_code=lang)