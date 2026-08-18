/* -----------------------------------------------------------------------
 * MOCK DATA — swap every export here for a real API/DB call later.
 * Kept in one file so page.tsx, layout.tsx, schemes/page.tsx and
 * status/page.tsx all read from the same source instead of duplicating.
 * -------------------------------------------------------------------- */

// Info captured during the login / demographic-form step.
// "name" is used separately for the avatar + header greeting.
// "details" is a flat list so adding/removing a field your form actually
// captures is a one-line change here — no JSX edits needed.
// TODO: rename/add/remove entries to match your real demographic-form fields.
export const USER = {
  name: "Ramesh Kumar Yadav",
  details: [
    { label: "Age", value: "42 yrs" },
    { label: "Gender", value: "Male" },
    { label: "Phone Number", value: "+91 98XXXXXX41" },
    { label: "Location", value: "Bulandshahr, Uttar Pradesh" },
    { label: "Occupation", value: "Farmer (Small Landholder)" },
    { label: "Category", value: "OBC" },
    { label: "Annual Income", value: "₹1,80,000" },
    { label: "Family Members", value: "5" },
  ],
};

// The document types your doc-upload flow supports.
// Keep this in sync with DOC_LABELS in the upload page.
export type DocumentTypeId = "aadhaar" | "income" | "ration" | "kcc";

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeId, string> = {
  aadhaar: "Aadhaar Card",
  income: "Income Certificate",
  ration: "Ration Card",
  kcc: "Kisan Credit Card",
};

// Documents the user uploaded in the doc-upload flow.
export type UploadedDoc = {
  key: DocumentTypeId;
  label: string;
  fileName: string;
  uploadedAt: string;
  verified: boolean;
};

export const UPLOADED_DOCUMENTS: UploadedDoc[] = [
  {
    key: "aadhaar",
    label: "Aadhaar Card",
    fileName: "aadhaar_front.jpg",
    uploadedAt: "12 Aug 2026",
    verified: true,
  },
  {
    key: "income",
    label: "Income Certificate",
    fileName: "income_certificate.pdf",
    uploadedAt: "12 Aug 2026",
    verified: true,
  },
  {
    key: "ration",
    label: "Ration Card",
    fileName: "ration_card.jpg",
    uploadedAt: "12 Aug 2026",
    verified: true,
  },
];

// Shape matches the eligibility-agent JSON response exactly.
export type SchemeVerdict = {
  scheme_name: string;
  category: string;
  level: "central" | "state";
  eligible: boolean;
  confidence: "low" | "medium" | "high";
  reason: string;
  missing_info: string[];
  is_automatable: boolean;
};

// TODO (backend): replace with the real agent response, e.g.
// const { verdicts } = await fetch("/api/eligibility").then(r => r.json());
export const SCHEME_VERDICTS: SchemeVerdict[] = [
  {
    scheme_name: "Pradhan Mantri Awas Yojana (PMAY)",
    category: "Housing",
    level: "central",
    eligible: false,
    confidence: "low",
    reason:
      "The citizen's eligibility for PMAY cannot be determined without information on their annual income, land ownership, and pucca house ownership.",
    missing_info: ["annual_income", "owns_land", "owns_pucca_house"],
    is_automatable: true,
  },
  {
    scheme_name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    category: "Agriculture",
    level: "central",
    eligible: false,
    confidence: "low",
    reason:
      "The citizen's eligibility for PM-KISAN cannot be determined without information on their land ownership and land area.",
    missing_info: ["owns_land", "land_area_acres"],
    is_automatable: true,
  },
  {
    scheme_name: "Ayushman Bharat/PM-JAY",
    category: "Healthcare",
    level: "central",
    eligible: false,
    confidence: "low",
    reason:
      "The citizen's eligibility for Ayushman Bharat/PM-JAY cannot be determined without information on their annual income and family size.",
    missing_info: ["annual_income"],
    is_automatable: true,
  },
  {
    scheme_name: "National Scholarship schemes",
    category: "Education",
    level: "central",
    eligible: false,
    confidence: "low",
    reason:
      "The citizen's eligibility for National Scholarship schemes cannot be determined without information on their educational background and annual income.",
    missing_info: ["annual_income", "educational_background"],
    is_automatable: false,
  },
  {
    scheme_name: "Maharashtra Government's Disability Pension Scheme",
    category: "Disability",
    level: "state",
    eligible: false,
    confidence: "low",
    reason:
      "The citizen's eligibility for Maharashtra Government's Disability Pension Scheme cannot be determined without information on their disability status.",
    missing_info: ["disability_status"],
    is_automatable: false,
  },
];

// Current Application Status — mock, wire to DB later.
export type ApplicationStatusValue =
  | "under_review"
  | "documents_pending"
  | "submitted"
  | "approved"
  | "rejected";

export type Application = {
  id: string;
  scheme_name: string;
  status: ApplicationStatusValue;
  applied_on: string;
  last_updated: string;
  note?: string;
};

export const APPLICATIONS: Application[] = [
  {
    id: "app-1",
    scheme_name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    status: "under_review",
    applied_on: "10 Aug 2026",
    last_updated: "14 Aug 2026",
  },
  {
    id: "app-2",
    scheme_name: "Pradhan Mantri Awas Yojana (PMAY)",
    status: "documents_pending",
    applied_on: "5 Aug 2026",
    last_updated: "9 Aug 2026",
    note: "Upload income certificate to continue",
  },
  {
    id: "app-3",
    scheme_name: "Ayushman Bharat/PM-JAY",
    status: "approved",
    applied_on: "20 Jul 2026",
    last_updated: "1 Aug 2026",
  },
];