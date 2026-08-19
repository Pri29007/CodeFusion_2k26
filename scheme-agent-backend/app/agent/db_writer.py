"""
Persistence layer.

This module:
- READS existing user data from `users`
- WRITES scheme eligibility/application verdicts to `applications`
- WRITES the generated audio file to the `static-audio` bucket
- WRITES the resulting audio URL to `users.eligibility_audio_url`

It does NOT create or modify user signup/document data.
"""

import os
from typing import Optional

from supabase import create_client, Client

from eligibility_matching import EligibilityResult


# -------------------------------------------------------------------
# Supabase configuration
# -------------------------------------------------------------------

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # service_role key

AUDIO_BUCKET = "static-audio"


def get_client() -> Client:
    """
    Create and return a Supabase client.
    """

    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL environment variable is not set.")

    if not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_KEY environment variable is not set.")

    return create_client(SUPABASE_URL, SUPABASE_KEY)


# -------------------------------------------------------------------
# USERS
# -------------------------------------------------------------------

def get_user_by_aadhaar(aadhaar_number: str) -> Optional[dict]:
    """
    READ ONLY.

    Fetch the user row that Person B created during signup.
    """

    client = get_client()

    try:
        response = (
            client
            .table("users")
            .select("*")
            .eq("aadhaar_number", aadhaar_number)
            .execute()
        )

        print("\n=== USER LOOKUP ===")
        print("Aadhaar:", aadhaar_number)
        print("User found:", bool(response.data))

        return response.data[0] if response.data else None

    except Exception as e:
        print("\n=== USER LOOKUP FAILED ===")
        print("Aadhaar:", aadhaar_number)
        print("Error:", repr(e))
        raise


# -------------------------------------------------------------------
# APPLICATION / ELIGIBILITY RESULTS
# -------------------------------------------------------------------

def save_eligibility_results(
    aadhaar_number: str,
    result: EligibilityResult
) -> list[dict]:
    """
    WRITE.

    Save one application row for every scheme verdict.

    The actual database column is:
        applications.aadhaar_number

    This matches the Application SQLAlchemy model:

        user_id = Column(
            "aadhaar_number",
            ForeignKey("users.aadhaar_number")
        )
    """

    client = get_client()

    # ---------------------------------------------------------------
    # Prepare rows
    # ---------------------------------------------------------------

    rows = [
        {
            "aadhaar_number": aadhaar_number,
            "scheme_name": verdict.scheme_name,
            "status": (
                "eligible"
                if verdict.eligible
                else "not_eligible"
            ),
            "form_data": verdict.model_dump(),
        }
        for verdict in result.verdicts
    ]

    print("\n========================================")
    print("SAVING ELIGIBILITY RESULTS")
    print("========================================")
    print("Aadhaar:", aadhaar_number)
    print("Number of rows:", len(rows))

    for row in rows:
        print(
            "  -",
            row["scheme_name"],
            "|",
            row["status"]
        )

    # ---------------------------------------------------------------
    # Don't attempt an empty insert
    # ---------------------------------------------------------------

    if not rows:
        print("No eligibility verdicts to save.")
        return []

    # ---------------------------------------------------------------
    # Insert into applications
    # ---------------------------------------------------------------

    try:
        response = (
            client
            .table("applications")
            .insert(rows)
            .execute()
        )

        print("\n========================================")
        print("SUPABASE INSERT RESPONSE")
        print("========================================")
        print("Inserted rows:", response.data)

        # -----------------------------------------------------------
        # Verification query
        # -----------------------------------------------------------
        #
        # This immediately reads the database again to confirm that
        # the rows can actually be retrieved.
        # -----------------------------------------------------------

        verification = (
            client
            .table("applications")
            .select("*")
            .eq("aadhaar_number", aadhaar_number)
            .execute()
        )

        print("\n========================================")
        print("DATABASE VERIFICATION")
        print("========================================")
        print(
            "Applications found for Aadhaar:",
            len(verification.data)
        )

        for application in verification.data:
            print(
                "  -",
                application.get("scheme_name"),
                "|",
                application.get("status")
            )

        return response.data

    except Exception as e:
        print("\n========================================")
        print("SUPABASE APPLICATION INSERT FAILED")
        print("========================================")
        print("Aadhaar:", aadhaar_number)
        print("Error type:", type(e).__name__)
        print("Error:", repr(e))

        # Re-raise so the API knows that saving failed.
        raise


# -------------------------------------------------------------------
# AUDIO STORAGE
# -------------------------------------------------------------------

def upload_audio_and_get_url(
    aadhaar_number: str,
    local_wav_path: str,
    lang_code: str
) -> str:
    """
    WRITE.

    Upload generated WAV audio to the `static-audio` bucket
    and return its public URL.
    """

    client = get_client()

    if not os.path.exists(local_wav_path):
        raise FileNotFoundError(
            f"Audio file does not exist: {local_wav_path}"
        )

    storage_path = (
        f"{aadhaar_number}/summary_{lang_code}.wav"
    )

    print("\n========================================")
    print("UPLOADING AUDIO")
    print("========================================")
    print("Bucket:", AUDIO_BUCKET)
    print("Storage path:", storage_path)
    print("Local file:", local_wav_path)

    try:
        with open(local_wav_path, "rb") as f:
            audio_bytes = f.read()

        response = (
            client
            .storage
            .from_(AUDIO_BUCKET)
            .upload(
                storage_path,
                audio_bytes,
                {
                    "content-type": "audio/wav",
                    "upsert": "true",
                },
            )
        )

        print("Storage upload response:", response)

        audio_url = (
            f"{SUPABASE_URL}"
            f"/storage/v1/object/public/"
            f"{AUDIO_BUCKET}/"
            f"{storage_path}"
        )

        print("Generated audio URL:", audio_url)

        return audio_url

    except Exception as e:
        print("\n========================================")
        print("AUDIO UPLOAD FAILED")
        print("========================================")
        print("Bucket:", AUDIO_BUCKET)
        print("Storage path:", storage_path)
        print("Error type:", type(e).__name__)
        print("Error:", repr(e))

        raise


# -------------------------------------------------------------------
# UPDATE USER AUDIO URL
# -------------------------------------------------------------------

def update_user_audio_url(
    aadhaar_number: str,
    audio_url: str
) -> Optional[dict]:
    """
    WRITE.

    This is the only field in `users` that this module is allowed
    to modify:

        eligibility_audio_url
    """

    client = get_client()

    print("\n========================================")
    print("UPDATING USER AUDIO URL")
    print("========================================")
    print("Aadhaar:", aadhaar_number)
    print("Audio URL:", audio_url)

    try:
        response = (
            client
            .table("users")
            .update(
                {
                    "eligibility_audio_url": audio_url
                }
            )
            .eq("aadhaar_number", aadhaar_number)
            .execute()
        )

        print("Update response:", response.data)

        return response.data[0] if response.data else None

    except Exception as e:
        print("\n========================================")
        print("USER AUDIO URL UPDATE FAILED")
        print("========================================")
        print("Aadhaar:", aadhaar_number)
        print("Error type:", type(e).__name__)
        print("Error:", repr(e))

        raise