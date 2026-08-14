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
GEMINI_VISION_MODEL = "gemini-2.0-flash"  # multimodal, cheap, fast

# --- Supabase / pgvector ---
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL", "postgresql://user:pass@host:5432/postgres")
VECTOR_COLLECTION_NAME = "yojanamitra_schemes"

# --- Voice pipeline (AI4Bharat, open source) ---
INDIC_WHISPER_MODEL = "vasista22/whisper-hindi-large-v2"   # swap per language, or use multilingual variant
INDIC_TRANS2_MODEL = "ai4bharat/indictrans2-indic-en-1B"   # indic -> en
INDIC_TRANS2_MODEL_EN_INDIC = "ai4bharat/indictrans2-en-indic-1B"  # en -> indic
INDIC_TTS_MODEL = "ai4bharat/indic-parler-tts"

# --- Supported languages for the hackathon build ---
SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "ta": "Tamil",
    "bn": "Bengali",
    "mr": "Marathi",
}

# --- Hard constraint: the only schemes this system knows about ---
SCHEME_IDS = ["pm_kisan", "pmay", "ayushman_bharat"]