import { Link } from "react-router-dom";
import GovHeader from "../components/GovHeader";
import GovFooter from "../components/GovFooter";
import { schemeList } from "../data/schemeConfigs";
import { accentClasses } from "../lib/accentClasses";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-sm font-semibold text-saffron-600">Demo Environment</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-navy-950 sm:text-4xl">
            Mock Government Scheme Portals
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Three simulated scheme-application websites built for the YojanaMitra hackathon prototype. These are
            automation targets for the LangGraph + Playwright agent — not real government services.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {schemeList.map((scheme) => {
              const a = accentClasses[scheme.accent];
              return (
                <div key={scheme.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
                  <div className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${a.chip}`}>
                    {scheme.name}
                  </div>
                  <h2 className="mt-3 font-display text-lg font-semibold text-navy-950">{scheme.fullName}</h2>
                  <p className="mt-2 flex-1 text-sm text-slate-600">{scheme.tagline}</p>
                  <div className="mt-5 flex gap-2">
                    <Link
                      to={`/${scheme.id}`}
                      data-testid={`portal-link-${scheme.id}`}
                      className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold text-white ${a.button}`}
                    >
                      Visit Portal
                    </Link>
                    <Link
                      to={`/${scheme.id}/status`}
                      className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-navy-900"
                    >
                      Status
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <GovFooter />
    </div>
  );
}
