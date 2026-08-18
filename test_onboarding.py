from dotenv import load_dotenv
load_dotenv()

import uuid
from onboarding_pipeline import process_signup

result = process_signup(
    aadhaar_number="999999999999",
    auth_id=str(uuid.uuid4()),
    signup_form={
        "first_name": "Test",
        "last_name": "User",
        "state": "Maharashtra",
        "annual_income": 250000,
        "category": "OBC",
    },
    document_paths={"aadhaar": "sample_docs/aadhaar_sample.jpg"},
    document_file_urls={"aadhaar": "local://test-only-not-a-real-url"},
    phone_number="+911234567890",
    preferred_language="hi",
    voice_output_path="test_full_flow_output.wav",
)

print("\n--- ELIGIBILITY VERDICTS ---")
for v in result["eligibility"]["verdicts"]:
    status = "ELIGIBLE" if v["eligible"] else "NOT ELIGIBLE"
    print(f"{v['scheme_name']}: {status} ({v['confidence']})")

print("\n--- USER SAVED ---", result["user_saved"])
print("\n--- VOICE SUMMARY TEXT ---")
print(result["voice_summary_text"])
print("\n--- VOICE AUDIO SAVED TO ---")
print(result["voice_audio_path"])