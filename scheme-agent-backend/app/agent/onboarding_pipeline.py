"""
The function Person B's Celery task calls. Fetches the already-saved user
row, runs eligibility matching, saves verdicts, generates + uploads a
voice summary. Reads existing data only — writes only schemes + audio,
per the agreed division of responsibility.
"""
from dotenv import load_dotenv
load_dotenv()

import os
import uuid

from eligibility_matching import match_eligibility
from profile_mapper import db_row_to_profile
from db_writer import (
    get_user_by_aadhaar,
    save_eligibility_results,
    upload_audio_and_get_url,
    update_user_audio_url,
)
from voice_pipeline import english_to_voice_output

TEMP_AUDIO_DIR = "/tmp/yojanamitra_audio"
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)


def run_scheme_matching_for_user(aadhaar_number: str) -> dict:
    """
    Called by Person B's Celery task (run_scheme_matching) right after signup.
    """
    user_row = get_user_by_aadhaar(aadhaar_number)
    if not user_row:
        return {"status": "error", "reason": f"No user found for {aadhaar_number}"}

    profile = db_row_to_profile(user_row)
    preferred_language = user_row.get("preferred_language", "hi")

    # 1. Eligibility matching
    result = match_eligibility(profile)
    print("\n--- RAW ELIGIBILITY RESULT ---")
    print(result.model_dump_json(indent=2))
    save_eligibility_results(aadhaar_number, result)
    # 2. Voice summary
    eligible = result.eligible_schemes
    if eligible:
        names = ", ".join(v.scheme_name for v in eligible)
        summary_text = f"You are eligible for the following schemes: {names}. Click on the blue button to apply."
    else:
        summary_text = "You are not currently eligible for any schemes we checked."

    local_wav_path = os.path.join(TEMP_AUDIO_DIR, f"{uuid.uuid4()}.wav")
    english_to_voice_output(summary_text, preferred_language, local_wav_path)
    print(f"✅ Local audio generated at: {local_wav_path}")
    try:
        audio_url = upload_audio_and_get_url(aadhaar_number, local_wav_path, preferred_language)
        update_user_audio_url(aadhaar_number, audio_url)
        print(f"✅ Audio uploaded to Supabase: {audio_url}")
    except Exception as e:
        print(f"⚠️  Audio upload failed (likely missing 'eligibility-audio' bucket): {e}")
        audio_url = None  # don't crash — return what we have
    return {
        "status": "completed",
        "aadhaar_number": aadhaar_number,
        "eligible_count": len(eligible),
        "eligibility": result.model_dump(),
        "audio_url": audio_url,
        "local_audio_path": local_wav_path,  # useful for local listening even without Storage
    }