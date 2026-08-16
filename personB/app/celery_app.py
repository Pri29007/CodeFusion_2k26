"""
Celery application setup — this is the background job engine that
Person C's orchestrator will use for long-running AI tasks (document
extraction, eligibility matching, form-filling automation) so they
don't block your FastAPI server while they run.
"""

import os
import ssl
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

celery_app = Celery(
    "scheme_agent",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=True,
    broker_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE},
    redis_backend_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE},
)

import app.tasks  # noqa: E402 — ensures tasks get registered with the worker