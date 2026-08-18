"""
Voice routes — speech-to-text and text-to-speech, using Person C's
voice_pipeline (IndicWhisper for transcription, Indic Parler-TTS for
speech output).
"""

import shutil
import uuid
import tempfile
import os
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import FileResponse

from app.services.voice_pipeline import voice_input_to_english, english_to_voice_output

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), lang_code: str = Form(...)):
    temp_path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.wav")
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)
    english_text = voice_input_to_english(temp_path, lang_code)
    return {"english_text": english_text}


@router.post("/speak")
async def speak(text: str = Form(...), lang_code: str = Form(...)):
    output_path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.wav")
    english_to_voice_output(text, lang_code, output_path)
    return FileResponse(output_path, media_type="audio/wav")