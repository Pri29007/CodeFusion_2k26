# generate_login_audio.py
"""
ONE-TIME SCRIPT. Run this once to generate the 4 login welcome audio files
via TTS, then never run it again — the files are static assets from here on.
Not part of the live app; not imported by anything else.
"""
import os
os.environ["HF_HUB_OFFLINE"] = "0"  # allow downloads for this one run

from voice_pipeline import english_to_voice_output

WELCOME_TEXT = "In the first box of basic information, enter your first name, last name, date of birth and aadhaar number in that order. After that in the second box of demographic details, add your age, gender, social category, address, city, state, and marital status. In third box of financial and household, add your ration card type, estimated annual income, housing type-whether it is kutcha or pucca, number of rooms and family members or dependents. In the occupation and assets box, enter your primary occupation and select other if your occupation is not listed and your agricultural land details. After that in the health and vulnerabilities box, enter if you are a disabled person or not and if there are any pregnant or chronically ill people in your family. Then in the last documents box, select and upload your documents. Submitting your aadhaar card is mandatory for all users. Thank you for choosing YojanaMitra."

OUTPUT_DIR = "static_audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

LANGUAGES = ["en", "hi", "pa", "mr"]

if __name__ == "__main__":
    for lang in LANGUAGES:
        output_path = os.path.join(OUTPUT_DIR, f"welcome_{lang}.wav")
        english_to_voice_output(WELCOME_TEXT, lang, output_path)
        print(f"✅ Generated {output_path}")

    print("\nDone. These 4 files are now static assets — commit them to the repo")
    print("(or hand them to Person B), and this script never needs to run again.")