# Scheme Agent Backend

This is your FastAPI backend — the part of the project that sits
between the frontend (Person A), the AI/orchestration logic (Person
C), and your Supabase database. It receives requests, talks to the
database, and will eventually kick off Celery background jobs for
things like the AI agent's long-running work.

## What each folder/file is for

```
scheme-agent-backend/
├── app/
│   ├── main.py           ← starts the server, wires everything together
│   ├── database.py       ← the one place that knows how to connect to Supabase
│   ├── models/           ← Python classes that mirror your database tables
│   │   ├── user.py
│   │   └── application.py
│   └── routes/           ← the actual URLs/endpoints your frontend calls
│       ├── health.py
│       └── applications.py
├── requirements.txt      ← list of Python packages this project needs
├── .env.example           ← template showing what secrets you need (safe to share)
├── .env                    ← your REAL secrets (you create this, never share/commit it)
└── .gitignore             ← tells Git to never upload .env or junk files
```

## How to run this on your computer, step by step

**1. Make sure Python is installed.**
Open a terminal and run `python --version` (or `python3 --version`).
You want 3.10 or newer. If it's not installed, download it from
python.org.

**2. Open this folder in a terminal.**
Navigate into the `scheme-agent-backend` folder using `cd` (change
directory) — e.g. `cd path/to/scheme-agent-backend`.

**3. Create a virtual environment.**
This is an isolated space for this project's Python packages, so
they don't clash with other projects on your computer.
```
python -m venv venv
```
Then activate it:
- Mac/Linux: `source venv/bin/activate`
- Windows: `venv\Scripts\activate`
You'll know it worked if you see `(venv)` at the start of your
terminal line.

**4. Install the required packages.**
```
pip install -r requirements.txt
```
This reads requirements.txt and installs FastAPI, SQLAlchemy, and
everything else this project needs — all inside your isolated venv.

**5. Set up your real secrets.**
Copy `.env.example` to a new file called `.env`:
```
cp .env.example .env
```
(On Windows: `copy .env.example .env`)
Then open `.env` in any text editor and replace the placeholder
values with your real Supabase connection string, URL, and keys —
the ones you already saved earlier from the Supabase dashboard.

**6. Start the server.**
```
uvicorn app.main:app --reload
```
`--reload` means the server automatically restarts whenever you save
a code change — handy while developing.

**7. Check it worked.**
Open your browser to `http://localhost:8000/health` — you should see
something like:
```json
{"server": "running", "database": "connected"}
```
If `database` shows an error instead, double check your
`DATABASE_URL` in `.env` — most often it's the password placeholder
not being replaced.

**8. Explore the built-in API docs.**
FastAPI automatically generates an interactive testing page. Visit
`http://localhost:8000/docs` — you can try out the `/applications`
endpoints directly from your browser, no separate tool needed.

## What's already built vs. what's next

Already working:
- Server setup + database connection
- `users` and `applications` table models
- Basic create/get endpoints for applications
- Health check endpoint

Still to build (as the project grows):
- More routes: documents, notifications, audit_log
- Celery + Redis wiring for background AI agent tasks
- WhatsApp/Twilio notification sending
- Connecting to Person C's AI agent and Person D's mock portal automation
