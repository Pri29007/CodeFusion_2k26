"""
One-time script to upload/update static audio files into the Supabase
'static-audio' bucket. Reads directly from a zip file.

Run from the scheme-agent-backend folder:
    python upload_static_audio.py
"""

import os
import zipfile
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY"),
)

BUCKET_NAME = "static-audio"
ZIP_PATH = Path("../static_audio_new.zip")  # zip is one level up, in CodeFusion_2k26_database root

if not ZIP_PATH.exists():
    print(f"ERROR: '{ZIP_PATH}' not found.")
    exit(1)

with zipfile.ZipFile(ZIP_PATH, "r") as zf:
    wav_names = [name for name in zf.namelist() if name.endswith(".wav")]

    if not wav_names:
        print("ERROR: no .wav files found inside the zip.")
        exit(1)

    print(f"Found {len(wav_names)} files. Uploading to bucket '{BUCKET_NAME}'...\n")

    for name in wav_names:
        file_name = Path(name).name
        file_bytes = zf.read(name)

        try:
            supabase.storage.from_(BUCKET_NAME).upload(
                file_name,
                file_bytes,
                {"content-type": "audio/wav"},
            )
            print(f"✅ Uploaded (new): {file_name}")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                supabase.storage.from_(BUCKET_NAME).update(
                    file_name,
                    file_bytes,
                    {"content-type": "audio/wav"},
                )
                print(f"🔁 Updated (already existed): {file_name}")
            else:
                print(f"❌ Failed: {file_name} — {e}")

print("\nDone.")