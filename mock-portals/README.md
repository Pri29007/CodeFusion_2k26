# Mock Government Scheme Portals — YojanaMitra (Person D)

Three simulated scheme-application websites (PM-KISAN, PMAY, Ayushman Bharat)
built to serve as the automation target for the Playwright + LangGraph agent
that Person C will build. Built as one React app with three portal routes,
not three separate projects.

## Stack

- React 19 + Vite
- React Router (client-side routing between the three portals)
- Tailwind CSS v4

## How to run

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

To build a production bundle:

```bash
npm run build
npm run preview
```

## Portal URLs

| Scheme | Landing | Apply | Status |
|---|---|---|---|
| PM-KISAN | `/pmkisan` | `/pmkisan/apply` | `/pmkisan/status` |
| PMAY | `/pmay` | `/pmay/apply` | `/pmay/status` |
| Ayushman Bharat | `/ayushman` | `/ayushman/apply` | `/ayushman/status` |

`/` shows a home page linking to all three.

## Project structure

```
src/
  data/schemeConfigs.js     # declarative field/step definitions per scheme
  lib/mockApi.js            # localStorage-backed "backend" (application CRUD, OTP, status)
  lib/accentClasses.js      # static Tailwind class map per scheme's accent color
  components/                # shared, reusable across all 3 portals
    FormInput.jsx
    DocumentUpload.jsx
    FamilyMembers.jsx
    ProgressIndicator.jsx
    OTPVerification.jsx
    CaptchaVerification.jsx
    ApplicationReview.jsx
    GovHeader.jsx / GovFooter.jsx
  pages/
    Home.jsx
    SchemeLanding.jsx       # generic, renders from schemeConfigs
    SchemeApply.jsx         # generic multi-step engine, renders from schemeConfigs
    SchemeStatus.jsx
```

Adding a 4th scheme later = adding one config object to `schemeConfigs.js`,
not building a new portal from scratch.

## Verification behavior (important for automation)

- **PM-KISAN & Ayushman Bharat** use **OTP verification**. The demo OTP is
  fixed: `123456`. It is not shown on screen (mirrors a real SMS flow) —
  Playwright/the agent should already know this value or fetch it via
  `mockApi.getDemoOtp()`.
- **PMAY** uses **CAPTCHA verification**. A random 6-character challenge is
  generated client-side and stored in the DOM as
  `data-captcha-answer="XXXXXX"` on the `[data-testid="captcha-verification"]`
  container — Playwright can read that attribute directly rather than doing
  OCR, since this is a mock, not a security boundary.

## Key `data-testid` values for Playwright automation

**Navigation (every step)**
- `next-button`, `back-button`, `submit-button`

**PM-KISAN fields**
- `full-name`, `dob`, `gender`, `mobile-number`, `aadhaar-number`, `address`, `state`, `district`, `village`
- `land-record-id`, `survey-number`, `land-area`, `land-location`, `land-district`, `land-state`
- `account-holder-name`, `bank-name`, `account-number`, `ifsc-code`
- `aadhaar-upload`, `land-record-upload`, `bank-proof-upload`

**PMAY fields** (additionally)
- `family-member-count`, `family-member-{i}-name`, `family-member-{i}-age`, `family-member-{i}-relationship`
- `annual-income`, `occupation`, `employment-status`
- `housing-type`, `ownership-status`, `living-conditions`
- `income-certificate-upload`, `address-proof-upload`

**Ayushman Bharat fields** (additionally)
- `family-size`, `income-category`, `household-category`

**Verification**
- `otp-verification`, `otp-input`, `verify-otp-button`, `otp-error`
- `captcha-verification`, `captcha-challenge`, `captcha-input`, `verify-captcha-button`, `captcha-error`

**Review & submission**
- `application-review`, `declaration-checkbox`, `edit-step-{stepId}`
- `submission-success`, `application-id`, `application-status`

**Status page**
- `status-application-id-input`, `check-status-button`, `application-status`, `status-not-found`
- `demo-advance-status-button` — manual override to force the next status transition, for live-demo safety (avoids waiting on a real timer during a presentation)

## What's mocked now / needs backend integration later

| Currently | Will need |
|---|---|
| `mockApi.js` reads/writes `localStorage` | Swap for real `fetch()` calls to Person B's FastAPI endpoints — function signatures were deliberately kept `async` and JSON-shaped so components don't need to change |
| OTP is a fixed value (`123456`), never actually sent | Real SMS gateway integration (out of scope for the mock) |
| CAPTCHA answer is exposed via `data-captcha-answer` | A real/harder CAPTCHA isn't needed for a mock automation target — kept intentionally simple |
| Status transitions via a manual "Advance status" button or none at all | Person B's Celery job should poll `mockApi.getApplication(id)` (or its future REST equivalent) and call `advanceStatus` on a timer to simulate autonomous government processing |
| File uploads only store the filename, not real file bytes | Fine for a mock; real backend would need actual file storage (S3/Supabase storage) |
| No persistence across browsers/devices (localStorage is per-browser) | Real backend needs a proper database (Postgres/Supabase) — `mockApi.js` was shaped to make this swap mechanical |

## Suggested API contract for Playwright script integration (Person D's next phase)

```
POST   /mock/:scheme/applications              -> create application, returns { applicationId, status }
GET    /mock/:scheme/applications/:id          -> get application
PATCH  /mock/:scheme/applications/:id/status    -> advance status
POST   /mock/:scheme/applications/:id/otp/verify -> verify OTP
GET    /mock/last-otp/:applicationId            -> debug endpoint for demo
```

Playwright automation should call `page.getByTestId(...)` against the values
listed above rather than CSS selectors, since these are guaranteed stable
across visual redesigns.
