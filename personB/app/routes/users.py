"""
User routes — creating a user account, which includes uploading
their Aadhaar document once at signup.

WHY AADHAAR IS HANDLED DIFFERENTLY FROM OTHER DOCUMENTS:
Income certificates and land records are specific to one application
(a user might apply to multiple schemes, each needing fresh/different
proof). Aadhaar, though, identifies the *person* — it doesn't change
per application, so it's uploaded once here, stored directly on the
user's own record, and referenced from every application afterward
rather than re-uploaded each time.
"""

import os
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from supabase import create_client

from app.database import get_db
from app.models.user import User
from app.models.document import Document

router = APIRouter(prefix="/users", tags=["users"])

ALLOWED_TYPES = {"application/pdf": "pdf", "image/jpeg": "jpeg", "image/png": "png"}
MAX_FILE_SIZE_MB = 10

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY"),
)


@router.post("/")
async def create_user(
    aadhaar_number: str = Form(...),
    auth_id: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    phone_number: str = Form(...),
    date_of_birth: date = Form(...),
    gender: str = Form(...),
    preferred_language: str = Form("hi"),
    address: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    occupation: Optional[str] = Form(None),
    family_members_under_18: Optional[int] = Form(None),
    annual_income: Optional[float] = Form(None),
    bank_account_number: Optional[str] = Form(None),
    bank_ifsc: Optional[str] = Form(None),
    aadhaar_doc: UploadFile = File(...),
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

    new_user = User(
        aadhaar_number=aadhaar_number,
        auth_id=auth_id,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        date_of_birth=date_of_birth,
        gender=gender,
        preferred_language=preferred_language,
        address=address,
        city=city,
        state=state,
        category=category,
        occupation=occupation,
        family_members_under_18=family_members_under_18,
        annual_income=annual_income,
        bank_account_number=bank_account_number,
        bank_ifsc=bank_ifsc,
        aadhaar_doc_url=aadhaar_doc_url,
        aadhaar_doc_type=file_extension,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
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

    return {
        "aadhaar": {
            "doc_type": "aadhaar",
            "file_url": user.aadhaar_doc_url,
            "file_type": user.aadhaar_doc_type,
        },
        "documents": other_documents,
    }