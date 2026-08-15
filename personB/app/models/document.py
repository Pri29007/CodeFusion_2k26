import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, ForeignKey("users.aadhaar_number"))
    doc_type = Column(String)
    file_url = Column(String)
    file_type = Column(String)
    extracted_data = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())