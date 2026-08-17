"""
Celery tasks — background jobs that run outside the normal request/
response cycle. This file currently has one simple test task; Person
C will add real ones here later (document extraction, eligibility
matching, form-fill orchestration).
"""

import time
from app.celery_app import celery_app


@celery_app.task
def test_task(name: str):
    """A simple task to confirm Celery + Redis are wired up
    correctly. Simulates a bit of 'work' by sleeping, then returns a
    result — proving a task can run in the background and be
    checked on later."""
    time.sleep(5)
    return f"Hello {name}, background task complete!"

@celery_app.task
def run_scheme_matching(aadhaar_number: str):
    """
    STUB — Person C fills this in with real eligibility/RAG logic.
    Triggered right after signup so it runs in the background instead
    of making the user wait for account creation to finish.
    """
    # TODO (Person C): look up user + documents, run RAG eligibility
    # matching, return which schemes they qualify for
    return {"status": "not_yet_implemented", "aadhaar_number": aadhaar_number}


@celery_app.task
def run_document_extraction(aadhaar_number: str, doc_type: str, file_url: str):
    """
    STUB — Person C fills this in with real Gemini Vision/LLaVA logic.
    Triggered right after a document (starting with Aadhaar at
    signup) is uploaded, so extraction happens in the background.
    """
    # TODO (Person C): download file from file_url, run extraction,
    # write results back into the document's extracted_data column
    return {"status": "not_yet_implemented", "doc_type": doc_type}