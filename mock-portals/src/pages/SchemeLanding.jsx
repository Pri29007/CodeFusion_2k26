import { useParams, useNavigate, Navigate } from "react-router-dom";
import GovHeader from "../components/GovHeader";
import GovFooter from "../components/GovFooter";
import { schemes } from "../data/schemeConfigs";
import { accentClasses } from "../lib/accentClasses";

export default function SchemeLanding() {
  const { schemeId } = useParams();
  const navigate = useNavigate();
  const scheme = schemes[schemeId];
  if (!scheme) return <Navigate to="/" replace />;
  const a = accentClasses[scheme.accent];

  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader scheme={scheme} />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className={`text-sm font-semibold ${a.text}`}>{scheme.name}</p>
              <h1 className="mt-1 font-display text-3xl font-bold text-navy-950 sm:text-4xl">{scheme.tagline}</h1>

              <ul className="mt-6 space-y-3">
                {scheme.heroPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={`mt-0.5 shrink-0 ${a.text}`}>
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  data-testid="apply-now-button"
                  onClick={() => navigate(`/${schemeId}/apply`)}
                  className={`rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors ${a.button}`}
                >
                  Apply Now
                </button>
                <button
                  data-testid="check-status-link"
                  onClick={() => navigate(`/${schemeId}/status`)}
                  className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-navy-900 hover:border-navy-700"
                >
                  Check Application Status
                </button>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="font-display text-sm font-semibold text-navy-950">Eligibility Criteria</h2>
                <ul className="mt-3 space-y-2">
                  {scheme.eligibility.map((e) => (
                    <li key={e} className="flex gap-2 text-sm text-slate-600">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${a.bg600}`} />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="font-display text-sm font-semibold text-navy-950">Documents Required</h2>
                <ul className="mt-3 space-y-2">
                  {scheme.documentsRequired.map((d) => (
                    <li key={d} className="flex gap-2 text-sm text-slate-600">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${a.bg600}`} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`rounded-lg p-5 text-sm ${a.heroBgSoft}`}>
                <p className={`font-semibold ${a.text}`}>No agent or fee required</p>
                <p className="mt-1 text-slate-600">This application is completely free. Report anyone requesting payment for this service.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <GovFooter />
    </div>
  );
}
