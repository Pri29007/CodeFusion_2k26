export default function FormInput({ field, value, error, onChange }) {
  const baseClasses =
    "w-full rounded-md border px-3.5 py-2.5 text-[15px] text-navy-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors";
  const stateClasses = error
    ? "border-danger-600 focus:ring-danger-600/40"
    : "border-slate-300 focus:border-navy-700 focus:ring-navy-700/25";

  if (field.type === "select") {
    return (
      <FieldShell field={field} error={error}>
        <select
          data-testid={field.testId}
          className={`${baseClasses} ${stateClasses} bg-white`}
          value={value ?? ""}
          onChange={(e) => onChange(field.id, e.target.value)}
        >
          <option value="" disabled>
            Select {field.label.toLowerCase()}
          </option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </FieldShell>
    );
  }

  if (field.type === "textarea") {
    return (
      <FieldShell field={field} error={error}>
        <textarea
          data-testid={field.testId}
          className={`${baseClasses} ${stateClasses} min-h-[88px] resize-y`}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      </FieldShell>
    );
  }

  return (
    <FieldShell field={field} error={error}>
      <input
        data-testid={field.testId}
        type={field.type === "tel" ? "tel" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        className={`${baseClasses} ${stateClasses}`}
        value={value ?? ""}
        placeholder={field.placeholder}
        onChange={(e) => onChange(field.id, e.target.value)}
      />
    </FieldShell>
  );
}

function FieldShell({ field, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-navy-900">
        {field.label}
        {field.required && <span className="ml-0.5 text-danger-600">*</span>}
      </span>
      {children}
      {error && (
        <span data-testid={`${field.testId}-error`} className="mt-1 block text-xs font-medium text-danger-600">
          {error}
        </span>
      )}
    </label>
  );
}
