"""
User routes — creating a user account, which includes uploading
their Aadhaar document once at signup.
"""

import json
import os
import sys
import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from supabase import create_client

from app.database import get_db
from app.models.user import User
from app.models.document import Document

# Add app/agent/ itself to sys.path so its internal sibling imports
# (from eligibility_matching import ..., from db_writer import ..., etc.) resolve correctly
agent_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "agent"))
sys.path.insert(0, agent_path)

from onboarding_pipeline import run_scheme_matching_for_user

router = APIRouter(prefix="/users", tags=["users"])
router = APIRouter(prefix="/users", tags=["users"])

ALLOWED_TYPES = {"application/pdf": "pdf", "image/jpeg": "jpeg", "image/jpg": "jpeg", "image/png": "png"}
MAX_FILE_SIZE_MB = 10

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY"),
)


@router.post("/")
async def create_user(
    aadhaar_number: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    phone_number: str = Form(...),
    date_of_birth: date = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    preferred_language: str = Form("hi"),
    category: Optional[str] = Form(None),
    marital_status: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    ration_card_type: Optional[str] = Form(None),
    annual_income_range: Optional[str] = Form(None),
    housing_type: Optional[str] = Form(None),
    number_of_rooms: Optional[int] = Form(None),
    family_members_dependents: Optional[int] = Form(None),
    occupation: Optional[str] = Form(None),
    owns_agricultural_land: Optional[bool] = Form(None),
    disability_status: Optional[bool] = Form(None),
    chronic_illness_or_pregnant: Optional[bool] = Form(None),
    aadhaar_doc: UploadFile = File(...),
    owns_pucca_house: Optional[bool] = Form(None),
    land_area_acres: Optional[float] = Form(None),
    educational_background: Optional[str] = Form(None),
    # --- Added for mock-portal automation / scheme applications ---
    district: Optional[str] = Form(None),
    village: Optional[str] = Form(None),
    account_holder_name: Optional[str] = Form(None),
    bank_name: Optional[str] = Form(None),
    account_number: Optional[str] = Form(None),
    ifsc_code: Optional[str] = Form(None),
    land_record_id: Optional[str] = Form(None),
    survey_number: Optional[str] = Form(None),
    land_location: Optional[str] = Form(None),
    employment_status: Optional[str] = Form(None),
    ownership_status: Optional[str] = Form(None),
    living_conditions: Optional[str] = Form(None),
    income_category: Optional[str] = Form(None),
    household_category: Optional[str] = Form(None),
    family_members: Optional[str] = Form(None),  # JSON string, e.g. '[{"name": "...", "age": "...", "relationship": "..."}]'
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.aadhaar_number == aadhaar_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this Aadhaar number already exists.")

    if aadhaar_doc.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Aadhaar document must be PDF, JPEG, or PNG.")

    contents = await aadhaar_doc.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File too large ({size_mb:.1f}MB). Max {MAX_FILE_SIZE_MB}MB.")

    file_extension = ALLOWED_TYPES[aadhaar_doc.content_type]
    storage_path = f"{aadhaar_number}/aadhaar.{file_extension}"

    supabase.storage.from_("user-documents").upload(
        storage_path, contents, {"content-type": aadhaar_doc.content_type, "upsert": "true"}
    )
    aadhaar_doc_url = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/user-documents/{storage_path}"

    # family_members arrives as a JSON string (if provided at all) — parse it
    # back into a Python list/dict so SQLAlchemy can store it as JSONB.
    parsed_family_members = None
    if family_members:
        try:
            parsed_family_members = json.loads(family_members)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="family_members must be valid JSON.")

    new_user = User(
        aadhaar_number=aadhaar_number,
        auth_id=str(uuid.uuid4()),
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        date_of_birth=date_of_birth,
        age=age,
        gender=gender,
        preferred_language=preferred_language,
        category=category,
        marital_status=marital_status,
        address=address,
        city=city,
        state=state,
        ration_card_type=ration_card_type,
        annual_income_range=annual_income_range,
        housing_type=housing_type,
        number_of_rooms=number_of_rooms,
        family_members_dependents=family_members_dependents,
        occupation=occupation,
        owns_agricultural_land=owns_agricultural_land,
        disability_status=disability_status,
        chronic_illness_or_pregnant=chronic_illness_or_pregnant,
        aadhaar_doc_url=aadhaar_doc_url,
        aadhaar_doc_type=file_extension,
        owns_pucca_house=owns_pucca_house,
        land_area_acres=land_area_acres,
        educational_background=educational_background,
        district=district,
        village=village,
        account_holder_name=account_holder_name,
        bank_name=bank_name,
        account_number=account_number,
        ifsc_code=ifsc_code,
        land_record_id=land_record_id,
        survey_number=survey_number,
        land_location=land_location,
        employment_status=employment_status,
        ownership_status=ownership_status,
        living_conditions=living_conditions,
        income_category=income_category,
        household_category=household_category,
        family_members=parsed_family_members,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Synchronous call — no Celery/Redis. Signup waits a few seconds for
    # eligibility matching + voice summary to finish before returning.
    try:
        run_scheme_matching_for_user(new_user.aadhaar_number)
    except Exception as e:
        # Don't fail the whole signup if eligibility matching has an issue —
        # the user account is already created; log and move on.
        print(f"⚠️  Eligibility matching failed for {new_user.aadhaar_number}: {e}")

    return new_user


@router.get("/{aadhaar_number}")
def get_user(aadhaar_number: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.aadhaar_number == aadhaar_number).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{aadhaar_number}/documents")
def get_all_documents_for_user(aadhaar_number: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.aadhaar_number == aadhaar_number).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    other_documents = db.query(Document).filter(Document.user_id == aadhaar_number).all()

    return{

        "aadhaar": {
            "doc_type": "aadhaar",
            "file_url": user.aadhaar_doc_url,
            "file_type": user.aadhaar_doc_type,
        },
        "documents": other_documents,
    }