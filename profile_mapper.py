"""
Signup form JSON -> CitizenProfile. No document extraction involved —
the form already captures everything eligibility matching needs.
"""
from pydantic import BaseModel
from typing import Optional


class CitizenProfile(BaseModel):
    """What the LLM reasons over. Built directly from signup form data."""
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    category: Optional[str] = None
    occupation: Optional[str] = None
    marital_status: Optional[str] = None
    family_members_dependents: Optional[int] = None
    annual_income_range: Optional[str] = None
    ration_card_type: Optional[str] = None
    housing_type: Optional[str] = None
    number_of_rooms: Optional[int] = None
    owns_agricultural_land: Optional[bool] = None
    land_area_acres: Optional[float] = None
    disability_status: Optional[bool] = None
    chronic_illness_or_pregnant: Optional[bool] = None
    educational_background: Optional[str] = None

def db_row_to_profile(user_row: dict) -> CitizenProfile:
    """
    Converts a Supabase `users` table row directly into a CitizenProfile.
    No extraction, no re-derivation — the row already IS the profile.
    """
    full_name = " ".join(filter(None, [user_row.get("first_name"), user_row.get("last_name")]))
    return CitizenProfile(
        full_name=full_name or None,
        age=user_row.get("age"),
        gender=user_row.get("gender"),
        date_of_birth=str(user_row.get("date_of_birth")) if user_row.get("date_of_birth") else None,
        address=user_row.get("address"),
        city=user_row.get("city"),
        state=user_row.get("state"),
        category=user_row.get("category"),
        occupation=user_row.get("occupation"),
        marital_status=user_row.get("marital_status"),
        family_members_dependents=user_row.get("family_members_dependents"),
        annual_income_range=user_row.get("annual_income_range"),
        ration_card_type=user_row.get("ration_card_type"),
        housing_type=user_row.get("housing_type"),
        number_of_rooms=user_row.get("number_of_rooms"),
        owns_agricultural_land=user_row.get("owns_agricultural_land"),
        land_area_acres=user_row.get("land_area_acres"),
        disability_status=user_row.get("disability_status"),
        chronic_illness_or_pregnant=user_row.get("chronic_illness_or_pregnant"),
        educational_background=user_row.get("educational_background"),
    )