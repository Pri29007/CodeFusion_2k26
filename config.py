"""
Central config for Person C's AI stack.
Fill in real values via environment variables — never hardcode keys.
"""
import os

# --- LLM (Groq / Ollama) ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")  # fast + good for structured JSON

# --- Gemini Vision (document extraction) ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_VISION_MODEL = os.getenv(
    "GEMINI_VISION_MODEL",
    "gemini-3.5-flash"
)
# --- Supabase / pgvector ---
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL", "postgresql://user:pass@host:5432/postgres")
VECTOR_COLLECTION_NAME = "yojanamitra_schemes"

# --- Voice pipeline (AI4Bharat STT/translation, Meta MMS for TTS — ungated) ---
INDIC_WHISPER_MODEL = "openai/whisper-large-v3"
# --- Translation (NLLB-200, open — replaces gated IndicTrans2) ---
TRANSLATION_MODEL = "facebook/nllb-200-distilled-600M"

# MMS-TTS needs one model per language (no single multilingual checkpoint)
TTS_MODELS = {
    "en": "facebook/mms-tts-eng",
    "hi": "facebook/mms-tts-hin",
    "pa": "facebook/mms-tts-pan",
    "mr": "facebook/mms-tts-mar",
}
# NLLB uses its own language codes, different from ISO 639-1
NLLB_LANG_CODES = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "pa": "pan_Guru",
    "mr": "mar_Deva",
}

DEFAULT_LANGUAGE = "en"
SUPPORTED_LANGUAGES = {"en": "English", "hi": "Hindi", "pa": "Punjabi", "mr": "Marathi"}
TRANSLATED_LANGUAGES = {"hi", "pa", "mr"}
# --- Automation coverage (only these 3 have working mock portals) ---
# Keywords used to detect a match against LLM-generated scheme names — not an
# exhaustive enum, so new automatable schemes can be added by just adding a
# keyword set here, no other code changes needed.
AUTOMATABLE_SCHEMES = {
    "pm_kisan": {
        "keywords": ["pm-kisan", "pm kisan", "kisan samman nidhi", "pmkisan"],
        "display_name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    },
    "pmay": {
        "keywords": ["pmay", "pradhan mantri awas yojana", "awas yojana"],
        "display_name": "PMAY (Pradhan Mantri Awas Yojana)",
    },
    "ayushman_bharat": {
        "keywords": ["ayushman bharat", "pm-jay", "pmjay", "jan arogya"],
        "display_name": "Ayushman Bharat - PM-JAY",
    },
}