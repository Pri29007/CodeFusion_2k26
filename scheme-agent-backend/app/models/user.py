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

from sqlalchemy import Column, String, DateTime, Date, Integer, Numeric, Boolean, JSON
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
    age = Column(Integer)
    gender = Column(String)
    preferred_language = Column(String, default="hi")
    category = Column(String)
    marital_status = Column(String)
    address = Column(String)
    city = Column(String)
    state = Column(String)
    ration_card_type = Column(String)
    annual_income_range = Column(String)
    housing_type = Column(String)
    number_of_rooms = Column(Integer)
    family_members_dependents = Column(Integer)
    occupation = Column(String)
    owns_agricultural_land = Column(Boolean)
    disability_status = Column(Boolean)
    chronic_illness_or_pregnant = Column(Boolean)
    aadhaar_doc_url = Column(String)
    aadhaar_doc_type = Column(String)
    owns_pucca_house = Column(Boolean)
    land_area_acres = Column(Numeric)
    educational_background = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- Added for mock-portal automation / scheme applications ---
    district = Column(String)
    village = Column(String)
    account_holder_name = Column(String)
    bank_name = Column(String)
    account_number = Column(String)
    ifsc_code = Column(String)
    land_record_id = Column(String)
    survey_number = Column(String)
    land_location = Column(String)
    employment_status = Column(String)
    ownership_status = Column(String)
    living_conditions = Column(String)
    income_category = Column(String)
    household_category = Column(String)
    family_members = Column(JSON)