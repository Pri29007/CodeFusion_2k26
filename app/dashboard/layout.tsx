"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import {
  LayoutDashboard,
  ListChecks,
  ClipboardList,
  LogOut,
  Menu,
  Volume2,
} from "lucide-react";
import { USER } from "../../lib/mock-data";

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

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/schemes", label: "Eligible Schemes", icon: ListChecks },
  {
    href: "/dashboard/status",
    label: "Current Application Status",
    icon: ClipboardList,
  },
] as const;

// Header title/subtitle per route — add an entry here whenever you add a page.
const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: `Welcome, ${USER.name.split(" ")[0]}`,
    subtitle: "Your profile and uploaded documents",
  },
  "/dashboard/schemes": {
    title: "Eligible Schemes",
    subtitle: "Matched to your profile",
  },
  "/dashboard/status": {
    title: "Current Application Status",
    subtitle: "Track applications you've submitted",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const meta = PAGE_META[pathname] ?? PAGE_META["/dashboard"];

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="px-6 py-6">
        <span className="font-[family-name:var(--font-display)] font-extrabold text-xl text-slate-900 tracking-tight">
          Yojana Mitra
        </span>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={`min-h-[46px] w-full flex items-center gap-3 px-3 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? "bg-blue-900 text-white"
                  : "text-slate-600 active:bg-slate-100"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={2.25} />
              {item.label}
            </Link>
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
                {meta.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">{meta.subtitle}</p>
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
          {children}
        </main>
      </div>
    </div>
  );
}