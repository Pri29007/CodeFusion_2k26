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
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from supabase import create_client

from app.database import get_db
from app.models.user import User

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
    full_name: str = Form(...),
    phone_number: str = Form(...),
    preferred_language: str = Form("hi"),
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
        full_name=full_name,
        phone_number=phone_number,
        preferred_language=preferred_language,
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