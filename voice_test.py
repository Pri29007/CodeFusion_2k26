"""
Standalone test for voice input -> English -> voice output with translation.
No Groq, no Gemini, no database needed — just the voice_pipeline module.
"""
import os
os.environ["HF_HUB_OFFLINE"] = "1"  # keep online for first-time model downloads; flip to "1" after
os.environ["TRANSFROMERS_OFFLINE"] = "1"
from voice_pipeline import (
    voice_input_to_english,
    english_to_voice_output,
    speech_to_text,
    text_to_speech,
)
def preload_all_models():
    from voice_pipeline import _get_stt, _get_translation_model, _get_tts
    _get_stt()
    _get_translation_model()
    for lang in ["en", "hi", "pa", "mr"]:
        _get_tts(lang)
    print("✅ All models preloaded.")
def test_text_to_speech_only(lang_code: str, text: str):
    """Simplest possible test — no audio input needed, just generate speech."""
    print(f"\n--- TTS test: {lang_code} ---")
    path = text_to_speech(text, lang_code, output_path=f"test_output_{lang_code}.wav")
    print(f"Saved: {path}")


def test_full_output_pipeline(lang_code: str, english_text: str):
    """English text -> translated -> spoken audio."""
    print(f"\n--- Full output pipeline: en -> {lang_code} ---")
    path = english_to_voice_output(english_text, lang_code, output_path=f"reply_{lang_code}.wav")
    print(f"Saved: {path}")


def test_full_input_pipeline(audio_path: str, lang_code: str):
    """Spoken audio -> English text. Requires a real audio file."""
    print(f"\n--- Full input pipeline: {lang_code} -> en ---")
    if not os.path.exists(audio_path):
        print(f"⚠️  No audio file at {audio_path} — skipping. Record a short clip to test this.")
        return
    english = voice_input_to_english(audio_path, lang_code)
    print(f"Transcribed + translated to English: {english}")


if __name__ == "__main__":
    test_text_to_speech_only("en", "You are eligible for PM Kisan.")
    test_text_to_speech_only("hi", "आप पीएम किसान योजना के लिए पात्र हैं।")
    test_text_to_speech_only("pa", "ਤੁਸੀ ਪੀਐਮ ਕਿਸਾਨ ਯੋਜਨਾ ਲਈ ਯਗ ਹੋ।")
    test_text_to_speech_only("mr", "तुम्ही पीएम किसान योजनेसठी पात्र आहात.")

    test_full_output_pipeline("hi", "Your application has been submitted successfully.")

    # Step 3: only run once you have a real recorded audio clip
    test_full_input_pipeline("sample_audio/query_hi.wav", "hi")