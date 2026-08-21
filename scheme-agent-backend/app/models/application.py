"""
Application model — matches the `applications` table in Supabase.

Each row here represents one user's application to one government
scheme (e.g. PM-KISAN), including its current status and the actual
form data collected so far.
"""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from app.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column("aadhaar_number", ForeignKey("users.aadhaar_number"))
    scheme_name = Column(String, nullable=False)
    status = Column(String, default="draft")
    application_status = Column(String, default="not applied")
    form_data = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
    automation_status = Column(String, default="not_started")
