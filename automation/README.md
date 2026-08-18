# YojanaMitra — Automation (Person D)

Python + Playwright automation that fills out and submits applications on
the mock government portals.

**Status: PM-KISAN, PMAY, and Ayushman Bharat are all fully automated and
tested end-to-end.**

## Stack

- React 19 + Vite (mock-portals, unchanged, sibling folder)
- Python + Playwright (this folder)

## Folder structure

```
automation/
├── main.py                    # entry point: python main.py [pm_kisan|pmay]
├── config.py                  # URLs and shared constants
├── requirements.txt
├── schemes/
│   ├── pm_kisan.py            # full automation, tested working
│   ├── pmay.py                # full automation, tested working
│   └── ayushman.py            # full automation, tested working
├── data/
│   └── sample_user_data.json  # fake test data, matches real mock-portal field names
└── utils/
    ├── browser.py             # reusable Playwright launch/close
    └── verification.py        # OTP + CAPTCHA human-in-the-loop pause/resume
```

## Confirmed routes

```
http://localhost:5173/pmkisan     (NOT /pm-kisan)
http://localhost:5173/pmay
http://localhost:5173/ayushman    (NOT /ayushman-bharat)
```

`config.py` is already set up with the correct URLs.

## Setup (Windows PowerShell)

```powershell
cd automation
python -m venv venv
```

Activate the virtual environment:

```powershell
.\venv\Scripts\Activate.ps1
```

> If PowerShell blocks the script with an execution-policy error, run this
> once (in an admin PowerShell), then try activating again:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Install the Playwright browser binaries (only needed once):

```powershell
playwright install
```

## Before running: start the mock portal

In a **separate terminal**:

```powershell
cd ..\mock-portals
npm run dev
```

Leave that running — it must be up at `http://localhost:5173` before you run
the automation.

## Run the automation

Back in the `automation` folder (with the venv activated):

```powershell
python main.py            # defaults to PM-KISAN
python main.py pm_kisan
python main.py pmay
python main.py ayushman
```

## PM-KISAN (python main.py pm_kisan)

A visible Chromium window opens (since `headless=False` in `browser.py`)
and walks through the whole form automatically. When it reaches the OTP
screen, it stops and waits for you:

```
Starting Playwright...
Opening PM-KISAN apply page...
Filling Personal Details...
Filling Land Details...
Filling Bank Details...
Uploading documents...
Resolving verification stage...
OTP verification required. Automation paused.
Enter the OTP:
```

Type `123456` (the fixed demo OTP) and press Enter. The automation resumes
and finishes:

```
OTP verified. Resuming automation...
Reviewing and submitting...
PM-KISAN application submitted: PMK-2026-34467 (Submitted)
Closing browser...

--- RESULT ---
{
  "success": true,
  "scheme": "pm_kisan",
  "application_id": "PMK-2026-34467",
  "status": "Submitted"
}
```

If you type a wrong code, you'll see `Incorrect OTP. Please try again.
(attempt 1/3)` and get re-prompted, up to 3 attempts.

## PMAY (python main.py pmay)

Same idea, but with two differences:

- **8 form steps** instead of PM-KISAN's 6 (adds Family Details and
  splits Financial/Housing into separate steps).
- **CAPTCHA instead of OTP.** When the CAPTCHA screen appears, the
  terminal prints `CAPTCHA verification required. Automation paused.` and
  waits for you to read the distorted characters shown in the visible
  browser window and type them in. Wrong answers are caught and you're
  re-prompted (up to 3 attempts), same as OTP.

Expected terminal flow:

```
Opening PMAY apply page...
Filling Personal Details...
Filling Family Details...
Filling Financial Details...
Filling Housing Details...
Filling Bank Details...
Uploading documents...
Resolving verification stage...
CAPTCHA verification required. Automation paused.
Enter the CAPTCHA shown on the portal:
```

Type what you see in the browser window and press Enter:

```
CAPTCHA verified. Resuming automation...
Reviewing and submitting...
PMAY application submitted: PMAY-2026-56940 (Submitted)

