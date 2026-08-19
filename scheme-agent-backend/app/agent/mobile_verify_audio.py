# generate_login_audio.py
"""
ONE-TIME SCRIPT. Run this once to generate the 4 login welcome audio files
via TTS, then never run it again — the files are static assets from here on.
Not part of the live app; not imported by anything else.
"""
import os
os.environ["HF_HUB_OFFLINE"] = "0"  # allow downloads for this one run

from voice_pipeline import english_to_voice_output

MOBILE_NUMBER_VERIFY = "Welcome to YojanaMitra. Please enter your mobile number and click on the blue button. Once you get the otp, enter the four digit code and verify your mobile number."

OUTPUT_DIR = "static_audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

LANGUAGES = ["en", "hi", "pa", "mr"]

if __name__ == "__main__":
    for lang in LANGUAGES:
        output_path = os.path.join(OUTPUT_DIR, f"mobilenumberverify_{lang}.wav")
        english_to_voice_output(MOBILE_NUMBER_VERIFY, lang, output_path)
        print(f"✅ Generated {output_path}")

    print("\nDone. These 4 files are now static assets — commit them to the repo")
    print("(or hand them to Person B), and this script never needs to run again.")