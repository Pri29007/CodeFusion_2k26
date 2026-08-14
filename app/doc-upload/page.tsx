"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Poppins, Noto_Sans } from "next/font/google";
import {
  Camera,
  ImageIcon,
  FileCheck2,
  Loader2,
  ScanLine,
  Check,
  RotateCcw,
  Trash2,
  X,
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
 * TYPES
 * ---------------------------------------------------------------------- */
type DocType = "aadhaar" | "income" | "ration" | "kcc";

type DocStatus = "idle" | "uploading" | "scanning" | "done";

type DocState = {
  status: DocStatus;
  fileName: string | null;
  // previewUrl is a local blob URL for the thumbnail — in the real
  // integration you'd likely instead store the uploaded file's remote
  // URL once the backend responds.
  previewUrl: string | null;
};

const DOC_LABELS: Record<DocType, string> = {
  aadhaar: "Aadhaar Card",
  income: "Income Certificate",
  ration: "Ration Card",
  kcc: "Kisan Credit Card",
};

// Which document(s) are mandatory before the user can submit.
// Adjust this to match your actual eligibility-engine requirements.
const REQUIRED_DOCS: DocType[] = ["aadhaar"];

const initialDocState: DocState = {
  status: "idle",
  fileName: null,
  previewUrl: null,
};

/* -------------------------------------------------------------------------
 * SMALL PRESENTATIONAL PIECES
 * ---------------------------------------------------------------------- */

/** Selectable document-type chip. */
function DocChip({
  label,
  active,
  done,
  onClick,
}: {
  label: string;
  active: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[48px] px-4 rounded-full text-sm font-medium border flex items-center gap-1.5 transition-colors ${
        active
          ? "bg-blue-700 border-blue-700 text-white"
          : "bg-white border-gray-300 text-gray-700 active:bg-gray-50"
      }`}
    >
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

/** Status pill shown inside the upload card while processing. */
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

/* -------------------------------------------------------------------------
 * UPLOAD CARD — one per selected document type
 * ---------------------------------------------------------------------- */
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
  // Two separate hidden inputs: one forces the camera (capture="environment"),
  // the other opens the normal gallery/file picker.
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(docType, file);
    // reset the input so selecting the same file again still fires onChange
    e.target.value = "";
  }

  const isProcessing = state.status === "uploading" || state.status === "scanning";
  const isIdle = state.status === "idle";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <p className="text-sm font-semibold text-gray-900 mb-3">
        {DOC_LABELS[docType]}
        {REQUIRED_DOCS.includes(docType) && (
          <span className="ml-1.5 text-xs font-normal text-red-500">Required</span>
        )}
      </p>

      {/* Hidden file inputs */}
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
          {/* Thumbnail */}
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

          {/* Status + filename + actions */}
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
export default function DocumentUploadPage() {
  const router = useRouter();

  const [selectedDocs, setSelectedDocs] = useState<DocType[]>([]);
  const [docStates, setDocStates] = useState<Record<DocType, DocState>>({
    aadhaar: { ...initialDocState },
    income: { ...initialDocState },
    ration: { ...initialDocState },
    kcc: { ...initialDocState },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleDocSelection(docType: DocType) {
    setSelectedDocs((prev) =>
      prev.includes(docType) ? prev.filter((d) => d !== docType) : [...prev, docType]
    );
  }

  function handleFileSelected(docType: DocType, file: File) {
    const previewUrl = URL.createObjectURL(file);

    setDocStates((prev) => ({
      ...prev,
      [docType]: { status: "uploading", fileName: file.name, previewUrl },
    }));

    // -----------------------------------------------------------------
    // TODO (backend): replace this mocked sequence with a real upload.
    //
    // const form = new FormData();
    // form.append("file", file);
    // form.append("docType", docType);
    // const res = await fetch("/api/documents", { method: "POST", body: form });
    // const { extractedFields } = await res.json();
    // -> then set status "done" only once the real response comes back,
    //    and surface extractedFields for the user to confirm/correct.
    // -----------------------------------------------------------------
    setTimeout(() => {
      setDocStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], status: "scanning" },
      }));

      setTimeout(() => {
        setDocStates((prev) => ({
          ...prev,
          [docType]: { ...prev[docType], status: "done" },
        }));
      }, 1400);
    }, 1000);
  }

  function handleRetake(docType: DocType) {
    // Clear current file/preview and drop back to the idle upload buttons.
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
    setSelectedDocs((prev) => prev.filter((d) => d !== docType));
  }

  const requiredDocsDone = REQUIRED_DOCS.every(
    (docType) => docStates[docType].status === "done"
  );

  function handleSubmit() {
    if (!requiredDocsDone) return;
    setIsSubmitting(true);

    // ---------------------------------------------------------------
    // TODO (backend): this is your final "onboarding complete" call,
    // e.g. POST /api/applications/submit, then route to a results/
    // eligibility page once the backend confirms.
    // ---------------------------------------------------------------
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/dashboard");
    }, 1200);
  }

  return (
    <div
      className={`${poppins.variable} ${notoSans.variable} min-h-screen bg-[#F5F6F8] font-[family-name:var(--font-body)]`}
    >
      {/* Header with step indicator */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-sm mx-auto">
          <p className="text-xs font-medium text-blue-700 mb-1">Step 3 of 3</p>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-gray-900">
            Upload your documents
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Add whatever you have handy — Aadhaar is required
          </p>
          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-full bg-blue-700 rounded-full" />
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-5">
        <div className="max-w-sm mx-auto flex flex-col gap-4">
          {/* Document selector chips */}
          <div>
            <p className="text-sm font-medium text-gray-800 mb-2">
              Which documents do you have?
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DOC_LABELS) as DocType[]).map((docType) => (
                <DocChip
                  key={docType}
                  label={DOC_LABELS[docType]}
                  active={selectedDocs.includes(docType)}
                  done={docStates[docType].status === "done"}
                  onClick={() => toggleDocSelection(docType)}
                />
              ))}
            </div>
          </div>

          {/* Upload cards for each selected doc */}
          {selectedDocs.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 px-5 py-8 text-center">
              <p className="text-sm text-gray-400">
                Select a document type above to begin uploading
              </p>
            </div>
          )}

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

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!requiredDocsDone || isSubmitting}
            className="mt-1 w-full min-h-[52px] rounded-xl bg-blue-700 text-white font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </button>

          {!requiredDocsDone && (
            <p className="text-xs text-center text-gray-400 -mt-2 flex items-center justify-center gap-1">
              <X className="w-3.5 h-3.5 text-red-400" />
              Upload Aadhaar Card to continue
            </p>
          )}
        </div>
      </main>
    </div>
  );
}