--- RESULT ---
{
  "success": true,
  "scheme": "pmay",
  "application_id": "PMAY-2026-56940",
  "status": "Submitted"
}
```

## Ayushman Bharat (python main.py ayushman)

Same idea, but with its own step order (confirmed from schemeConfigs.js):

- **4 form steps**: Applicant Details → Family Details → Socioeconomic
  Details → Documents (no Bank Details step — Ayushman doesn't collect
  bank info, unlike the other two schemes).
- **No `village` field** in Applicant Details (present in PM-KISAN, absent
  here).
- **Family count field is `family-size`** (not `family-member-count` like
  PMAY), but the dynamically-rendered rows still use the same shared
  `family-member-{i}-name/age/relationship` testids.
- **OTP verification**, same human-in-the-loop pause as PM-KISAN.
- **Only 2 documents required**: `aadhaar-upload` and
  `income-certificate-upload`.

Expected terminal flow:

```
Opening Ayushman Bharat apply page...
Filling Applicant Details...
Filling Family Details...
Filling Socioeconomic Details...
Uploading documents...
Resolving verification stage...
OTP verification required. Automation paused.
Enter the OTP:
```

Type `123456` and press Enter:

```
OTP verified. Resuming automation...
Reviewing and submitting...
Ayushman Bharat application submitted: AYU-2026-03877 (Submitted)

--- RESULT ---
{
  "success": true,
  "scheme": "ayushman",
  "application_id": "AYU-2026-03877",
  "status": "Submitted"
}
```

**Known data note (not silently fixed):** `sample_user_data.json`'s
`ayushman.family_size` is `"3"`, but `ayushman.family_members` only has 2
entries. The `family-size` field gets filled with `"3"` as given, but only
2 rows actually get filled in (looping over `family_members`, matching the
pattern used in `pmay.py`). If you want all 3 family members represented,
add a third entry to `family_members` in `sample_user_data.json`.

If any script fails immediately with a connection error, the mock-portals
dev server isn't running — start it first (see above).

## How verification.py works (shared by both schemes)

Both OTP and CAPTCHA genuinely pause for a human, using the same pattern: a
small "provider" function (`get_otp_from_terminal` / `get_captcha_from_terminal`)
is called by `submit_otp()` / `submit_captcha()` to get the answer, fill it
in, submit, and retry on failure (up to 3 attempts). Later, when this
connects to the real YojanaMitra backend / LangGraph resume flow, only the
provider function needs to be swapped — e.g. one that reads the OTP/CAPTCHA
a real citizen typed into the actual frontend, delivered back through a
resumed graph state — the pause-fill-verify-retry logic in `submit_otp()` /
`submit_captcha()` itself doesn't need to change.

`get_captcha_from_dom_debug(page)` also exists, reading the CAPTCHA answer
directly from the `data-captcha-answer` attribute the mock portal exposes.
This is kept **only as an explicit, opt-in fallback for headless/CI-style
test runs** where no human is present to answer the terminal prompt — it is
never used by default, and `resolve_verification_stage()` always uses the
terminal-prompt providers.

## How apply_pm_kisan() / apply_pmay() work (schemes/)

Both fill each field using `page.get_by_test_id(...)`, click `next-button`
between steps, upload a small dummy PDF for document fields (the mock
portal only stores the filename, not real file content), call
`resolve_verification_stage()` for OTP/CAPTCHA, then wait for the success
page and read `application-id` / `application-status` from the DOM. Both
return the same structured shape:

```python
{
    "success": True,
    "scheme": "pm_kisan",  # or "pmay"
    "application_id": "PMK-2026-XXXXX",
    "status": "Submitted",
}
```

so a future automation router can call either function interchangeably.

PMAY-specific notes:

- **Dynamic family member rows**: filling `family-member-count` first
  causes the portal to render that many `family-member-{i}-name/age/
  relationship` rows. The code loops through `pmay["family_members"]`
  with `enumerate()` to fill each one — Playwright's locators auto-wait
  for these dynamically-rendered fields, so no manual wait/sleep is
  needed.
- **Dropdowns** (`gender`, `employment-status`, `housing-type`,
  `ownership-status`) use `select_option()` with the exact option text
  confirmed from `schemeConfigs.js` (e.g. `"Daily wage"`, `"Kutcha"`,
  `"No house owned"` — casing/spacing matters).

## What's next (not built yet)

- **Real (non-terminal) human-in-the-loop delivery.** The terminal prompt
  is a stand-in for testing. The real YojanaMitra flow needs the OTP/
  CAPTCHA to come from the actual citizen through the frontend, relayed
  back via LangGraph's resume mechanism instead of a Python `input()`
  call — this only requires writing a new provider function, per the
  design above.
- **Persistent browser storage across separate script runs.** Each call to
  `get_browser_and_page()` starts a fresh, empty browser profile, so
  `localStorage` (where the mock backend keeps applications) does NOT
  carry over between two separate `python main.py ...` executions. This
  was explicitly tested: submitting an application and then checking its
  status *within the same run* (same browser context) correctly finds it
  every time; a *separate* run querying an ID from an earlier run will not
  find it, since it's a brand-new empty browser profile. Not an issue for
  a single demo run, but worth knowing.
