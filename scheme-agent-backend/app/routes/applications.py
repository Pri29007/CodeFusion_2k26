"""
Application routes — endpoints for creating and viewing scheme
applications.

WHAT THIS FILE DOES:
Each function below becomes a real URL your frontend (or you, while
testing) can call. For example, POST /applications creates a new
application row in the database.

This is intentionally minimal for now — just enough to prove the
whole chain works end to end (frontend → FastAPI → Supabase). You'll
expand this as the project grows (adding document uploads, status
updates from the automation agent, etc).
"""



from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.application import Application
from app.models.user import User
from app.models.document import Document

router = APIRouter(prefix="/applications", tags=["applications"])


class ApplicationCreate(BaseModel):
    user_id: str
    scheme_name: str
    status: str = "draft"
    form_data: dict | None = None


@router.post("/")
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    new_application = Application(**payload.dict())
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    return new_application


@router.get("/")
def list_applications(db: Session = Depends(get_db)):
    return db.query(Application).all()


@router.get("/{application_id}")
def get_application(application_id: str, db: Session = Depends(get_db)):
    app_row = db.query(Application).filter(Application.id == application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_row


@router.get("/{application_id}/fill-data")
def get_fill_data_for_application(application_id: str, db: Session = Depends(get_db)):
    """
    Returns everything needed to auto-fill a government form for this
    application — the user's full profile plus all their uploaded
    documents (including Aadhaar). Used by Person D's automation
    scripts instead of dummy/placeholder data.
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    user = db.query(User).filter(User.aadhaar_number == application.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found for this application")

    documents = db.query(Document).filter(Document.user_id == application.user_id).all()

    return {
        "application_id": str(application.id),
        "scheme_name": application.scheme_name,
        "status": application.status,
        "user": user,
        "aadhaar_document": {
            "file_url": user.aadhaar_doc_url,
            "file_type": user.aadhaar_doc_type,
        },
        "documents": documents,
    }


@router.get("/user/{user_id}")
def list_applications_for_user(user_id: str, db: Session = Depends(get_db)):
    return db.query(Application).filter(Application.user_id == user_id).all()

class StatusUpdate(BaseModel):
    automation_status: str

@router.patch("/{application_id}/automation-status")
def update_automation_status(application_id: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    application.automation_status = payload.automation_status
    db.commit()
    db.refresh(application)
    return application

import subprocess
import sys
import os

AUTOMATION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "automation"))

@router.post("/{application_id}/apply")
def trigger_automation(application_id: str, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    scheme_map = {
        "PM-KISAN": "pm_kisan",
        "PMAY": "pmay",
        "Ayushman Bharat": "ayushman",
    }
    scheme_key = scheme_map.get(application.scheme_name, "pm_kisan")

    application.automation_status = "in_progress"
    db.commit()

    result = subprocess.run(
        [sys.executable, "main.py", scheme_key, "--aadhaar", application.user_id, "--application-id", str(application.id)],
        cwd=AUTOMATION_DIR,
        capture_output=True,
        text=True,
    )

    application.automation_status = "completed" if result.returncode == 0 else "failed"
    db.commit()
    db.refresh(application)

    return {
        "application": application,
        "automation_output": result.stdout,
        "automation_errors": result.stderr,
    }