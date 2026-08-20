"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Poppins, Noto_Sans } from "next/font/google";
import {useEffect} from "react";
import{ playStaticAudio, type Lang} from "../../lib/audio";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Minus,
  Plus,
  User,
  Home,
  Briefcase,
  HeartPulse,
  Loader2,
  Globe,
  Camera,
  ImageIcon,
  FileCheck2,
  ScanLine,
  RotateCcw,
  Trash2,
  Lock,
  FileText,
  Volume2,
} from "lucide-react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

/* -------------------------------------------------------------------------
 * TYPES — profile form
 * ---------------------------------------------------------------------- */
type FormData = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dob: string;

  aadhaarNumber: string;
  age: string;
  gender: string;
  category: string;
  maritalStatus: string;
  address: string;
  city: string;
  state: string;
  rationCard: string;
  income: string;
  housing: string;
  rooms: number;
  familyMembers: number;
  under18Members: number;
  occupation: string;
  occupationOther: string;
  landOwned: boolean | null;
  landAcres: string;
  disability: boolean | null;
  chronicIllness: boolean | null;
};

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  dob: "",

  aadhaarNumber: "",
  age: "",
  gender: "",
  category: "",
  maritalStatus: "",
  address: "",
  city: "",
  state: "",
  rationCard: "",
  income: "",
  housing: "",
  rooms: 1,
  familyMembers: 1,
  under18Members: 0,
  occupation: "",
  occupationOther: "",
  landOwned: null,
  landAcres: "",
  disability: null,
  chronicIllness: null,
};

type SectionId =
  | "basic"
  | "demographic"
  | "financial"
  | "occupation"
  | "health"
  | "documents";

/* -------------------------------------------------------------------------
 * TYPES — document upload
 * ---------------------------------------------------------------------- */
type DocType = "aadhaar" | "income" | "ration" | "kcc";
type DocStatus = "idle" | "uploading" | "scanning" | "verifying" | "done";

type DocState = {
  status: DocStatus;
  fileName: string | null;
  previewUrl: string | null;
};

const DOC_LABELS: Record<DocType, string> = {
  aadhaar: "Aadhaar Card",
  income: "Income Certificate",
  ration: "Ration Card",
  kcc: "Kisan Credit Card",
};

// Aadhaar is the only mandatory / always-unlocked doc.
// Everything else stays locked until Aadhaar is verified ("done").
const REQUIRED_DOCS: DocType[] = ["aadhaar"];
const GATED_DOCS: DocType[] = ["income", "ration", "kcc"];

const initialDocState: DocState = {
  status: "idle",
  fileName: null,
  previewUrl: null,
};

/* -------------------------------------------------------------------------
 * REUSABLE UI PIECES — form controls
 * ---------------------------------------------------------------------- */
function ChipGroup({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  columns?: 2 | 3 | 4;
}) {
  const gridCols =
    columns === 4
      ? "grid-cols-4"
      : columns === 3
      ? "grid-cols-3"
      : "grid-cols-2";

  return (
    <div className={`grid ${gridCols} gap-2`}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`min-h-[48px] px-3 rounded-xl text-sm font-medium border transition-colors ${
              active
                ? "bg-blue-700 border-blue-700 text-white"
                : "bg-white border-gray-300 text-gray-700 active:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={value === true}
        className={`min-h-[48px] rounded-xl text-sm font-medium border transition-colors ${
          value === true
            ? "bg-blue-700 border-blue-700 text-white"
            : "bg-white border-gray-300 text-gray-700 active:bg-gray-50"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={value === false}
        className={`min-h-[48px] rounded-xl text-sm font-medium border transition-colors ${
          value === false
            ? "bg-blue-700 border-blue-700 text-white"
            : "bg-white border-gray-300 text-gray-700 active:bg-gray-50"
        }`}
      >
        No
      </button>
    </div>
  );
}

function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
        className="w-12 h-12 rounded-xl border border-gray-300 flex items-center justify-center text-gray-700 active:bg-gray-50 disabled:opacity-40"
      >
        <Minus className="w-5 h-5" />
      </button>
      <span className="w-10 text-center text-lg font-semibold text-gray-900">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
        className="w-12 h-12 rounded-xl border border-gray-300 flex items-center justify-center text-gray-700 active:bg-gray-50 disabled:opacity-40"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="block text-sm font-medium text-gray-800 mb-1">
        {label}
      </label>
      {helper && <p className="text-xs text-gray-400 mb-2">{helper}</p>}
      {children}
    </div>
  );
}

