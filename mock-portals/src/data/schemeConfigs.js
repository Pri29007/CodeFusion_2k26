// schemeConfigs.js
//
// Each scheme is defined declaratively: name, theming, and an ordered list
// of form steps + fields. The generic SchemeApply engine renders these
// configs, so adding a 4th scheme later means adding a config object here,
// not writing a new portal from scratch.
//
// Field shape:
// { id, label, type, required, options?, placeholder?, testId }
// type: "text" | "tel" | "number" | "date" | "select" | "textarea" | "file"

export const schemes = {
  pmkisan: {
    id: "pmkisan",
    idPrefix: "PMK",
    name: "PM-KISAN",
    fullName: "Pradhan Mantri Kisan Samman Nidhi",
    tagline: "Income support of \u20B96,000/year for eligible farmer families",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    accent: "kisan",
    heroPoints: [
      "\u20B92,000 released every 4 months directly to your bank account",
      "For small and marginal landholding farmer families",
      "Fully online application \u2014 no agent or fee required",
    ],
    eligibility: [
      "You own cultivable agricultural land in your name",
      "Your land records are updated with the state revenue department",
      "You are not an income-tax payee in the last assessment year",
    ],
    documentsRequired: ["Aadhaar Card", "Land Ownership Record", "Bank Passbook"],
    steps: [
      {
        id: "personal",
        title: "Personal Details",
        fields: [
          { id: "fullName", label: "Full Name", type: "text", required: true, testId: "full-name" },
          { id: "dob", label: "Date of Birth", type: "date", required: true, testId: "dob" },
          { id: "gender", label: "Gender", type: "select", required: true, testId: "gender", options: ["Male", "Female", "Other"] },
          { id: "mobile", label: "Mobile Number", type: "tel", required: true, testId: "mobile-number", placeholder: "10-digit mobile number" },
          { id: "aadhaar", label: "Aadhaar Number", type: "text", required: true, testId: "aadhaar-number", placeholder: "XXXX XXXX XXXX" },
          { id: "address", label: "Address", type: "textarea", required: true, testId: "address" },
          { id: "state", label: "State", type: "text", required: true, testId: "state" },
          { id: "district", label: "District", type: "text", required: true, testId: "district" },
          { id: "village", label: "Village", type: "text", required: true, testId: "village" },
        ],
      },
      {
        id: "land",
        title: "Land Details",
        fields: [
          { id: "landRecordId", label: "Land Record ID", type: "text", required: true, testId: "land-record-id" },
          { id: "surveyNumber", label: "Survey Number", type: "text", required: true, testId: "survey-number" },
          { id: "landArea", label: "Land Area (in acres)", type: "number", required: true, testId: "land-area" },
          { id: "landLocation", label: "Land Location", type: "text", required: true, testId: "land-location" },
          { id: "landDistrict", label: "District", type: "text", required: true, testId: "land-district" },
          { id: "landState", label: "State", type: "text", required: true, testId: "land-state" },
        ],
      },
      {
        id: "bank",
        title: "Bank Details",
        fields: [
          { id: "accountHolderName", label: "Account Holder Name", type: "text", required: true, testId: "account-holder-name" },
          { id: "bankName", label: "Bank Name", type: "text", required: true, testId: "bank-name" },
          { id: "accountNumber", label: "Account Number", type: "text", required: true, testId: "account-number" },
          { id: "ifsc", label: "IFSC Code", type: "text", required: true, testId: "ifsc-code" },
        ],
      },
      {
        id: "documents",
        title: "Documents",
        type: "documents",
        fields: [
          { id: "aadhaarDoc", label: "Aadhaar Document", testId: "aadhaar-upload" },
          { id: "landRecordDoc", label: "Land Record", testId: "land-record-upload" },
          { id: "bankProofDoc", label: "Bank Proof", testId: "bank-proof-upload" },
        ],
      },
    ],
  },

  pmay: {
    id: "pmay",
    idPrefix: "PMAY",
    name: "PMAY",
    fullName: "Pradhan Mantri Awas Yojana",
    tagline: "Affordable housing assistance for eligible urban and rural families",
    ministry: "Ministry of Housing & Urban Affairs",
    accent: "pmay",
    heroPoints: [
      "Interest subsidy on home loans for eligible beneficiaries",
      "Priority for women-owned and first-time home applications",
      "Track your application status online at every stage",
    ],
    eligibility: [
      "You or your family do not already own a pucca house",
      "Household falls within the notified income category",
      "You have not availed central housing assistance before",
    ],
    documentsRequired: ["Aadhaar Card", "Income Certificate", "Address Proof"],
    steps: [
      {
        id: "personal",
        title: "Personal Details",
        fields: [
          { id: "fullName", label: "Full Name", type: "text", required: true, testId: "full-name" },
          { id: "dob", label: "Date of Birth", type: "date", required: true, testId: "dob" },
          { id: "gender", label: "Gender", type: "select", required: true, testId: "gender", options: ["Male", "Female", "Other"] },
          { id: "mobile", label: "Mobile Number", type: "tel", required: true, testId: "mobile-number" },
          { id: "aadhaar", label: "Aadhaar Number", type: "text", required: true, testId: "aadhaar-number" },
          { id: "address", label: "Address", type: "textarea", required: true, testId: "address" },
          { id: "state", label: "State", type: "text", required: true, testId: "state" },
          { id: "district", label: "District", type: "text", required: true, testId: "district" },
        ],
      },
      {
        id: "family",
        title: "Family Details",
        type: "family",
        fields: [
          { id: "familyMemberCount", label: "Number of Family Members", type: "number", required: true, testId: "family-member-count" },
        ],
      },
      {
        id: "financial",
        title: "Financial Details",
        fields: [
          { id: "annualIncome", label: "Annual Household Income (\u20B9)", type: "number", required: true, testId: "annual-income" },
          { id: "occupation", label: "Occupation", type: "text", required: true, testId: "occupation" },
          { id: "employmentStatus", label: "Employment Status", type: "select", required: true, testId: "employment-status", options: ["Salaried", "Self-employed", "Daily wage", "Unemployed"] },
        ],
      },
      {
        id: "housing",
        title: "Housing Details",
        fields: [
          { id: "housingType", label: "Current Housing Type", type: "select", required: true, testId: "housing-type", options: ["Kutcha", "Semi-pucca", "Rented", "Homeless"] },
          { id: "ownershipStatus", label: "House Ownership Status", type: "select", required: true, testId: "ownership-status", options: ["No house owned", "Jointly owned", "Owned elsewhere"] },
          { id: "livingConditions", label: "Current Living Conditions", type: "textarea", required: true, testId: "living-conditions" },
        ],
      },
      {
        id: "bank",
        title: "Bank Details",
        fields: [
          { id: "accountHolderName", label: "Account Holder Name", type: "text", required: true, testId: "account-holder-name" },
          { id: "bankName", label: "Bank Name", type: "text", required: true, testId: "bank-name" },
          { id: "accountNumber", label: "Account Number", type: "text", required: true, testId: "account-number" },
          { id: "ifsc", label: "IFSC Code", type: "text", required: true, testId: "ifsc-code" },
        ],
      },
      {
        id: "documents",
        title: "Document Upload",
        type: "documents",
        fields: [
          { id: "aadhaarDoc", label: "Aadhaar", testId: "aadhaar-upload" },
          { id: "incomeCertDoc", label: "Income Certificate", testId: "income-certificate-upload" },
          { id: "addressProofDoc", label: "Address Proof", testId: "address-proof-upload" },
        ],
      },
    ],
    verificationType: "captcha",
  },

  ayushman: {
    id: "ayushman",
    idPrefix: "AYU",
    name: "Ayushman Bharat",
    fullName: "Ayushman Bharat \u2014 PM-JAY",
    tagline: "Health cover up to \u20B95 lakh per family per year",
    ministry: "Ministry of Health & Family Welfare",
    accent: "ayush",
    heroPoints: [
      "Cashless treatment at empanelled hospitals nationwide",
      "Covers hospitalisation, surgeries, and pre/post-care costs",
      "No premium \u2014 fully funded for eligible households",
    ],
    eligibility: [
      "Your household is listed under SECC deprivation criteria",
      "You do not have an existing active health insurance scheme",
      "Family details match your Aadhaar-linked records",
    ],
    documentsRequired: ["Aadhaar Card", "Income Certificate"],
    steps: [
      {
        id: "applicant",
        title: "Applicant Details",
        fields: [
          { id: "fullName", label: "Full Name", type: "text", required: true, testId: "full-name" },
          { id: "dob", label: "Date of Birth", type: "date", required: true, testId: "dob" },
          { id: "gender", label: "Gender", type: "select", required: true, testId: "gender", options: ["Male", "Female", "Other"] },
          { id: "mobile", label: "Mobile Number", type: "tel", required: true, testId: "mobile-number" },
          { id: "aadhaar", label: "Aadhaar Number", type: "text", required: true, testId: "aadhaar-number" },
          { id: "address", label: "Address", type: "textarea", required: true, testId: "address" },
          { id: "state", label: "State", type: "text", required: true, testId: "state" },
          { id: "district", label: "District", type: "text", required: true, testId: "district" },
        ],
      },
      {
        id: "family",
        title: "Family Details",
        type: "family",
        fields: [
          { id: "familySize", label: "Family Size", type: "number", required: true, testId: "family-size" },
        ],
      },
      {
        id: "socioeconomic",
        title: "Socioeconomic Details",
        fields: [
          { id: "incomeCategory", label: "Income Category", type: "select", required: true, testId: "income-category", options: ["BPL", "APL", "EWS"] },
          { id: "occupation", label: "Occupation", type: "text", required: true, testId: "occupation" },
          { id: "householdCategory", label: "Household Category", type: "select", required: true, testId: "household-category", options: ["Rural", "Urban"] },
        ],
      },
      {
        id: "documents",
        title: "Documents",
        type: "documents",
        fields: [
          { id: "aadhaarDoc", label: "Aadhaar Document", testId: "aadhaar-upload" },
          { id: "incomeCertDoc", label: "Income Certificate", testId: "income-certificate-upload" },
        ],
      },
    ],
    verificationType: "otp",
  },
};

export const schemeList = Object.values(schemes);
