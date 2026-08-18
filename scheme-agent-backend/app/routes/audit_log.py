from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any

from app.database import get_db
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/audit-log", tags=["audit-log"])


class AuditLogCreate(BaseModel):
    application_id: str
    action: str
    details: Optional[dict[str, Any]] = None


@router.post("/")
def create_audit_log(payload: AuditLogCreate, db: Session = Depends(get_db)):
    new_entry = AuditLog(
        application_id=payload.application_id,
        action=payload.action,
        details=payload.details,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.get("/application/{application_id}")
def list_audit_log_for_application(application_id: str, db: Session = Depends(get_db)):
    return (
        db.query(AuditLog)
        .filter(AuditLog.application_id == application_id)
        .order_by(AuditLog.created_at.asc())
        .all()
    )