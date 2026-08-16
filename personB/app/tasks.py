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