"use client";

import { useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import {
  LayoutDashboard,
  ListChecks,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Volume2,
  CheckCircle2,
  Circle,
  MapPin,
  Briefcase,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

/* -------------------------------------------------------------------------
 * MOCK DATA — replace with real session / API data later
 * ---------------------------------------------------------------------- */

const USER = {
  name: "Ramesh Kumar Yadav",
  age: 42,
  location: "Bulandshahr, Uttar Pradesh",
  occupation: "Farmer (Small Landholder)",
  documents: [
    { label: "Aadhaar Card", value: "•••• •••• 8341", verified: true },
    { label: "Income Certificate", value: "Verified", verified: true },
    { label: "Ration Card", value: "Verified", verified: true },
    { label: "Kisan Credit Card", value: "Not uploaded", verified: false },
  ],
};

type EligibleScheme = {
  id: string;
  name: string;
  tagline: string;
  reason: string;
  amount?: string;
};

const ELIGIBLE_SCHEMES: EligibleScheme[] = [
  {
    id: "pm-kisan",
    name: "PM-Kisan Samman Nidhi",
    tagline: "₹6,000/year direct income support",
    reason: "Matched: landholding farmer, income within limit",
    amount: "₹6,000 / year",
  },
  {
    id: "pmay-g",
    name: "PMAY - Gramin",
    tagline: "Financial aid to build a pucca house",
    reason: "Matched: rural residence, kutcha house on record",
    amount: "Up to ₹1,30,000",
  },
  {
    id: "pmfby",
    name: "PM Fasal Bima Yojana",
    tagline: "Crop insurance against natural loss",
    reason: "Matched: registered farmer with active land record",
  },
];

type OtherScheme = {
  id: string;
  name: string;
  tagline: string;
  missing: string;
};

const OTHER_SCHEMES: OtherScheme[] = [
  {
    id: "pm-vishwakarma",
    name: "PM Vishwakarma",
    tagline: "Support for traditional artisans & craftspeople",
    missing: "Requires: Artisan Trade Confirmation",
  },
  {
    id: "nsap",
    name: "National Social Assistance Programme",
    tagline: "Pension support for eligible households",
    missing: "Requires: Age proof above 60 years",
  },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "schemes", label: "Eligible Schemes", icon: ListChecks },
  { id: "status", label: "Current Application Status", icon: ClipboardList },
] as const;

type NavId = (typeof NAV_ITEMS)[number]["id"];
type FillState = "idle" | "filling" | "done";

/* -------------------------------------------------------------------------
 * SMALL PIECES
 * ---------------------------------------------------------------------- */

function DocumentRow({
  label,
  value,
  verified,
}: {
  label: string;
  value: string;
  verified: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span
        className={`flex items-center gap-1.5 text-sm font-medium font-[family-name:var(--font-body)] tabular-nums ${
          verified ? "text-slate-800" : "text-slate-400"
        }`}
      >
        {value}
        {verified ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
        ) : (
          <Circle className="w-4 h-4 text-slate-300 shrink-0" />
        )}
      </span>
    </div>
  );
}

