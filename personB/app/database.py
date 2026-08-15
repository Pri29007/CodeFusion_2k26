"""
Database connection setup.

WHAT THIS FILE DOES:
This is the one place in your whole backend that knows how to talk to
Postgres/Supabase directly. Every other file that needs to read or
write data will import from here, instead of each file trying to
connect to the database on its own.

WHY THIS MATTERS:
Opening a new database connection is slow-ish. Instead of connecting
fresh every single time someone hits an API endpoint, we create a
small reusable "pool" of connections once when the app starts, and
routes borrow a connection from that pool as needed. This is standard
practice and keeps your backend fast under load.

This uses SQLAlchemy, a popular Python library for talking to SQL
databases — it turns Python function calls into actual SQL under the
hood, so you don't have to write raw SQL strings everywhere (though
you still can, if needed).
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Loads variables from your .env file (like DATABASE_URL) into the
# environment, so os.getenv() below can find them. This is how your
# real password stays out of the code itself.
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not set. Create a .env file in the project "
        "root (copy .env.example) and paste in your Supabase "
        "connection string with the real password filled in."
    )

# The "engine" is the actual connection manager talking to Postgres.
engine = create_engine(DATABASE_URL)

# SessionLocal is a factory that creates a new database "session"
# (a working conversation with the DB) whenever a route needs one.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is what your table models (in app/models/) will inherit from,
# so SQLAlchemy knows they represent database tables.
Base = declarative_base()


def get_db():
    """
    Used by route functions to borrow a database session for the
    duration of one request, then automatically close it afterward
    — even if something goes wrong partway through.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
