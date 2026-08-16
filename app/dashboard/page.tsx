"use client";

import { useRef, useState } from "react";
import {
  FileText,
  CheckCircle2,
  Loader2,
  Plus,
  UploadCloud,
} from "lucide-react";
import {
  USER,
  UPLOADED_DOCUMENTS,
  DOCUMENT_TYPE_LABELS,
  type DocumentTypeId,
  type UploadedDoc,
} from "../../lib/mock-data";

// Local-only status flag layered on top of UploadedDoc — resets on refresh
// since there's no backend yet. Once wired to a real API, "uploading" just
// means "waiting on the response".
type DocEntry = UploadedDoc & { status: "uploading" | "done" };

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocEntry[]>(
    UPLOADED_DOCUMENTS.map((doc) => ({ ...doc, status: "done" }))
  );
  const [addOpen, setAddOpen] = useState(false);
  const pendingTypeRef = useRef<DocumentTypeId | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadedKeys = documents.map((doc) => doc.key);
  const remainingTypes = (
    Object.keys(DOCUMENT_TYPE_LABELS) as DocumentTypeId[]
  ).filter((type) => !uploadedKeys.includes(type));

  function openPickerFor(type: DocumentTypeId) {
    pendingTypeRef.current = type;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const type = pendingTypeRef.current;
    e.target.value = "";
    if (!file || !type) return;

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

    // TODO (backend): replace with a real upload + verification call, e.g.
    // const form = new FormData();
    // form.append("file", file);
    // form.append("docType", type);
    // await fetch("/api/documents", { method: "POST", body: form });
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.key === type ? { ...doc, verified: true, status: "done" } : doc
        )
      );
    }, 1400);
  }

  return (
    <>
      {/* Hidden file input shared by every "Upload" trigger below */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* User info — every field captured during login / demographic form */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-[family-name:var(--font-display)] font-bold text-lg shrink-0">
            {USER.name
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")}
          </div>
          <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-slate-900">
            {USER.name}
          </h2>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
          {USER.details.map((item) => (
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
                  Verifying...
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

        {/* Upload more documents */}
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