function Section({
  id,
  title,
  icon,
  isOpen,
  isComplete,
  optional,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  isComplete: boolean;
  optional?: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-4 min-h-[56px]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isComplete ? "bg-blue-700" : "bg-gray-100"
            }`}
          >
            {isComplete ? (
              <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
            ) : (
              <span className="text-gray-500">{icon}</span>
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {optional && (
              <p className="text-xs text-gray-400">Optional — you can skip this</p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * REUSABLE UI PIECES — document upload
 * ---------------------------------------------------------------------- */
function DocChip({
  label,
  active,
  done,
  locked,
  onClick,
}: {
  label: string;
  active: boolean;
  done: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      aria-pressed={active}
      className={`min-h-[48px] px-4 rounded-full text-sm font-medium border flex items-center gap-1.5 transition-colors ${
        locked
          ? "bg-gray-50 border-gray-200 text-gray-350 cursor-not-allowed"
          : active
          ? "bg-blue-700 border-blue-700 text-white"
          : "bg-white border-gray-300 text-gray-700 active:bg-gray-50"
      }`}
    >
      {locked && <Lock className="w-3.5 h-3.5 text-gray-350" />}
      {done && (
        <Check
          className={`w-4 h-4 ${active ? "text-white" : "text-blue-700"}`}
          strokeWidth={2.5}
        />
      )}
      {label}
    </button>
  );
}

function StatusBanner({ status }: { status: DocStatus }) {
  if (status === "uploading") {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
        <Loader2 className="w-4 h-4 animate-spin" />
        Uploading...
      </div>
    );
  }
  if (status === "scanning") {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
        <ScanLine className="w-4 h-4 animate-pulse" />
        Scanning Document (Vision AI)...
      </div>
    );
  }
  if (status === "verifying") {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
        <Loader2 className="w-4 h-4 animate-spin" />
        Verifying...
      </div>
    );
  }
  if (status === "done") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
        <FileCheck2 className="w-4 h-4" />
        Done
      </div>
    );
  }
  return null;
}

function DocumentUploadCard({
  docType,
  state,
  onFileSelected,
  onRetake,
  onRemove,
}: {
  docType: DocType;
  state: DocState;
  onFileSelected: (docType: DocType, file: File) => void;
  onRetake: (docType: DocType) => void;
  onRemove: (docType: DocType) => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(docType, file);
    e.target.value = "";
  }

  const isProcessing =
    state.status === "uploading" ||
    state.status === "scanning" ||
    state.status === "verifying";
  const isIdle = state.status === "idle";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <p className="text-sm font-semibold text-gray-900 mb-3">
        {DOC_LABELS[docType]}
        {REQUIRED_DOCS.includes(docType) && (
          <span className="ml-1.5 text-xs font-normal text-red-500">Required</span>
        )}
      </p>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {isIdle && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="min-h-[52px] rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 font-medium text-sm flex flex-col items-center justify-center gap-1 active:bg-blue-100"
          >
            <Camera className="w-5 h-5" />
            Take Photo
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="min-h-[52px] rounded-xl border-2 border-dashed border-gray-300 text-gray-600 font-medium text-sm flex flex-col items-center justify-center gap-1 active:bg-gray-50"
          >
            <ImageIcon className="w-5 h-5" />
            Upload from Gallery
          </button>
        </div>
      )}

      {!isIdle && (
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-gray-50">
            {state.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.previewUrl}
                alt={`${DOC_LABELS[docType]} preview`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <p className="text-sm text-gray-800 truncate">{state.fileName}</p>
              <div className="mt-1">
                <StatusBanner status={state.status} />
              </div>
            </div>

            {!isProcessing && (
              <div className="flex items-center gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => onRetake(docType)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-700 min-h-[32px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(docType)}
                  className="flex items-center gap-1 text-xs font-medium text-red-500 min-h-[32px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * PAGE
 * ---------------------------------------------------------------------- */
export default function DemographicDetailsPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const hasPlayedWelcome = useRef(false);

  useEffect(() => {
    if (hasPlayedWelcome.current) return;
    hasPlayedWelcome.current = true;

    const storedLang = (localStorage.getItem("preferred_language") as Lang) || "en";
    playStaticAudio("welcome", storedLang);
  }, []);
  const fileRefs = useRef<Record<DocType, File | null>>({
    aadhaar: null,
    income: null,
    ration: null,
    kcc: null,
  });
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    basic: true,
    demographic: false,
    financial: false,
    occupation: false,
    health: false,
    documents: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // ---- document upload state ----
  const [selectedDocs, setSelectedDocs] = useState<DocType[]>(["aadhaar"]);
  const [docStates, setDocStates] = useState<Record<DocType, DocState>>({
    aadhaar: { ...initialDocState },
    income: { ...initialDocState },
    ration: { ...initialDocState },
    kcc: { ...initialDocState },
  });

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSection(id: SectionId) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Section completion checks — used only to show the check-mark badge.
  const basicComplete =
    !!formData.firstName && !!formData.lastName && !!formData.phoneNumber && !!formData.dob ;
  const demographicComplete =
    !!formData.age && !!formData.gender && !!formData.category && !!formData.maritalStatus;
  const financialComplete =
    !!formData.rationCard && !!formData.income && !!formData.housing;
  const occupationComplete =
    !!formData.occupation &&
    (formData.landOwned === false || (formData.landOwned === true && !!formData.landAcres));
  // Health section is optional, so it's never "required" to be complete.
  const healthComplete = formData.disability !== null && formData.chronicIllness !== null;

  const aadhaarDone = docStates.aadhaar.status === "done";
  // Documents section badge only cares about the mandatory doc (Aadhaar).
  const documentsComplete = aadhaarDone;

  // Final gate: profile sections + Aadhaar verified. Other docs are optional.
  const canSubmit =
    basicComplete && demographicComplete && financialComplete && occupationComplete && aadhaarDone;

  // ---- document handlers ----
  function toggleDocSelection(docType: DocType) {
    // Gated docs can't even be selected until Aadhaar is verified.
    if (GATED_DOCS.includes(docType) && !aadhaarDone) return;
    setSelectedDocs((prev) =>
      prev.includes(docType) ? prev.filter((d) => d !== docType) : [...prev, docType]
    );
  }

  function handleFileSelected(docType: DocType, file: File) {
    fileRefs.current[docType] = file;
    const previewUrl = URL.createObjectURL(file);

    setDocStates((prev) => ({
      ...prev,
      [docType]: { status: "uploading", fileName: file.name, previewUrl },
    }));

    setTimeout(() => {
      setDocStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], status: "scanning" },
      }));

      setTimeout(() => {
        setDocStates((prev) => ({
          ...prev,
          [docType]: { ...prev[docType], status: "verifying" },
        }));

        setTimeout(() => {
          setDocStates((prev) => ({
            ...prev,
            [docType]: { ...prev[docType], status: "done" },
          }));
          // No auto-redirect here anymore — user decides when to continue
          // via the "Continue to Dashboard" button below, since more
          // (optional) docs may now be uploaded once Aadhaar is done.
        }, 1500); // verify animation duration, 1-2s
      }, 1400);
    }, 1000);
  }

  function handleRetake(docType: DocType) {
    setDocStates((prev) => ({
      ...prev,
      [docType]: { ...initialDocState },
    }));
  }

  function handleRemove(docType: DocType) {
    setDocStates((prev) => ({
      ...prev,
      [docType]: { ...initialDocState },
    }));
    // Never fully deselect Aadhaar — keep its card visible since it's required.
    if (docType !== "aadhaar") {
      setSelectedDocs((prev) => prev.filter((d) => d !== docType));
    }
  }

  async function handleContinue() {
    if (!canSubmit) return;
    setIsSaving(true);

    const aadhaarFile = fileRefs.current.aadhaar;
    if (!aadhaarFile) {
      setIsSaving(false);
      return;
    }

    const form = new FormData();
    form.append("aadhaar_number", formData.aadhaarNumber);
    form.append("first_name", formData.firstName);
    form.append("last_name", formData.lastName);
    form.append("phone_number", formData.phoneNumber);
    form.append("date_of_birth", formData.dob);
    form.append("age", String(formData.age));
    const preferredLanguage = localStorage.getItem("preferred_language") || "hi";
    form.append("preferred_language", preferredLanguage);
    form.append("gender", formData.gender);
    if (formData.category) form.append("category", formData.category);
    if (formData.maritalStatus) form.append("marital_status", formData.maritalStatus);
    if (formData.address) form.append("address", formData.address);
    if (formData.city) form.append("city", formData.city);
    if (formData.state) form.append("state", formData.state);
    if (formData.rationCard) form.append("ration_card_type", formData.rationCard);
    if (formData.income) form.append("annual_income_range", formData.income);
    if (formData.housing) form.append("housing_type", formData.housing);
    if (formData.rooms != null) form.append("number_of_rooms", String(formData.rooms));
    if (formData.familyMembers != null) form.append("family_members_dependents", String(formData.familyMembers));
    const occupationValue =
      formData.occupation === "Other" && formData.occupationOther
        ? formData.occupationOther
        : formData.occupation;
    if (occupationValue) form.append("occupation", occupationValue);
    if (formData.landOwned != null) form.append("owns_agricultural_land", String(formData.landOwned));
    if (formData.landAcres) form.append("land_area_acres", String(formData.landAcres));
    if (formData.disability != null) form.append("disability_status", String(formData.disability));
    if (formData.chronicIllness != null) form.append("chronic_illness_or_pregnant", String(formData.chronicIllness));
    form.append("aadhaar_doc", aadhaarFile);

    try {
      const res = await fetch("http://localhost:8000/users/", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error("Signup failed:", errorData);
        setIsSaving(false);
        return;
      }

      const user = await res.json();
      console.log("User created:", user);
      localStorage.setItem("aadhaar_number", user.aadhaar_number);
      localStorage.setItem("first_name", user.first_name);

      // Upload any other staged documents (Ration Card, Income Certificate, KCC)
      // now that the user record exists in the backend.
      const otherDocTypes: DocType[] = ["income", "ration", "kcc"];
      for (const docType of otherDocTypes) {
        const file = fileRefs.current[docType];
        if (!file) continue;

        const docForm = new FormData();
        docForm.append("user_id", user.aadhaar_number);
        docForm.append("doc_type", docType);
        docForm.append("file", file);

        try {
          const docRes = await fetch("http://localhost:8000/documents/upload", {
            method: "POST",
            body: docForm,
          });
          if (!docRes.ok) {
            const errData = await docRes.json().catch(() => null);
            console.error(`Failed to upload ${docType}:`, errData);
          }
        } catch (err) {
          console.error(`Network error uploading ${docType}:`, err);
        }
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Network error:", err);
      setIsSaving(false);
    }
  }

  function handleListen() {
    const storedLang = (localStorage.getItem("preferred_language") as Lang) || "en";
    playStaticAudio("welcome", storedLang);
  }

  return (
    <div
      className={`${poppins.variable} ${notoSans.variable} min-h-screen bg-[#F5F6F8] font-[family-name:var(--font-body)]`}
    >
      {/* Header with step indicator */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-sm mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-blue-700 mb-1">Step 2 of 2</p>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-gray-900">
                Tell us about yourself
              </h1>
            </div>
            <button
              type="button"
              onClick={handleListen}
              className="shrink-0 min-h-[40px] px-4 rounded-full bg-blue-900 text-white text-sm font-semibold flex items-center gap-2 active:bg-blue-800"
            >
              <Volume2 className="w-4 h-4" />
              Listen
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            This helps us match you to the right schemes
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-blue-700 rounded-full" />
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-5">
        <div className="max-w-sm mx-auto flex flex-col gap-4">
          {/* SECTION 0: Basic Info */}
          <Section
            id="basic"
            title="Basic Info"
            icon={<Globe className="w-5 h-5" />}
            isOpen={openSections.basic}
            isComplete={basicComplete}
            onToggle={toggleSection}
          >
            <Field label="First Name">
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="e.g. Ramesh"
                className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </Field>

            <Field label="Last Name">
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="e.g. Kumar"
                className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </Field>

            <Field label="Phone Number">
              <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                <span className="text-gray-700 font-medium text-base pr-2 border-r border-gray-300 h-[48px] flex items-center">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.phoneNumber}
                  onChange={(e) => update("phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  className="flex-1 h-[48px] bg-transparent outline-none text-base text-gray-900"
                />
              </div>
            </Field>

            <Field label="Date of Birth">
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => update("dob", e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </Field>

            <Field label="Aadhaar Number">
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={formData.aadhaarNumber}
                onChange={(e) => update("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="XXXX XXXX XXXX"
                className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 tracking-widest"
              />
            </Field>
          </Section>

          {/* SECTION 1: Demographic */}
          <Section
            id="demographic"
            title="Demographic Details"
            icon={<User className="w-5 h-5" />}
            isOpen={openSections.demographic}
            isComplete={demographicComplete}
            onToggle={toggleSection}
          >
            <Field label="Age">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                value={formData.age}
                onChange={(e) => update("age", e.target.value)}
                placeholder="e.g. 42"
                className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </Field>

            <Field label="Gender">
              <ChipGroup
                columns={3}
                value={formData.gender}
                onChange={(v) => update("gender", v)}
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]}
              />
            </Field>

            <Field label="Social Category" helper="Used for SECC-2011 based scheme matching">
              <ChipGroup
                columns={4}
                value={formData.category}
                onChange={(v) => update("category", v)}
                options={[
                  { label: "General", value: "general" },
                  { label: "OBC", value: "obc" },
                  { label: "SC", value: "sc" },
                  { label: "ST", value: "st" },
                  { label: "EWS", value: "ews" },
                ]}
              />
            </Field>

            <Field label="Address">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="House no, street, village"
                className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </Field>

            <Field label="City">
              <input
                type="text"
                value={formData.city}
                onChange={(e) => update("city", e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </Field>

            <Field label="State">
              <select
                value={formData.state}
                onChange={(e) => update("state", e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select state</option>
                <option value="up">Uttar Pradesh</option>
                <option value="bihar">Bihar</option>
                <option value="punjab">Punjab</option>
                <option value="mp">Madhya Pradesh</option>
                <option value="rajasthan">Rajasthan</option>
                <option value="maharashtra">Maharashtra</option>
                {/* add remaining states/UTs */}
              </select>
            </Field>

            <Field label="Marital Status">
              <ChipGroup
                columns={3}
                value={formData.maritalStatus}
                onChange={(v) => update("maritalStatus", v)}
                options={[
                  { label: "Single", value: "single" },
                  { label: "Married", value: "married" },
                  { label: "Widowed", value: "widowed" },
                ]}
              />
            </Field>
          </Section>

          {/* SECTION 2: Financial & Household */}
          <Section
            id="financial"
            title="Financial & Household"
            icon={<Home className="w-5 h-5" />}
            isOpen={openSections.financial}
            isComplete={financialComplete}
            onToggle={toggleSection}
          >
            <Field label="Ration Card Type">
              <ChipGroup
                columns={4}
                value={formData.rationCard}
                onChange={(v) => update("rationCard", v)}
                options={[
                  { label: "None", value: "none" },
                  { label: "BPL", value: "bpl" },
                  { label: "AAY", value: "aay" },
                  { label: "PHH", value: "phh" },
                ]}
              />
            </Field>

            <Field label="Estimated Annual Family Income">
              <ChipGroup
                columns={3}
                value={formData.income}
                onChange={(v) => update("income", v)}
                options={[
                  { label: "Under ₹1L", value: "under_1l" },
                  { label: "₹1L–2.5L", value: "1l_to_2_5l" },
                  { label: "₹2.5L+", value: "above_2_5l" },
                ]}
              />
            </Field>

            <Field label="Housing Type">
              <ChipGroup
                columns={2}
                value={formData.housing}
                onChange={(v) => update("housing", v)}
                options={[
                  { label: "Kutcha (Mud/Thatch)", value: "kutcha" },
                  { label: "Pucca (Brick/Cement)", value: "pucca" },
                ]}
              />
            </Field>

            <Field label="Number of Rooms">
              <Stepper
                value={formData.rooms}
                onChange={(v) => update("rooms", v)}
                min={1}
                max={15}
              />
            </Field>

            <Field label="Family Members / Dependents">
              <Stepper
                value={formData.familyMembers}
                onChange={(v) => update("familyMembers", v)}
                min={1}
                max={25}
              />
            </Field>
          </Section>

          {/* SECTION 3: Occupation & Assets */}
          <Section
            id="occupation"
            title="Occupation & Assets"
            icon={<Briefcase className="w-5 h-5" />}
            isOpen={openSections.occupation}
            isComplete={occupationComplete}
            onToggle={toggleSection}
          >
            <Field label="Primary Occupation">
              <ChipGroup
                columns={2}
                value={formData.occupation}
                onChange={(v) => update("occupation", v)}
                options={[
                  { label: "Farmer", value: "farmer" },
                  { label: "Agri. Laborer", value: "agri_laborer" },
                  { label: "Artisan", value: "artisan" },
                  { label: "Street Vendor", value: "street_vendor" },
                  { label: "Unemployed", value: "unemployed" },
                  { label: "Other", value: "other" },
                ]}
              />
            </Field>
            {formData.occupation === "other" && (
              <Field label="Please specify your occupation">
                <input
                  type="text"
                  value={formData.occupationOther}
                  onChange={(e) => update("occupationOther", e.target.value)}
                  placeholder="e.g. Tailor, Driver, Shopkeeper"
                  className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </Field>
            )}

            <Field label="Do you own agricultural land?">
              <YesNoToggle
                value={formData.landOwned}
                onChange={(v) => update("landOwned", v)}
              />
            </Field>

            {formData.landOwned === true && (
              <Field label="Land Owned (in Acres)">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  value={formData.landAcres}
                  onChange={(e) => update("landAcres", e.target.value)}
                  placeholder="e.g. 2.5"
                  className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </Field>
            )}
          </Section>

          {/* SECTION 4: Health (optional) */}
          <Section
            id="health"
            title="Health & Vulnerabilities"
            icon={<HeartPulse className="w-5 h-5" />}
            isOpen={openSections.health}
            isComplete={healthComplete}
            optional
            onToggle={toggleSection}
          >
            <Field label="Disability Status (Divyangjan)">
              <YesNoToggle
                value={formData.disability}
                onChange={(v) => update("disability", v)}
              />
            </Field>

            <Field label="Chronic illness / pregnant woman in household">
              <YesNoToggle
                value={formData.chronicIllness}
                onChange={(v) => update("chronicIllness", v)}
              />
            </Field>
          </Section>

          {/* SECTION 5: Documents — Aadhaar required, rest gated on Aadhaar */}
          <Section
            id="documents"
            title="Documents"
            icon={<FileText className="w-5 h-5" />}
            isOpen={openSections.documents}
            isComplete={documentsComplete}
            onToggle={toggleSection}
          >
            <p className="text-sm text-gray-500 mb-3">
              Upload your Aadhaar Card first. Other documents unlock once it's verified.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {(Object.keys(DOC_LABELS) as DocType[]).map((docType) => {
                const locked = GATED_DOCS.includes(docType) && !aadhaarDone;
                return (
                  <DocChip
                    key={docType}
                    label={DOC_LABELS[docType]}
                    active={selectedDocs.includes(docType)}
                    done={docStates[docType].status === "done"}
                    locked={locked}
                    onClick={() => toggleDocSelection(docType)}
                  />
                );
              })}
            </div>

            {!aadhaarDone && (
              <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Income Certificate, Ration Card & KCC unlock after Aadhaar is verified
              </p>
            )}

            <div className="flex flex-col gap-3">
              {selectedDocs.map((docType) => (
                <DocumentUploadCard
                  key={docType}
                  docType={docType}
                  state={docStates[docType]}
                  onFileSelected={handleFileSelected}
                  onRetake={handleRetake}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </Section>

          {/* Continue */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canSubmit || isSaving}
            className="mt-1 w-full min-h-[52px] rounded-xl bg-blue-700 text-white font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue to Dashboard"
            )}
          </button>

          {!canSubmit && (
            <p className="text-xs text-center text-gray-400 -mt-2">
              {!aadhaarDone
                ? "Upload & verify your Aadhaar Card to continue"
                : "Fill Demographic, Financial, and Occupation sections to continue"}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}