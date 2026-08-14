"""
Document extraction: takes a photo of an Aadhaar / income certificate / land record
and returns structured, typed data using Gemini's multimodal vision model.

Why Gemini Vision instead of a separate OCR tool: it reads AND understands layout/
context in one call, so "Date of Birth" printed in Devanagari next to a logo still
gets mapped to the correct field, instead of returning raw unstructured text.
"""
import base64
import json
from typing import Optional
from pydantic import BaseModel, Field
import google.generativeai as genai

from config import GEMINI_API_KEY, GEMINI_VISION_MODEL

genai.configure(api_key=GEMINI_API_KEY)


class ExtractedProfile(BaseModel):
    """Structured citizen profile built up from one or more uploaded documents."""
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    aadhaar_number: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    annual_income: Optional[int] = None
    owns_land: Optional[bool] = None
    land_area_acres: Optional[float] = None
    owns_pucca_house: Optional[bool] = None
    caste_category: Optional[str] = None  # SC/ST/OBC/General
    is_government_employee: Optional[bool] = None
    pays_income_tax: Optional[bool] = None
    disability_status: Optional[bool] = None
    document_type_seen: Optional[str] = None  # aadhaar / income_certificate / land_record


EXTRACTION_PROMPT = """
You are a document extraction engine for an Indian government welfare-scheme assistant.
You will be shown a photo of an official document (Aadhaar card, income certificate,
or land record). Extract every field you can confidently read into the JSON schema below.

Rules:
- If a field is not visible or not present on this document, leave it as null. Do NOT guess.
- Normalize income to an annual number in INR if the document states monthly income.
- owns_land / owns_pucca_house / is_government_employee / pays_income_tax should only be
  set to true/false if the document explicitly states it — otherwise null.
- Return ONLY valid JSON matching this schema, no prose, no markdown fences.

Schema:
{schema}
"""


def extract_from_image(image_path: str) -> ExtractedProfile:
    """Send one document image to Gemini Vision and parse the structured response."""
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    model = genai.GenerativeModel(GEMINI_VISION_MODEL)
    prompt = EXTRACTION_PROMPT.format(schema=ExtractedProfile.model_json_schema())

    response = model.generate_content(
        [
            prompt,
            {"mime_type": "image/jpeg", "data": image_bytes},
        ],
        generation_config={"response_mime_type": "application/json"},
    )

    data = json.loads(response.text)
    return ExtractedProfile(**data)


def merge_profiles(profiles: list[ExtractedProfile]) -> ExtractedProfile:
    """
    Citizens upload multiple documents (Aadhaar + income cert + land record).
    Merge them into one profile, later documents filling gaps left by earlier ones.
    """
    merged: dict = {}
    for p in profiles:
        for field, value in p.model_dump().items():
            if value is not None and merged.get(field) is None:
                merged[field] = value
    return ExtractedProfile(**merged)


if __name__ == "__main__":
    # quick manual test
    profile = extract_from_image("sample_docs/aadhaar_sample.jpg")
    print(profile.model_dump_json(indent=2))