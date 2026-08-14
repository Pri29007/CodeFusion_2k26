"""
Voice pipeline: lets a citizen speak in their own language and hear responses back
in that language, while all internal LLM reasoning happens in English.

Flow: local language audio -> IndicWhisper (STT) -> IndicTrans2 (indic->en) ->
      [LLM logic happens elsewhere, in English] ->
      IndicTrans2 (en->indic) -> Indic Parler-TTS (speech out)
"""
import torch
import soundfile as sf
from transformers import pipeline, AutoModelForSeq2SeqLM, AutoTokenizer

from config import (
    INDIC_WHISPER_MODEL,
    INDIC_TRANS2_MODEL,
    INDIC_TRANS2_MODEL_EN_INDIC,
    INDIC_TTS_MODEL,
    SUPPORTED_LANGUAGES,
)

_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Lazy-loaded singletons so we don't reload models on every call
_stt_pipeline = None
_indic_to_en_model = None
_indic_to_en_tokenizer = None
_en_to_indic_model = None
_en_to_indic_tokenizer = None
_tts_pipeline = None


def _get_stt():
    global _stt_pipeline
    if _stt_pipeline is None:
        _stt_pipeline = pipeline(
            "automatic-speech-recognition", model=INDIC_WHISPER_MODEL, device=_DEVICE
        )
    return _stt_pipeline


def _get_translation_models():
    global _indic_to_en_model, _indic_to_en_tokenizer, _en_to_indic_model, _en_to_indic_tokenizer
    if _indic_to_en_model is None:
        _indic_to_en_tokenizer = AutoTokenizer.from_pretrained(INDIC_TRANS2_MODEL, trust_remote_code=True)
        _indic_to_en_model = AutoModelForSeq2SeqLM.from_pretrained(
            INDIC_TRANS2_MODEL, trust_remote_code=True
        ).to(_DEVICE)
        _en_to_indic_tokenizer = AutoTokenizer.from_pretrained(INDIC_TRANS2_MODEL_EN_INDIC, trust_remote_code=True)
        _en_to_indic_model = AutoModelForSeq2SeqLM.from_pretrained(
            INDIC_TRANS2_MODEL_EN_INDIC, trust_remote_code=True
        ).to(_DEVICE)
    return _indic_to_en_model, _indic_to_en_tokenizer, _en_to_indic_model, _en_to_indic_tokenizer


def _get_tts():
    global _tts_pipeline
    if _tts_pipeline is None:
        _tts_pipeline = pipeline("text-to-speech", model=INDIC_TTS_MODEL, device=_DEVICE)
    return _tts_pipeline


def speech_to_text(audio_path: str, lang_code: str) -> str:
    """Transcribe spoken audio in an Indian language to text (still in that language)."""
    if lang_code not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language: {lang_code}")
    stt = _get_stt()
    result = stt(audio_path, generate_kwargs={"language": SUPPORTED_LANGUAGES[lang_code].lower()})
    return result["text"]


def translate_indic_to_en(text: str, src_lang: str) -> str:
    model, tokenizer, _, _ = _get_translation_models()
    inputs = tokenizer(f"{src_lang} {text}", return_tensors="pt").to(_DEVICE)
    outputs = model.generate(**inputs, max_length=256, num_beams=5)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)


def translate_en_to_indic(text: str, target_lang: str) -> str:
    _, _, model, tokenizer = _get_translation_models()
    inputs = tokenizer(f"{target_lang} {text}", return_tensors="pt").to(_DEVICE)
    outputs = model.generate(**inputs, max_length=256, num_beams=5)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)


def text_to_speech(text: str, lang_code: str, output_path: str = "output.wav") -> str:
    """Synthesize speech from text in the target Indian language, save to a wav file."""
    tts = _get_tts()
    speech = tts(text, forward_params={"language": lang_code})
    sf.write(output_path, speech["audio"], samplerate=speech["sampling_rate"])
    return output_path


def voice_input_to_english(audio_path: str, lang_code: str) -> str:
    """Full pipeline: spoken local-language audio -> English text for the LLM."""
    local_text = speech_to_text(audio_path, lang_code)
    return translate_indic_to_en(local_text, lang_code)


def english_to_voice_output(english_text: str, lang_code: str, output_path: str = "output.wav") -> str:
    """Full pipeline: English LLM response -> spoken local-language audio."""
    local_text = translate_en_to_indic(english_text, lang_code)
    return text_to_speech(local_text, lang_code, output_path)


if __name__ == "__main__":
    # quick manual test
    english = voice_input_to_english("sample_audio/query_hi.wav", "hi")
    print("Transcribed + translated:", english)
    path = english_to_voice_output("You are eligible for PM-KISAN.", "hi")
    print("Saved audio to:", path)