export default function DocumentUpload({ field, value, error, onChange }) {
  const fileName = value?.name;

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-navy-900">
        {field.label}
        <span className="ml-0.5 text-danger-600">*</span>
      </span>
      <label
        className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border-2 border-dashed px-4 py-3 text-sm transition-colors ${
          error ? "border-danger-600 bg-danger-100/40" : "border-slate-300 bg-white hover:border-navy-700 hover:bg-navy-50"
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-navy-700">
            <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={`truncate ${fileName ? "text-navy-950 font-medium" : "text-slate-500"}`}>
            {fileName || "Click to upload (JPG, PNG or PDF)"}
          </span>
        </span>
        <span className="shrink-0 rounded border border-navy-700 px-2.5 py-1 text-xs font-semibold text-navy-700">
          Browse
        </span>
        <input
          data-testid={field.testId}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(e) => onChange(field.id, e.target.files?.[0] ? { name: e.target.files[0].name } : null)}
        />
      </label>
      {error && (
        <span data-testid={`${field.testId}-error`} className="mt-1 block text-xs font-medium text-danger-600">
          {error}
        </span>
      )}
    </div>
  );
}
