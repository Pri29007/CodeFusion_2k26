"""
Health check endpoint.

WHAT THIS FILE DOES:
This gives you one URL you can visit to confirm two things at once:
1. The FastAPI server itself is running
2. It can successfully reach your Supabase database

This is a common pattern in real backend projects — before debugging
anything complicated, you check the health endpoint first to rule out
basic connectivity problems.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {"server": "running", "database": db_status}
