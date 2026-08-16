"use client";

import { useState } from "react";
import { ShieldCheck, ArrowRight, Loader2, Check, Info } from "lucide-react";
import { SCHEME_VERDICTS, type SchemeVerdict } from "../../../lib/mock-data";

type FillState = "idle" | "filling" | "done";

// Turns "annual_income" -> "Annual income"
function formatFieldName(field: string) {
  const words = field.split("_").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function AutomatableSchemeCard({ scheme }: { scheme: SchemeVerdict }) {
  const [fillState, setFillState] = useState<FillState>("idle");

  function handleAutoFill() {
    if (fillState !== "idle") return;
    setFillState("filling");
    // TODO (backend): trigger the real auto-fill agent here.
    setTimeout(() => setFillState("done"), 1600);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] font-bold text-slate-900 text-base leading-snug">
            {scheme.scheme_name}
          </h3>
          <span className="shrink-0 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1 capitalize">
            {scheme.level}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">{scheme.category}</p>
      </div>

      <div className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">{scheme.reason}</p>
      </div>

      {scheme.missing_info.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {scheme.missing_info.map((field) => (
            <span
              key={field}
              className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5"
            >
              Needs: {formatFieldName(field)}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAutoFill}
        disabled={fillState !== "idle"}
        className={`mt-auto min-h-[46px] w-full rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
          fillState === "done"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-blue-900 text-white active:bg-blue-950 disabled:bg-blue-900/70"
        }`}
      >
        {fillState === "idle" && (
          <>
            Auto-Fill Application
            <ArrowRight className="w-4 h-4" />
          </>
        )}
        {fillState === "filling" && (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Filling application...
          </>
        )}
        {fillState === "done" && (
          <>
            <Check className="w-4 h-4" strokeWidth={2.5} />
            Application Started
          </>
        )}
      </button>
    </div>
  );
}

function RecommendedSchemeCard({ scheme }: { scheme: SchemeVerdict }) {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 opacity-90">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-[family-name:var(--font-display)] font-bold text-slate-700 text-base leading-snug">
          {scheme.scheme_name}
        </h3>
        <span className="shrink-0 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-1 capitalize">
          {scheme.level}
        </span>
      </div>
      <p className="text-sm text-slate-500">{scheme.category}</p>
      <p className="text-xs text-slate-500 leading-relaxed">{scheme.reason}</p>
      <div className="flex flex-wrap gap-1.5">
        {scheme.missing_info.map((field) => (
          <span
            key={field}
            className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5"
          >
            Needs: {formatFieldName(field)}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
        <Info className="w-3.5 h-3.5" />
        Recommended only — auto-fill not yet available
      </div>
    </div>
  );
}

export default function SchemesPage() {
  const automatable = SCHEME_VERDICTS.filter((s) => s.is_automatable);
  const recommended = SCHEME_VERDICTS.filter((s) => !s.is_automatable);

  return (
    <>
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <h2 className="font-[family-name:var(--font-display)] font-bold text-slate-900 text-base sm:text-lg">
            Schemes You Qualify For
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {automatable.map((scheme) => (
            <AutomatableSchemeCard key={scheme.scheme_name} scheme={scheme} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-[family-name:var(--font-display)] font-bold text-slate-700 text-base sm:text-lg">
          Other Schemes to Explore
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recommended.map((scheme) => (
            <RecommendedSchemeCard key={scheme.scheme_name} scheme={scheme} />
          ))}
        </div>
      </section>
    </>
  );
}