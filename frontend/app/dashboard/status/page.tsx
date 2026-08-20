"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  FileWarning,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type ApplicationStatusValue =
  | "under_review"
  | "documents_pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "not applied";

type Application = {
  id: string;
  scheme_name: string;
  application_status: ApplicationStatusValue;
  created_at: string;
  updated_at: string;
  form_data?: {
    note?: string;
  } | null;
};

const STATUS_META: Record<
  Exclude<ApplicationStatusValue, "not applied">,
  {
    label: string;
    icon: LucideIcon;
    textColor: string;
    bgColor: string;
  }
> = {
  under_review: {
    label: "Under Review",
    icon: Clock,
    textColor: "text-blue-800",
    bgColor: "bg-blue-50 border-blue-100",
  },

  documents_pending: {
    label: "Documents Pending",
    icon: FileWarning,
    textColor: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-100",
  },

  submitted: {
    label: "Submitted",
    icon: Send,
    textColor: "text-slate-600",
    bgColor: "bg-slate-50 border-slate-200",
  },

  approved: {
    label: "Approved",
    icon: CheckCircle2,
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-100",
  },

  rejected: {
    label: "Rejected",
    icon: XCircle,
    textColor: "text-red-700",
    bgColor: "bg-red-50 border-red-100",
  },
};

function formatDate(dateString: string) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalizeStatus(status: string | null | undefined): ApplicationStatusValue {
  if (!status) return "not applied";

  const normalized = status.toLowerCase().trim();

  switch (normalized) {
    case "under_review":
    case "under review":
      return "under_review";

    case "documents_pending":
    case "documents pending":
      return "documents_pending";

    case "submitted":
      return "submitted";

    case "approved":
      return "approved";

    case "rejected":
      return "rejected";

    case "not applied":
    case "not_applied":
      return "not applied";

    default:
      return "not applied";
  }
}

export default function ApplicationStatusPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const aadhaar = localStorage.getItem("aadhaar_number");

    if (!aadhaar) {
      setLoading(false);
      return;
    }

    async function fetchApplications() {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
            id,
            scheme_name,
            application_status,
            created_at,
            updated_at,
            form_data
          `
        )
        .eq("aadhaar_number", aadhaar)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch application statuses:", error);
        setLoading(false);
        return;
      }

      const mapped: Application[] = (data ?? []).map((row: any) => ({
        id: row.id,
        scheme_name: row.scheme_name,
        application_status: normalizeStatus(row.application_status),
        created_at: row.created_at,
        updated_at: row.updated_at,
        form_data: row.form_data ?? null,
      }));

      // Only show schemes that the user has actually applied for.
      // "not applied" is treated as the default/non-application state.
      const appliedApplications = mapped.filter(
        (application) => application.application_status !== "not applied"
      );

      setApplications(appliedApplications);
      setLoading(false);
    }

    fetchApplications();
  }, []);

  return (
    <section className="flex flex-col gap-4">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading application status...
        </div>
      )}

      {!loading && applications.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-600">
            You have currently not applied for any scheme.
          </p>

          <p className="text-sm text-slate-400 mt-1">
            You can apply for any scheme you are eligible for and view the
            application status here.
          </p>
        </div>
      )}

      {!loading && applications.length > 0 && (
        <>
          {applications.map((app) => {
            if (app.application_status === "not applied") {
              return null;
            }
            const meta = STATUS_META[app.application_status];
            const StatusIcon = meta.icon;

            const note =
              app.form_data && typeof app.form_data.note === "string"
                ? app.form_data.note
                : null;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-slate-900 text-base">
                    {app.scheme_name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    Applied {formatDate(app.created_at)} · Updated{" "}
                    {formatDate(app.updated_at)}
                  </p>

                  {note && (
                    <p className="text-xs text-amber-700 mt-1.5">
                      {note}
                    </p>
                  )}
                </div>

                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border px-3 py-1.5 ${meta.textColor} ${meta.bgColor}`}
                >
                  <StatusIcon
                    className="w-3.5 h-3.5"
                    strokeWidth={2.25}
                  />
                  {meta.label}
                </span>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}