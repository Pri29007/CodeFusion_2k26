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

from sqlalchemy import Column, String, DateTime, Date, Integer, Numeric
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    aadhaar_number = Column(String, primary_key=True)
    auth_id = Column(String, unique=True, nullable=False)
    phone_number = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    date_of_birth = Column(Date)
    gender = Column(String)
    preferred_language = Column(String, default="hi")
    address = Column(String)
    city = Column(String)
    state = Column(String)
    category = Column(String)
    occupation = Column(String)
    family_members_under_18 = Column(Integer)
    annual_income = Column(Numeric)
    bank_account_number = Column(String)
    bank_ifsc = Column(String)
    aadhaar_doc_url = Column(String)
    aadhaar_doc_type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())