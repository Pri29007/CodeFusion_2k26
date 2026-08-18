import { Link } from "react-router-dom";
import { accentClasses } from "../lib/accentClasses";

export default function GovHeader({ scheme }) {
  const a = scheme ? accentClasses[scheme.accent] : null;

  return (
    <header>
      {/* Top utility strip — the bilingual govt-site convention */}
      <div className="bg-navy-950 text-navy-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-[11px] sm:text-xs">
          <span>Government of India | भारत सरकार</span>
          <span className="hidden gap-4 sm:flex">
            <span className="opacity-80">Skip to Main Content</span>
            <span className="opacity-80">Screen Reader Access</span>
            <span className="opacity-80">अंग्रेज़ी | हिंदी</span>
          </span>
        </div>
      </div>

      {/* Main brand bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <Emblem />
            <div className="leading-tight">
              <p className="font-display text-sm font-bold text-navy-950 sm:text-base">
                National Scheme Services Portal
              </p>
              <p className="text-[11px] text-slate-500 sm:text-xs">Demo environment · for hackathon simulation only</p>
            </div>
          </Link>
          {scheme && (
            <div className={`hidden shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold sm:block ${a.chip}`}>
              {scheme.name}
            </div>
          )}
        </div>
      </div>

      {scheme && (
        <div className={`${a.heroBg} text-white`}>
          <div className="mx-auto max-w-6xl px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">{scheme.ministry}</p>
            <p className="font-display text-lg font-semibold">{scheme.fullName}</p>
          </div>
        </div>
      )}
    </header>
  );
}

function Emblem() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="19" stroke="#0B2A47" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="14" fill="#0F3A62" />
      <path d="M20 10v20M12 14l16 12M28 14 12 26" stroke="#E08A1E" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="20" cy="20" r="3.2" fill="#F7F8FA" />
    </svg>
  );
}
