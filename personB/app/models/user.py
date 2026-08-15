"""
User model — matches the `users` table in Supabase.

WHAT THIS FILE DOES:
This is a Python class that mirrors your actual database table.
SQLAlchemy uses this to know what columns exist and their types, so
you can write Python code like `db.query(User).filter(...)` instead
of raw SQL. If you add/change columns in Supabase, update this file
to match.

NOTE: aadhaar_number is the primary key here (per the schema change),
and auth_id is kept separately to match against Supabase Auth's
login system.
"""

from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    aadhaar_number = Column(String, primary_key=True)
    auth_id = Column(String, unique=True, nullable=False)
    phone_number = Column(String, unique=True)
    full_name = Column(String)
    preferred_language = Column(String, default="hi")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
