# config.py
#
# Central place for URLs and shared constants used by the automation scripts.
#
# IMPORTANT: these routes were confirmed by inspecting the actual mock-portals
# source code (src/App.jsx and src/data/schemeConfigs.js), not assumed.
# The real scheme ids are "pmkisan" and "ayushman" (no hyphens), NOT
# "pm-kisan" / "ayushman-bharat".

BASE_URL = "http://localhost:5173"
BACKEND_BASE_URL = "http://localhost:8000"

# Scheme landing pages
PM_KISAN_URL = f"{BASE_URL}/pmkisan"
PMAY_URL = f"{BASE_URL}/pmay"
AYUSHMAN_URL = f"{BASE_URL}/ayushman"

# Scheme "apply" pages (the multi-step form) — automation will mostly work here
PM_KISAN_APPLY_URL = f"{PM_KISAN_URL}/apply"
PMAY_APPLY_URL = f"{PMAY_URL}/apply"
AYUSHMAN_APPLY_URL = f"{AYUSHMAN_URL}/apply"

# Scheme status-check pages
PM_KISAN_STATUS_URL = f"{PM_KISAN_URL}/status"
PMAY_STATUS_URL = f"{PMAY_URL}/status"
AYUSHMAN_STATUS_URL = f"{AYUSHMAN_URL}/status"

# The mock portal's OTP verification currently accepts a single fixed value.
# See mock-portals/src/lib/mockApi.js -> DEMO_OTP.
DEMO_OTP = "123456"

# How long Playwright should wait for elements before giving up (milliseconds).
DEFAULT_TIMEOUT_MS = 10_000
