"""
Voice pipeline: lets a citizen speak in English, Hindi, Punjabi, or Marathi and
hear responses back in that language. The LLM always reasons in English — this
module only translates at the boundary, and skips translation entirely when the
citizen's language already is English.
"""
import os
# os.environ["HF_HUB_OFFLINE"] = "1"
# os.environ["TRANSFORMERS_OFFLINE"] = "1"

import torch
import soundfile as sf
from transformers import pipeline, AutoModelForSeq2SeqLM, AutoTokenizer
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from config import (
    INDIC_WHISPER_MODEL, TRANSLATION_MODEL, NLLB_LANG_CODES,
    TTS_MODELS, SUPPORTED_LANGUAGES, TRANSLATED_LANGUAGES, DEFAULT_LANGUAGE,
)

_translation_model = None
_translation_tokenizer = None


def _get_translation_model():
    global _translation_model, _translation_tokenizer
    if _translation_model is None:
        _translation_tokenizer = AutoTokenizer.from_pretrained(TRANSLATION_MODEL)
        _translation_model = AutoModelForSeq2SeqLM.from_pretrained(
            TRANSLATION_MODEL,
        ).to(_DEVICE)
    return _translation_model, _translation_tokenizer


def _translate(text: str, src_lang: str, tgt_lang: str) -> str:
    model, tokenizer = _get_translation_model()
    tokenizer.src_lang = NLLB_LANG_CODES[src_lang]
    inputs = tokenizer(text, return_tensors="pt").to(_DEVICE)
    forced_bos_token_id = tokenizer.convert_tokens_to_ids(NLLB_LANG_CODES[tgt_lang])
    outputs = model.generate(**inputs, forced_bos_token_id=forced_bos_token_id, max_length=256)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)


def translate_indic_to_en(text: str, src_lang: str) -> str:
    return _translate(text, src_lang, "en")


def translate_en_to_indic(text: str, target_lang: str) -> str:
    return _translate(text, "en", target_lang)
_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Lazy-loaded singletons so we don't reload models on every call
_stt_pipeline = None
_tts_pipelines = {}


def _get_stt():
    global _stt_pipeline
    if _stt_pipeline is None:
        _stt_pipeline = pipeline(
            "automatic-speech-recognition", model=INDIC_WHISPER_MODEL, device=_DEVICE
        )
    return _stt_pipeline




def _get_tts(lang_code: str):
    if lang_code not in _tts_pipelines:
        model_id = TTS_MODELS[lang_code]
        _tts_pipelines[lang_code] = pipeline("text-to-speech", model=model_id, device=_DEVICE)
    return _tts_pipelines[lang_code]


def _validate_lang(lang_code: str):
    if lang_code not in SUPPORTED_LANGUAGES:
        raise ValueError(
            f"Unsupported language '{lang_code}'. Supported: {list(SUPPORTED_LANGUAGES)}"
        )


def speech_to_text(audio_path: str, lang_code: str) -> str:
    """Transcribe spoken audio to text, in whatever language it was spoken in."""
    _validate_lang(lang_code)
    stt = _get_stt()
    result = stt(audio_path, generate_kwargs={"language": SUPPORTED_LANGUAGES[lang_code].lower()})
    return result["text"]

def text_to_speech(text: str, lang_code: str, output_path: str = "output.wav") -> str:
    _validate_lang(lang_code)
    tts = _get_tts(lang_code)
    speech = tts(text)
    audio = speech["audio"]

    # Handle both 1D and 2D output shapes depending on model/pipeline version
    if hasattr(audio, "ndim") and audio.ndim > 1:
        audio = audio[0]

    sf.write(output_path, audio, samplerate=speech["sampling_rate"])
    return output_path


def voice_input_to_english(audio_path: str, lang_code: str) -> str:
    """
    Full pipeline: spoken audio (any supported language) -> English text for the LLM.
    If the citizen already spoke English, translation is skipped entirely.
    """
    _validate_lang(lang_code)
    spoken_text = speech_to_text(audio_path, lang_code)

    if lang_code == DEFAULT_LANGUAGE or lang_code not in TRANSLATED_LANGUAGES:
        return spoken_text  # already English, nothing to translate

    return translate_indic_to_en(spoken_text, lang_code)


def english_to_voice_output(english_text: str, lang_code: str, output_path: str = "output.wav") -> str:
    """
    Full pipeline: English LLM response -> spoken audio in the citizen's language.
    If the target language is English, translation is skipped entirely.
    """
    _validate_lang(lang_code)

    if lang_code == DEFAULT_LANGUAGE or lang_code not in TRANSLATED_LANGUAGES:
        final_text = english_text  # no translation needed
    else:
        final_text = translate_en_to_indic(english_text, lang_code)

    return text_to_speech(final_text, lang_code, output_path)


if __name__ == "__main__":
    # Test with English (no translation)
    path_en = english_to_voice_output("You are eligible for PM-KISAN.", "en")
    print("English audio saved to:", path_en)

    # Test with Punjabi (translation kicks in)
    path_pa = english_to_voice_output("You are eligible for PM-KISAN.", "pa")
    print("Punjabi audio saved to:", path_pa)