import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column("aadhaar_number", ForeignKey("users.aadhaar_number"))
    message = Column(String)
    status = Column(String, default="sent")
    created_at = Column(DateTime(timezone=True), server_default=func.now())