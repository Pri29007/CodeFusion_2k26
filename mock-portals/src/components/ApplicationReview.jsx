import { accentClasses } from "../lib/accentClasses";

export default function ApplicationReview({ scheme, formData, onEditStep, submitting, onSubmit }) {
  const a = accentClasses[scheme.accent];

  return (
    <div data-testid="application-review" className="mx-auto max-w-2xl">
      <h3 className="font-display text-xl font-semibold text-navy-950">Review Your Application</h3>
      <p className="mt-1 text-sm text-slate-600">Please check every section carefully before final submission. You cannot edit after submitting.</p>

      <div className="mt-6 space-y-5">
        {scheme.steps.map((step, i) => (
          <div key={step.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-navy-900">{step.title}</h4>
              <button
                type="button"
                data-testid={`edit-step-${step.id}`}
                onClick={() => onEditStep(i)}
                className={`text-xs font-semibold ${a.link}`}
              >
                Edit
              </button>
            </div>

            {step.type === "documents" ? (
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {step.fields.map((f) => (
                  <div key={f.id} className="flex justify-between gap-4 text-sm">
                    <dt className="text-slate-500">{f.label}</dt>
                    <dd className="font-medium text-navy-950">{formData[f.id]?.name || "Not uploaded"}</dd>
                  </div>
                ))}
              </dl>
            ) : step.type === "family" ? (
              <div className="text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{step.fields[0].label}</dt>
                  <dd className="font-medium text-navy-950">{formData[step.fields[0].id] || "0"}</dd>
                </div>
                {(formData.familyMembers || []).map((m, idx) => (
                  <p key={idx} className="mt-1 text-xs text-slate-500">
                    {idx + 1}. {m.name || "—"} · {m.age || "—"} yrs · {m.relationship || "—"}
                  </p>
                ))}
              </div>
            ) : (
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {step.fields.map((f) => (
                  <div key={f.id} className="flex justify-between gap-4 text-sm">
                    <dt className="text-slate-500">{f.label}</dt>
                    <dd className="max-w-[60%] truncate text-right font-medium text-navy-950">{formData[f.id] || "—"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ))}
      </div>

      <label className="mt-6 flex items-start gap-2.5 text-sm text-slate-700">
        <input data-testid="declaration-checkbox" type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-slate-400" />
        I declare that the information provided is true to the best of my knowledge.
      </label>

      <button
        data-testid="submit-button"
        type="button"
        disabled={submitting}
        onClick={onSubmit}
        className={`mt-5 w-full rounded-md px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${a.button}`}
      >
        {submitting ? "Submitting Application…" : "Submit Application"}
      </button>
    </div>
  );
}
