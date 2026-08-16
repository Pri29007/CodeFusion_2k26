import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import GovHeader from "../components/GovHeader";
import GovFooter from "../components/GovFooter";
import { schemes } from "../data/schemeConfigs";
import { accentClasses } from "../lib/accentClasses";
import { mockApi } from "../lib/mockApi";

const STATUS_STYLES = {
  Submitted: "bg-navy-100 text-navy-800",
  Processing: "bg-saffron-100 text-saffron-600",
  "Under Verification": "bg-saffron-100 text-saffron-600",
  Approved: "bg-success-100 text-success-700",
  Rejected: "bg-danger-100 text-danger-600",
};

export default function SchemeStatus() {
  const { schemeId } = useParams();
  const scheme = schemes[schemeId];
  if (!scheme) return <Navigate to="/" replace />;
  const a = accentClasses[scheme.accent];

  const [idInput, setIdInput] = useState("");
  const [record, setRecord] = useState(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCheck() {
    setLoading(true);
    const found = await mockApi.getApplication(idInput);
    setRecord(found);
    setChecked(true);
    setLoading(false);
  }

  async function handleAdvance() {
    const updated = await mockApi.advanceStatus(record.applicationId);
    setRecord(updated);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader scheme={scheme} />

      <main className="flex-1">
        <div className="mx-auto max-w-xl px-4 py-10">
          <h1 className="font-display text-2xl font-bold text-navy-950">Check Application Status</h1>
          <p className="mt-1 text-sm text-slate-600">Enter the application ID you received after submission.</p>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <label className="mb-1.5 block text-sm font-medium text-navy-900">Application ID</label>
            <div className="flex gap-2">
              <input
                data-testid="status-application-id-input"
                type="text"
                placeholder={`e.g. ${scheme.idPrefix}-2026-00123`}
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-navy-700/25 focus:border-navy-700"
              />
              <button
                data-testid="check-status-button"
                onClick={handleCheck}
                disabled={!idInput || loading}
                className={`shrink-0 rounded-md px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${a.button}`}
              >
                {loading ? "Checking…" : "Check Status"}
              </button>
            </div>

            {checked && !record && (
              <p data-testid="status-not-found" className="mt-4 text-sm font-medium text-danger-600">
                No application found with this ID. Double-check and try again.
              </p>
            )}

            {record && (
              <div className="mt-6 rounded-md border border-slate-200 bg-navy-50 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">Application ID: {record.applicationId}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-slate-600">Current Status:</span>
                  <span
                    data-testid="application-status"
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[record.status] || "bg-slate-100 text-slate-700"}`}
                  >
                    {record.status}
                  </span>
                </div>

                <ol className="mt-4 space-y-1.5 border-l-2 border-slate-200 pl-4">
                  {record.statusHistory.map((h, i) => (
                    <li key={i} className="text-xs text-slate-500">
                      <span className="font-medium text-navy-800">{h.status}</span> —{" "}
                      {new Date(h.at).toLocaleString()}
                    </li>
                  ))}
                </ol>

                {record.status !== "Approved" && record.status !== "Rejected" && (
                  <button
                    data-testid="demo-advance-status-button"
                    onClick={handleAdvance}
                    className="mt-4 w-full rounded-md border border-dashed border-slate-400 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-navy-700 hover:text-navy-800"
                  >
                    (Demo control) Advance to next status →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <GovFooter />
    </div>
  );
}
