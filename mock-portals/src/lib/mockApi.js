// mockApi.js
//
// A localStorage-backed stand-in for the real backend (FastAPI + Supabase/Postgres)
// that Person B will build. Every function here is `async` and returns plain
// JSON-shaped objects on purpose, so that swapping the internals for real
// `fetch()` calls later does not require touching any component code.
//
// Real backend contract this is designed to mirror:
//   POST   /mock/:scheme/applications          -> create application
//   GET    /mock/:scheme/applications/:id       -> get application
//   PATCH  /mock/:scheme/applications/:id/status -> advance status
//   POST   /mock/:scheme/applications/:id/otp/verify -> verify OTP
//   GET    /mock/last-otp/:applicationId         -> debug endpoint for demo

const STORAGE_KEY = "yojanamitra_mock_applications";
const DEMO_OTP = "123456";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function pad(num, size) {
  return String(num).padStart(size, "0");
}

function generateApplicationId(prefix) {
  const year = new Date().getFullYear();
  const rand = pad(Math.floor(Math.random() * 99999), 5);
  return `${prefix}-${year}-${rand}`;
}

// Simulated status lifecycle. A real backend would move through this via
// Celery jobs polling the portal; here we auto-advance on a timer AND expose
// a manual "advance" function for live-demo safety.
const STATUS_SEQUENCE = [
  "Submitted",
  "Processing",
  "Under Verification",
  "Approved",
];

export const mockApi = {
  /**
   * Create a new application record.
   * @param {string} scheme - e.g. "pmkisan" | "pmay" | "ayushman"
   * @param {string} idPrefix - e.g. "PMK" | "PMAY" | "AYU"
   * @param {object} formData - full collected form state
   */
  async createApplication(scheme, idPrefix, formData) {
    const store = readStore();
    const applicationId = generateApplicationId(idPrefix);
    const record = {
      applicationId,
      scheme,
      formData,
      status: "Submitted",
      statusHistory: [{ status: "Submitted", at: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      otp: DEMO_OTP,
    };
    store[applicationId] = record;
    writeStore(store);
    return { ...record };
  },

  /** Fetch a single application by ID. */
  async getApplication(applicationId) {
    const store = readStore();
    const record = store[applicationId?.trim()?.toUpperCase()];
    return record ? { ...record } : null;
  },

  /**
   * Verify a submitted OTP against the demo OTP. In a real integration this
   * would hit the telecom/SMS gateway; here it's a fixed value so Playwright
   * (and Person C's agent) can reliably automate it.
   */
  async verifyOtp(inputOtp) {
    await wait(500);
    return inputOtp === DEMO_OTP;
  },

  /** Debug helper mirroring a future `GET /mock/last-otp/:id` endpoint. */
  getDemoOtp() {
    return DEMO_OTP;
  },

  /**
   * Advance an application to the next status in the lifecycle.
   * Exposed for a manual "advance status" demo control, and could later be
   * called by a timer to simulate autonomous backend processing.
   */
  async advanceStatus(applicationId) {
    const store = readStore();
    const record = store[applicationId];
    if (!record) return null;
    const currentIndex = STATUS_SEQUENCE.indexOf(record.status);
    const nextStatus =
      currentIndex >= 0 && currentIndex < STATUS_SEQUENCE.length - 1
        ? STATUS_SEQUENCE[currentIndex + 1]
        : record.status;
    record.status = nextStatus;
    record.statusHistory.push({ status: nextStatus, at: new Date().toISOString() });
    store[applicationId] = record;
    writeStore(store);
    return { ...record };
  },

  statusSequence: STATUS_SEQUENCE,
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
