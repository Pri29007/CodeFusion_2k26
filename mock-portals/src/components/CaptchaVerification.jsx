import { useState } from "react";
import { accentClasses } from "../lib/accentClasses";

const CHARS = "ACDEFGHJKLMNPQRTUVWXY347MVN"; // no ambiguous 0/O/1/I

function generateChallenge() {
  let out = "";
  for (let i = 0; i < 6; i++) out += CHARS[Math.floor(Math.random() * CHARS.length)];
  return out;
}

export default function CaptchaVerification({ accent, onVerified }) {
  const [challenge, setChallenge] = useState(generateChallenge);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | error | success
  const a = accentClasses[accent];

  function handleRefresh() {
    setChallenge(generateChallenge());
    setInput("");
    setStatus("idle");
  }

  function handleVerify() {
    if (input.trim().toUpperCase() === challenge) {
      setStatus("success");
      onVerified();
    } else {
      setStatus("error");
    }
  }

  return (
    <div data-testid="captcha-verification" data-captcha-answer={challenge} className="mx-auto max-w-md">
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${a.heroBgSoft}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={a.text}>
            <path d="M9 12.5 11 15l4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6L12 3Z" stroke="currentColor" strokeWidth="1.7" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-semibold text-navy-950">Human Verification Required</h3>
        <p className="mt-1.5 text-sm text-slate-600">Enter the characters shown below to continue.</p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <div
            data-testid="captcha-challenge"
            className="select-none rounded-md border border-slate-300 bg-navy-50 px-6 py-3 font-display text-2xl font-bold tracking-[0.4em] text-navy-900"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(11,42,71,0.05) 0 2px, transparent 2px 8px)" }}
          >
            {challenge.split("").map((ch, i) => (
              <span key={i} style={{ display: "inline-block", transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (6 + i)}deg)` }}>
                {ch}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh captcha"
            className="rounded-md border border-slate-300 p-2 text-slate-500 hover:border-navy-700 hover:text-navy-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 4v5h5M20 20v-5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.5 15a7.5 7.5 0 0 0 13-3M18.5 9a7.5 7.5 0 0 0-13 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="mt-5 text-left">
          <label className="mb-1.5 block text-sm font-medium text-navy-900">Enter the code above</label>
          <input
            data-testid="captcha-input"
            type="text"
            maxLength={6}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            className={`w-full rounded-md border px-3.5 py-2.5 text-center text-lg uppercase tracking-[0.4em] focus:outline-none focus:ring-2 ${
              status === "error" ? "border-danger-600 focus:ring-danger-600/40" : "border-slate-300 focus:border-navy-700 focus:ring-navy-700/25"
            }`}
          />
          {status === "error" && (
            <p data-testid="captcha-error" className="mt-1.5 text-xs font-medium text-danger-600">
              Characters did not match. Please try again.
            </p>
          )}
        </div>

        <button
          data-testid="verify-captcha-button"
          type="button"
          disabled={!input}
          onClick={handleVerify}
          className={`mt-5 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${a.button}`}
        >
          Verify & Continue
        </button>
      </div>
    </div>
  );
}