function EligibleSchemeCard({ scheme }: { scheme: EligibleScheme }) {
  const [fillState, setFillState] = useState<FillState>("idle");

  function handleAutoFill() {
    if (fillState !== "idle") return;
    setFillState("filling");
    // TODO (backend): replace with real auto-fill agent trigger.
    setTimeout(() => setFillState("done"), 1600);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] font-bold text-slate-900 text-base leading-snug">
            {scheme.name}
          </h3>
          {scheme.amount && (
            <span className="shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
              {scheme.amount}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">{scheme.tagline}</p>
      </div>

      <div className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">{scheme.reason}</p>
      </div>

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

function OtherSchemeCard({
  scheme,
  onProvideDetails,
}: {
  scheme: OtherScheme;
  onProvideDetails: (scheme: OtherScheme) => void;
}) {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 opacity-90">
      <div>
        <h3 className="font-[family-name:var(--font-display)] font-bold text-slate-700 text-base leading-snug">
          {scheme.name}
        </h3>
        <p className="text-sm text-slate-500 mt-1">{scheme.tagline}</p>
      </div>
      <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        {scheme.missing}
      </p>
      <button
        type="button"
        onClick={() => onProvideDetails(scheme)}
        className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm active:bg-slate-100 transition-colors"
      >
        Provide Details
      </button>
    </div>
  );
}

function ProvideDetailsModal({
  scheme,
  onClose,
}: {
  scheme: OtherScheme;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-slate-900">
            {scheme.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 active:text-slate-600 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-2">{scheme.missing}</p>
        <p className="text-sm text-slate-600 mt-4">
          Provide the missing information to check your eligibility for this
          scheme.
        </p>
        {/* TODO (backend): replace with real form fields per scheme requirement */}
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
          Form fields go here
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 min-h-[48px] w-full rounded-xl bg-blue-900 text-white font-semibold text-sm active:bg-blue-950 transition-colors"
        >
          Save & Check Eligibility
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * PAGE
 * ---------------------------------------------------------------------- */

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState<NavId>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [detailsScheme, setDetailsScheme] = useState<OtherScheme | null>(null);

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="px-6 py-6">
        <span className="font-[family-name:var(--font-display)] font-extrabold text-xl text-slate-900 tracking-tight">
          Dashboard
        </span>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveNav(item.id);
                setMobileNavOpen(false);
              }}
              className={`min-h-[46px] w-full flex items-center gap-3 px-3 rounded-xl text-sm font-semibold text-left transition-colors ${
                active
                  ? "bg-blue-900 text-white"
                  : "text-slate-600 active:bg-slate-100"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={2.25} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <button
          type="button"
          className="min-h-[46px] w-full flex items-center gap-3 px-3 rounded-xl text-sm font-semibold text-slate-500 active:bg-slate-100 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={2.25} />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-slate-50 font-[family-name:var(--font-body)]`}
    >
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white border-r border-slate-200">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-50 w-64 bg-white h-full shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden text-slate-600 -ml-1 p-1"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-[family-name:var(--font-display)] font-extrabold text-lg sm:text-xl text-slate-900">
                Welcome, {USER.name.split(" ")[0]}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Here is your eligibility overview
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-blue-900 text-white text-sm font-semibold active:bg-blue-950 transition-colors shrink-0"
          >
            <Volume2 className="w-4 h-4" strokeWidth={2.25} />
            <span className="hidden sm:inline">Listen</span>
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 flex flex-col gap-6 max-w-5xl w-full mx-auto">
          {/* Section A — User Information */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-[family-name:var(--font-display)] font-bold text-lg shrink-0">
                  {USER.name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-slate-900">
                    {USER.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {USER.age} yrs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {USER.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> {USER.occupation}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Document Status
              </p>
              <div>
                {USER.documents.map((doc) => (
                  <DocumentRow key={doc.label} {...doc} />
                ))}
              </div>
            </div>
          </section>

          {/* Section B — Scheme Matcher */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <h2 className="font-[family-name:var(--font-display)] font-bold text-slate-900 text-base sm:text-lg">
                Schemes You Qualify For
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ELIGIBLE_SCHEMES.map((scheme) => (
                <EligibleSchemeCard key={scheme.id} scheme={scheme} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-[family-name:var(--font-display)] font-bold text-slate-700 text-base sm:text-lg">
              Other Schemes to Explore
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {OTHER_SCHEMES.map((scheme) => (
                <OtherSchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  onProvideDetails={setDetailsScheme}
                />
              ))}
            </div>
          </section>
        </main>
      </div>

      {detailsScheme && (
        <ProvideDetailsModal
          scheme={detailsScheme}
          onClose={() => setDetailsScheme(null)}
        />
      )}
    </div>
  );
}