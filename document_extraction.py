"""
Document extraction using Gemini's Interactions API.

Takes a photo of an Aadhaar / income certificate / land record
and returns structured, typed data.
"""

import base64
import mimetypes
from typing import Optional

from google import genai
from pydantic import BaseModel

from config import GEMINI_API_KEY, GEMINI_VISION_MODEL


# ---------------------------------------------------------------------------
# Gemini client
# ---------------------------------------------------------------------------

client = genai.Client(api_key=GEMINI_API_KEY)


# ---------------------------------------------------------------------------
# Structured output model
# ---------------------------------------------------------------------------

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
    caste_category: Optional[str] = None
    is_government_employee: Optional[bool] = None
    pays_income_tax: Optional[bool] = None
    disability_status: Optional[bool] = None
    document_type_seen: Optional[str] = None


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

EXTRACTION_PROMPT = """
You are a document extraction engine for an Indian government
welfare-scheme assistant.

You will be shown a photo of an official document such as:
- Aadhaar card
- income certificate
- land record

Extract every field that you can confidently read.

Rules:

1. If a field is not visible or not present on this document,
   return null. NEVER guess.

2. Normalize income to an annual number in INR if the document
   states monthly income.

3. owns_land, owns_pucca_house, is_government_employee,
   pays_income_tax, and disability_status should only be set to
   true or false if the document explicitly provides enough
   evidence. Otherwise return null.

4. Preserve names, addresses, and document values accurately.

5. Do not infer information from context.

6. Return only data matching the provided schema.
"""


# ---------------------------------------------------------------------------
# Image extraction
# ---------------------------------------------------------------------------

def extract_from_image(image_path: str) -> ExtractedProfile:
    """
    Send one document image to Gemini and return structured data.
    """

    # Read image
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    # Determine MIME type
    mime_type, _ = mimetypes.guess_type(image_path)

    if mime_type is None:
        raise ValueError(
            f"Could not determine image MIME type for: {image_path}"
        )

    if not mime_type.startswith("image/"):
        raise ValueError(
            f"Expected an image file, got MIME type: {mime_type}"
        )

    # Gemini Interactions API expects base64 image data
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    # Structured output schema generated from Pydantic
    schema = ExtractedProfile.model_json_schema()

    # Create interaction
    interaction = client.interactions.create(
        model=GEMINI_VISION_MODEL,
        input=[
            {
                "type": "image",
                "mime_type": mime_type,
                "data": image_b64,
            },
            {
                "type": "text",
                "text": EXTRACTION_PROMPT,
            },
        ],
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": schema,
        },
    )

    # Parse Gemini's structured JSON directly into Pydantic
    return ExtractedProfile.model_validate_json(
        interaction.output_text
    )


# ---------------------------------------------------------------------------
# Merge multiple documents
# ---------------------------------------------------------------------------

def merge_profiles(
    profiles: list[ExtractedProfile],
) -> ExtractedProfile:
    """
    Citizens can upload multiple documents.

    Example:
        Aadhaar -> name, DOB, address
        Income certificate -> annual income
        Land record -> land ownership

    Later documents fill fields that are missing from earlier documents.
    """

    merged: dict = {}

    for profile in profiles:
        for field, value in profile.model_dump().items():

            if value is not None and merged.get(field) is None:
                merged[field] = value

    return ExtractedProfile(**merged)


# ---------------------------------------------------------------------------
# Manual test
# ---------------------------------------------------------------------------

if __name__ == "__main__":

    profile = extract_from_image(
        "sample_docs/aadhaar_sample.jpg"
    )

    print(profile.model_dump_json(indent=2))