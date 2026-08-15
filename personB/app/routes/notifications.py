from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationCreate(BaseModel):
    user_id: str
    message: str


@router.post("/")
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db)):
    new_notif = Notification(user_id=payload.user_id, message=payload.message, status="sent")
    db.add(new_notif)
    db.commit()
    db.refresh(new_notif)
    return new_notif


@router.get("/user/{user_id}")
def list_notifications_for_user(user_id: str, db: Session = Depends(get_db)):
    return db.query(Notification).filter(Notification.user_id == user_id).all()