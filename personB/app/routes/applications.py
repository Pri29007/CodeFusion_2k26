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

router = APIRouter(prefix="/applications", tags=["applications"])


class ApplicationCreate(BaseModel):
    """
    Defines what data we expect when someone creates a new
    application. FastAPI automatically validates incoming requests
    against this — if a required field is missing, it rejects the
    request before your code even runs.
    """
    user_id: str  # this is the aadhaar_number
    scheme_name: str


@router.post("/")
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    new_app = Application(
        user_id=payload.user_id,
        scheme_name=payload.scheme_name,
        status="draft",
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app


@router.get("/{application_id}")
def get_application(application_id: str, db: Session = Depends(get_db)):
    app_row = db.query(Application).filter(Application.id == application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_row
