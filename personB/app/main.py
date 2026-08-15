"""
Main entry point for the FastAPI backend.

WHAT THIS FILE DOES:
This is the file that actually starts your web server. When you run
`uvicorn app.main:app --reload`, Python loads this file, finds the
`app` object below, and starts listening for requests on it.

Think of this as the "front door" of your backend — every request
from the frontend (or a test tool like Postman) comes in through here
first, then gets routed to the right place based on the URL.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import health, applications

app = FastAPI(title="Scheme Agent Backend")

# CORS = Cross-Origin Resource Sharing. Browsers block a website from
# calling an API on a different domain/port unless the API explicitly
# allows it. Since your React frontend (Person A) runs on a different
# port than this backend during development, we need to allow it here.
# For the hackathon, "*" allows all origins — fine for now, but you'd
# lock this down to just your frontend's real URL for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Each "router" below groups related endpoints together, the same way
# your database has separate tables for separate concerns.
app.include_router(health.router)
app.include_router(applications.router)


@app.get("/")
def root():
    return {"message": "Scheme Agent Backend is running"}
