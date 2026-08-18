"""
Persistence layer. Per the agreed split: this module only WRITES scheme
verdicts and the audio URL. Everything else (user signup data, documents)
is written by Person B's users.py — we only ever READ that data.
"""
import os
from supabase import create_client
from eligibility_matching import EligibilityResult

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # service_role key


def get_client():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_user_by_aadhaar(aadhaar_number: str) -> dict | None:
    """READ ONLY — fetch the user row Person B already created at signup."""
    client = get_client()
    response = client.table("users").select("*").eq("aadhaar_number", aadhaar_number).execute()
    return response.data[0] if response.data else None


def save_eligibility_results(aadhaar_number: str, result: EligibilityResult) -> list[dict]:
    """WRITE — one row per scheme verdict, into `applications`."""
    client = get_client()
    rows = [
        {
            "aadhaar_number": aadhaar_number,   # <-- fixed: was "user_id"
            "scheme_name": v.scheme_name,
            "status": "eligible" if v.eligible else "not_eligible",
            "form_data": v.model_dump(),
        }
        for v in result.verdicts
    ]
    response = client.table("applications").insert(rows).execute()
    return response.data


def upload_audio_and_get_url(aadhaar_number: str, local_wav_path: str, lang_code: str) -> str:
    """WRITE — uploads generated audio to Storage, returns public URL."""
    client = get_client()
    storage_path = f"{aadhaar_number}/summary_{lang_code}.wav"
    with open(local_wav_path, "rb") as f:
        client.storage.from_("eligibility-audio").upload(
            storage_path, f.read(), {"content-type": "audio/wav", "upsert": "true"}
        )
    return f"{SUPABASE_URL}/storage/v1/object/public/eligibility-audio/{storage_path}"


def update_user_audio_url(aadhaar_number: str, audio_url: str) -> dict:
    """WRITE — the one field on `users` we're allowed to touch: eligibility_audio_url."""
    client = get_client()
    response = client.table("users").update({"eligibility_audio_url": audio_url}).eq(
        "aadhaar_number", aadhaar_number
    ).execute()
    return response.data[0] if response.data else None