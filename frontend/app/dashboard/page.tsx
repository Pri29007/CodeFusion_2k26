"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  CheckCircle2,
  Loader2,
  Plus,
  UploadCloud,
} from "lucide-react";
import {
  DOCUMENT_TYPE_LABELS,
  type DocumentTypeId,
} from "../../lib/mock-data";

type DocEntry = {
  key: DocumentTypeId;
  label: string;
  fileName: string;
  uploadedAt: string;
  verified: boolean;
  status: "uploading" | "done";
};

// Shape of the real user object your backend returns from GET /users/{aadhaar_number}
type BackendUser = {
  aadhaar_number: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string | null;
  phone_number: string | null;
  city: string | null;
  state: string | null;
  occupation: string | null;
  category: string | null;
  annual_income_range: string | null;
  family_members_dependents: number | null;
  aadhaar_doc_url: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

// Shape of each row from GET /documents/user/{user_id}
type BackendDocument = {
  id: string;
  doc_type: string;
  file_url: string;
  file_type: string;
  created_at: string;
};

function capitalize(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(isoString: string | null): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocEntry[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const pendingTypeRef = useRef<DocumentTypeId | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const aadhaarNumber =
    typeof window !== "undefined"
      ? localStorage.getItem("aadhaar_number")
      : null;

  // Fetch the user profile
  useEffect(() => {
    if (!aadhaarNumber) {
      setError("No signed-up user found. Please complete signup first.");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/users/${aadhaarNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data: BackendUser) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        setError("Could not load your profile. Please try again.");
        setLoading(false);
      });
  }, [aadhaarNumber]);

  // Fetch documents once we have the user (need aadhaar_doc_url from user + rows from /documents/user/{id})
  useEffect(() => {
    if (!user || !aadhaarNumber) return;

    const entries: DocEntry[] = [];

    // Aadhaar comes from the user record itself, not the documents table
    if (user.aadhaar_doc_url) {
      entries.push({
        key: "aadhaar",
        label: DOCUMENT_TYPE_LABELS.aadhaar,
        fileName: user.aadhaar_doc_url.split("/").pop() || "aadhaar_doc",
        uploadedAt: formatDate(user.created_at),
        verified: true,
        status: "done",
      });
    }

    fetch(`http://localhost:8000/documents/user/${aadhaarNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch documents");
        return res.json();
      })
      .then((docs: BackendDocument[]) => {
        const docEntries: DocEntry[] = docs.map((doc) => ({
          key: doc.doc_type as DocumentTypeId,
          label:
            DOCUMENT_TYPE_LABELS[doc.doc_type as DocumentTypeId] ||
            doc.doc_type,
          fileName: doc.file_url.split("/").pop() || "document",
          uploadedAt: formatDate(doc.created_at),
          verified: true,
          status: "done",
        }));
        setDocuments([...entries, ...docEntries]);
      })
      .catch((err) => {
        console.error("Error fetching documents:", err);
        // Still show at least the Aadhaar doc even if this call fails
        setDocuments(entries);
      });
  }, [user, aadhaarNumber]);

  const uploadedKeys = documents.map((doc) => doc.key);
  const remainingTypes = (
    Object.keys(DOCUMENT_TYPE_LABELS) as DocumentTypeId[]
  ).filter((type) => !uploadedKeys.includes(type));

  function openPickerFor(type: DocumentTypeId) {
    pendingTypeRef.current = type;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const type = pendingTypeRef.current;
    e.target.value = "";
    if (!file || !type || !aadhaarNumber) return;

    const newDoc: DocEntry = {
      key: type,
      label: DOCUMENT_TYPE_LABELS[type],
      fileName: file.name,
      uploadedAt: "Just now",
      verified: false,
      status: "uploading",
    };
    setDocuments((prev) => [...prev, newDoc]);
    setAddOpen(false);

    const form = new FormData();
    form.append("user_id", aadhaarNumber);
    form.append("doc_type", type);
    form.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/documents/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error("Upload failed:", errorData);
        setDocuments((prev) => prev.filter((doc) => doc.key !== type));
        return;
      }

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.key === type ? { ...doc, verified: true, status: "done" } : doc
        )
      );
    } catch (err) {
      console.error("Network error uploading document:", err);
      setDocuments((prev) => prev.filter((doc) => doc.key !== type));
    }
  }

  const userDetails = user
    ? [
        { label: "Age", value: user.age ? `${user.age} yrs` : "—" },
        {
          label: "Gender",
          value: user.gender ? capitalize(user.gender) : "—",
        },
        { label: "Phone Number", value: user.phone_number || "—" },
        {
          label: "Location",
          value:
            [user.city, user.state]
              .filter((v): v is string => Boolean(v))
              .map(capitalize)
              .join(", ") || "—",
        },
        {
          label: "Occupation",
          value: user.occupation ? capitalize(user.occupation) : "—",
        },
        {
          label: "Category",
          value: user.category ? capitalize(user.category) : "—",
        },
        {
          label: "Annual Income",
          value: user.annual_income_range
            ? user.annual_income_range
                .replace(/_/g, " ")
                .replace(/l\b/gi, "L")
                .replace(/^./, (c) => c.toUpperCase())
            : "—",
        },
        {
          label: "Family Members",
          value:
            user.family_members_dependents != null
              ? String(user.family_members_dependents)
              : "—",
        },
      ]
    : [];

  const fullName = user ? `${user.first_name} ${user.last_name}` : "";

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your profile...
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-[family-name:var(--font-display)] font-bold text-lg shrink-0">
                {fullName
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </div>
              <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-slate-900">
                {fullName}
              </h2>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
              {userDetails.map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Documents uploaded during onboarding (personal-info page) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Documents Uploaded
        </p>

        <div className="flex flex-col divide-y divide-slate-100">
          {documents.map((doc) => (
            <div
              key={doc.key}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {doc.label}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {doc.fileName} · {doc.uploadedAt}
                  </p>
                </div>
              </div>

              {doc.status === "uploading" ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 shrink-0 ml-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </span>
              ) : doc.verified ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0 ml-3">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                  Verified
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {remainingTypes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {!addOpen ? (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-900 min-h-[40px]"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Upload More Documents
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Choose a document to add
                </p>
                <div className="flex flex-wrap gap-2">
                  {remainingTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => openPickerFor(type)}
                      className="flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium active:bg-slate-50 transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {DOCUMENT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}