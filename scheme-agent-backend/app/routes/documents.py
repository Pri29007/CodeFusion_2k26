import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from supabase import create_client

from app.database import get_db
from app.models.document import Document

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {"application/pdf": "pdf", "image/jpeg": "jpeg", "image/png": "png"}
MAX_FILE_SIZE_MB = 10

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY"),
)


@router.post("/upload")
async def upload_document(
    user_id: str = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed. Use PDF, JPEG, or PNG.")

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File too large ({size_mb:.1f}MB). Max {MAX_FILE_SIZE_MB}MB.")

    file_extension = ALLOWED_TYPES[file.content_type]
    storage_path = f"{user_id}/{doc_type}_{uuid.uuid4()}.{file_extension}"

    supabase.storage.from_("user-documents").upload(
        storage_path, contents, {"content-type": file.content_type}
    )
    file_url = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/user-documents/{storage_path}"

    new_doc = Document(
        user_id=user_id,
        doc_type=doc_type,
        file_url=file_url,
        file_type=file_extension,
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc


@router.get("/user/{user_id}")
def list_documents_for_user(user_id: str, db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.user_id == user_id).all()