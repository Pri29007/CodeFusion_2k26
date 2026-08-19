import { useMemo, useState } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import GovHeader from "../components/GovHeader";
import GovFooter from "../components/GovFooter";
import ProgressIndicator from "../components/ProgressIndicator";
import FormInput from "../components/FormInput";
import DocumentUpload from "../components/DocumentUpload";
import FamilyMembers from "../components/FamilyMembers";
import OTPVerification from "../components/OTPVerification";
import CaptchaVerification from "../components/CaptchaVerification";
import ApplicationReview from "../components/ApplicationReview";
import { schemes } from "../data/schemeConfigs";
import { accentClasses } from "../lib/accentClasses";
import { mockApi } from "../lib/mockApi";

// Stage machine, appended after the config-defined steps:
// [ ...configSteps, "verification", "review", "success" ]

export default function SchemeApply() {
  const { schemeId } = useParams();
  const navigate = useNavigate();
  const scheme = schemes[schemeId];
  if (!scheme) return <Navigate to="/" replace />;

  const a = accentClasses[scheme.accent];
  const verificationType = scheme.verificationType || "otp";
  const allStages = useMemo(() => [...scheme.steps, { id: "verification", title: "Verify" }, { id: "review", title: "Review" }], [scheme]);

  const [stageIndex, setStageIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const isFormStage = stageIndex < scheme.steps.length;
  const currentStep = isFormStage ? scheme.steps[stageIndex] : null;

  function updateField(fieldId, value) {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: undefined }));
  }

  function updateFamilyMember(index, key, value) {
    setFormData((prev) => {
      const members = [...(prev.familyMembers || [])];
      members[index] = { ...(members[index] || {}), [key]: value };
      return { ...prev, familyMembers: members };
    });
  }

  function validateStep(step) {
    const stepErrors = {};
    step.fields.forEach((f) => {
      if (f.required !== false) {
        const val = formData[f.id];
        const empty = step.type === "documents" ? !val : val === undefined || val === "" || val === null;
        if (empty) stepErrors[f.id] = "This field is required";
      }
    });
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }

  function handleNext() {
    if (currentStep && !validateStep(currentStep)) return;
    setStageIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setStageIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    setSubmitting(true);
    const record = await mockApi.createApplication(scheme.id, scheme.idPrefix, formData);
    setSubmitting(false);
    setResult(record);
    setStageIndex(allStages.length); // "success" virtual stage
  }

  const stageLabel = "success-page";

  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader scheme={scheme} />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {result ? (
            <SuccessPanel scheme={scheme} result={result} accent={a} />
          ) : (
            <>
              <ProgressIndicator steps={allStages} currentIndex={stageIndex} accent={scheme.accent} />

              <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
                {isFormStage && (
                  <FormStage
                    step={currentStep}
                    formData={formData}
                    errors={errors}
                    onChange={updateField}
                    onFamilyMemberChange={updateFamilyMember}
                  />
                )}

                {allStages[stageIndex]?.id === "verification" && (
                  <div className="py-4">
                    {verificationType === "captcha" ? (
                      <CaptchaVerification accent={scheme.accent} onVerified={() => setVerified(true)} />
                    ) : (
                      <OTPVerification mobile={formData.mobile} accent={scheme.accent} onVerified={() => setVerified(true)} />
                    )}
                  </div>
                )}

                {allStages[stageIndex]?.id === "review" && (
                  <ApplicationReview
                    scheme={scheme}
                    formData={formData}
                    onEditStep={(i) => setStageIndex(i)}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                  />
                )}

                {/* Navigation */}
                {allStages[stageIndex]?.id !== "review" && (
                  <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                    <button
                      type="button"
                      data-testid="back-button"
                      onClick={handleBack}
                      disabled={stageIndex === 0}
                      className="rounded-md px-5 py-2.5 text-sm font-semibold text-navy-900 disabled:opacity-30"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      data-testid="next-button"
                      onClick={handleNext}
                      disabled={allStages[stageIndex]?.id === "verification" && !verified}
                      className={`rounded-md px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${a.button}`}
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <GovFooter />
    </div>
  );
}

function FormStage({ step, formData, errors, onChange, onFamilyMemberChange }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-navy-950">{step.title}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {step.type === "documents"
          ? step.fields.map((f) => (
              <div key={f.id} className="sm:col-span-2">
                <DocumentUpload field={f} value={formData[f.id]} error={errors[f.id]} onChange={onChange} />
              </div>
            ))
          : step.type === "family"
          ? (
              <div className="sm:col-span-2">
                <FamilyMembers
                  field={step.fields[0]}
                  value={formData[step.fields[0].id]}
                  members={formData.familyMembers || []}
                  error={errors[step.fields[0].id]}
                  onCountChange={onChange}
                  onMemberChange={onFamilyMemberChange}
                />
              </div>
            )
          : step.fields.map((f) => (
              <div key={f.id} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <FormInput field={f} value={formData[f.id]} error={errors[f.id]} onChange={onChange} />
              </div>
            ))}
      </div>
    </div>
  );
}

function SuccessPanel({ scheme, result, accent }) {
  return (
    <div data-testid="submission-success" className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${accent.heroBgSoft}`}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className={accent.text}>
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="mt-4 font-display text-xl font-bold text-navy-950">Application Submitted Successfully</h2>
      <p className="mt-1 text-sm text-slate-600">Please save your application ID to track your status.</p>

      <div className="mt-6 rounded-md border border-dashed border-slate-300 bg-navy-50 px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Application ID</p>
        <p data-testid="application-id" className="mt-1 font-display text-2xl font-bold tracking-wide text-navy-950">
          {result.applicationId}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <span className="text-slate-500">Current Status:</span>
        <span data-testid="application-status" className="rounded-full bg-success-100 px-3 py-1 font-semibold text-success-700">
          {result.status}
        </span>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          to={`/${scheme.id}/status`}
          data-testid="go-to-status-page"
          className={`rounded-md px-5 py-2.5 text-sm font-semibold text-white ${accent.button}`}
        >
          Track This Application
        </Link>
        <Link to="/" className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-navy-900">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
