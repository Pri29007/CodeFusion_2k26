import {
  Clock,
  FileWarning,
  Send,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { APPLICATIONS, type ApplicationStatusValue } from "../../../lib/mock-data";

const STATUS_META: Record<
  ApplicationStatusValue,
  { label: string; icon: LucideIcon; textColor: string; bgColor: string }
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

export default function ApplicationStatusPage() {
  return (
    <section className="flex flex-col gap-4">
      {APPLICATIONS.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
          <p className="text-sm text-slate-400">
            You haven&apos;t applied to any schemes yet.
          </p>
        </div>
      )}

      {APPLICATIONS.map((app) => {
        const meta = STATUS_META[app.status];
        const StatusIcon = meta.icon;
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
                Applied {app.applied_on} · Updated {app.last_updated}
              </p>
              {app.note && (
                <p className="text-xs text-amber-700 mt-1.5">{app.note}</p>
              )}
            </div>

            <span
              className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border px-3 py-1.5 ${meta.textColor} ${meta.bgColor}`}
            >
              <StatusIcon className="w-3.5 h-3.5" strokeWidth={2.25} />
              {meta.label}
            </span>
          </div>
        );
      })}
    </section>
  );
}