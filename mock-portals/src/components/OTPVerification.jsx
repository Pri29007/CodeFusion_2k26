import { useState } from "react";
import { mockApi } from "../lib/mockApi";
import { accentClasses } from "../lib/accentClasses";

export default function OTPVerification({ mobile, accent, onVerified }) {
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking | error | success
  const a = accentClasses[accent];

  async function handleVerify() {
    setStatus("checking");
    const ok = await mockApi.verifyOtp(otp.trim());
    if (ok) {
      setStatus("success");
      onVerified();
    } else {
      setStatus("error");
    }
  }

  return (
    <div data-testid="otp-verification" className="mx-auto max-w-md">
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${a.heroBgSoft}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={a.text}>
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="1.7" />
            <path d="M19 11a7 7 0 0 1-14 0M12 18v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-semibold text-navy-950">Mobile Number Verification</h3>
        <p className="mt-1.5 text-sm text-slate-600">
          An OTP has been sent to your registered mobile number
          {mobile ? <span className="font-medium text-navy-900"> ending in {String(mobile).slice(-4)}</span> : null}.
        </p>

        <div className="mt-5 text-left">
          <label className="mb-1.5 block text-sm font-medium text-navy-900">Enter OTP</label>
          <input
            data-testid="otp-input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ""));
              if (status !== "idle") setStatus("idle");
            }}
            className={`w-full rounded-md border px-3.5 py-2.5 text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 ${
              status === "error" ? "border-danger-600 focus:ring-danger-600/40" : "border-slate-300 focus:border-navy-700 focus:ring-navy-700/25"
            }`}
          />
          {status === "error" && (
            <p data-testid="otp-error" className="mt-1.5 text-xs font-medium text-danger-600">
              Incorrect OTP. Please try again.
            </p>
          )}
          {status === "success" && (
            <p className="mt-1.5 text-xs font-medium text-success-700">Verified successfully.</p>
          )}
        </div>

        <button
          data-testid="verify-otp-button"
          type="button"
          disabled={otp.length !== 6 || status === "checking"}
          onClick={handleVerify}
          className={`mt-5 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${a.button}`}
        >
          {status === "checking" ? "Verifying…" : "Verify OTP"}
        </button>

        <button type="button" className="mt-3 text-xs font-medium text-slate-500 hover:text-navy-800">
          Resend OTP
        </button>
      </div>
    </div>
  );
}
