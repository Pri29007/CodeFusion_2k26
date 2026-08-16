import { useEffect, useRef } from "react";
import { accentClasses } from "../lib/accentClasses";

export default function ProgressIndicator({ steps, currentIndex, accent }) {
  const a = accentClasses[accent];
  const activeRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  return (
    <div
      ref={containerRef}
      data-testid="progress-indicator"
      className="w-full overflow-x-auto pb-1"
    >
      <ol className="flex min-w-max items-start gap-0">
        {steps.map((step, i) => {
          const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
          return (
            <li key={step.id} className="flex items-start">
              <div
                ref={state === "current" ? activeRef : null}
                className="flex flex-col items-center gap-1.5 px-0.5"
              >
                <div
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    state === "done" && a.stepDone,
                    state === "current" && a.stepCurrent,
                    state === "upcoming" && "border-slate-300 bg-white text-slate-400",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {state === "done" ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`w-14 text-center text-[10px] font-medium leading-tight ${state === "upcoming" ? "text-slate-400" : "text-navy-900"}`}>
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mt-3.5 h-0.5 w-5 shrink-0 sm:w-8 ${i < currentIndex ? a.connectorDone : "bg-slate-300"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
