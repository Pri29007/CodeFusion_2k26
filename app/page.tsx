"use client";

import { useMemo, useRef, useState } from "react";
import { Poppins, Noto_Sans } from "next/font/google";
import { Mic, Phone, ShieldCheck, ChevronDown, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Fonts
 * - Poppins: display/heading face — clean geometric shapes, reads confidently at small
 *   sizes on low-end screens, and is a face most users already associate with serious
 *   consumer apps (PhonePe, Paytm, etc.) rather than a "corporate" template feel.
 * - Noto Sans: body/UI face — chosen specifically because Noto Sans also ships a
 *   Devanagari companion (Noto Sans Devanagari), so English and Hindi text sit at the
 *   same visual weight instead of Hindi looking like an afterthought font swap.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

type Lang = "en" | "hi";
type Step = "phone" | "otp";

const COPY: Record<Lang, {
  title: string;
  tagline: string;
  phoneLabel: string;
  phonePlaceholder: string;
  micHint: string;
  getOtp: string;
  otpLabel: (phone: string) => string;
  changeNumber: string;
  verify: string;
  resend: string;
  resendIn: (s: number) => string;
  trust: string;
  helpline: string;
}> = {
  en: {
    title: "Yojana Mitra",
    tagline: "Government schemes, made simple",
    phoneLabel: "Mobile number",
    phonePlaceholder: "98765 43210",
    micHint: "Tap to speak your number",
    getOtp: "Get OTP",
    otpLabel: (phone) => `Enter the 4-digit code sent to +91 ${phone}`,
    changeNumber: "Change number",
    verify: "Verify & Continue",
    resend: "Resend OTP",
    resendIn: (s) => `Resend OTP in ${s}s`,
    trust: "Your data is encrypted and never shared without consent",
    helpline: "Need help? Call 1800-11-0000 (toll-free)",
  },
  hi: {
    title: "योजना मित्र",
    tagline: "सरकारी योजनाएं, अब आसान भाषा में",
    phoneLabel: "मोबाइल नंबर",
    phonePlaceholder: "98765 43210",
    micHint: "बोलकर नंबर दर्ज करें",
    getOtp: "OTP प्राप्त करें",
    otpLabel: (phone) => `+91 ${phone} पर भेजा गया 4 अंकों का कोड डालें`,
    changeNumber: "नंबर बदलें",
    verify: "सत्यापित करें और आगे बढ़ें",
    resend: "OTP दोबारा भेजें",
    resendIn: (s) => `${s} सेकंड में दोबारा भेजें`,
    trust: "आपका डेटा सुरक्षित है और सहमति के बिना साझा नहीं किया जाता",
    helpline: "सहायता चाहिए? 1800-11-0000 पर कॉल करें (टोल-फ्री)",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [langOpen, setLangOpen] = useState(false);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const t = COPY[lang];
  const isPhoneValid = useMemo(() => /^\d{10}$/.test(phone), [phone]);
  const isOtpComplete = useMemo(() => otp.every((d) => d.length === 1), [otp]);

  function formatPhoneDisplay(raw: string) {
    if (raw.length <= 5) return raw;
    return `${raw.slice(0, 5)} ${raw.slice(5)}`;
  }

  function handlePhoneChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digitsOnly);
  }

  function startResendCountdown() {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleGetOtp() {
    if (!isPhoneValid) return;
    setStep("otp");
    startResendCountdown();
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleChangeNumber() {
    setStep("phone");
    setOtp(["", "", "", ""]);
  }
  function handleVerifyOtp() {
    if (!isOtpComplete) return;
    router.push("/personal-info");
  }

  return (
    <div
      className={`${poppins.variable} ${notoSans.variable} min-h-screen bg-[#F5F6F8] font-[family-name:var(--font-body)] flex flex-col`}
    >
      {/* Top bar: title + language selector */}
      <header className="w-full px-4 sm:px-6 py-4 flex items-center justify-between max-w-md mx-auto sm:max-w-none">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#1D4ED8] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.25} />
          </div>
          <span className="font-[family-name:var(--font-display)] font-semibold text-lg text-gray-900">
            {t.title}
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            className="flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-800 active:bg-gray-100"
          >
            {lang === "en" ? "English" : "हिंदी"}
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {langOpen && (
            <ul
              role="listbox"
              className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-10"
            >
              {(["en", "hi"] as Lang[]).map((code) => (
                <li key={code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={lang === code}
                    onClick={() => {
                      setLang(code);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left min-h-[44px] px-4 flex items-center text-sm font-medium ${
                      lang === code
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 active:bg-gray-50"
                    }`}
                  >
                    {code === "en" ? "English" : "हिंदी"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-sm">
          {/* Title block */}
          <div className="text-center mb-6">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-gray-900 tracking-tight">
              {t.title}
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">{t.tagline}</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-6 sm:px-6 sm:py-7">
            {step === "phone" ? (
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-800 mb-2"
                >
                  {t.phoneLabel}
                </label>

                <div className="flex items-stretch gap-2">
                  <div className="flex items-center gap-2 flex-1 border border-gray-300 rounded-xl px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-colors">
                    <span className="flex items-center gap-1.5 text-gray-700 font-medium text-base pr-2 border-r border-gray-300 h-[44px]">
                      <Phone className="w-4 h-4 text-gray-400" />
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder={t.phonePlaceholder}
                      value={formatPhoneDisplay(phone)}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="flex-1 h-[44px] bg-transparent outline-none text-base tracking-wide text-gray-900 placeholder:text-gray-400 min-w-0"
                    />
                    <button
                      type="button"
                      aria-label={t.micHint}
                      title={t.micHint}
                      className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-gray-400 active:bg-gray-100 active:text-blue-600 shrink-0"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGetOtp}
                  disabled={!isPhoneValid}
                  className="mt-5 w-full min-h-[52px] rounded-xl bg-[#1D4ED8] text-white font-semibold text-base active:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                >
                  {t.getOtp}
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={handleChangeNumber}
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-700 mb-4 min-h-[32px] -ml-1 px-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.changeNumber}
                </button>

                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  {t.otpLabel(formatPhoneDisplay(phone))}
                </p>

                <div className="flex items-center justify-between gap-3">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-full h-[52px] text-center text-xl font-semibold border border-gray-300 rounded-xl outline-none text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                  ))}
                </div>

                <div className="mt-4 text-sm">
                  {resendTimer > 0 ? (
                    <span className="text-gray-400">{t.resendIn(resendTimer)}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={startResendCountdown}
                      className="text-blue-700 font-medium min-h-[32px]"
                    >
                      {t.resend}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={!isOtpComplete}
                  className="mt-5 w-full min-h-[52px] rounded-xl bg-[#1D4ED8] text-white font-semibold text-base active:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                >
                  {t.verify}
                </button>
              </div>
            )}
          </div>

          {/* Trust strip */}
          <div className="mt-5 flex items-start gap-2 px-1">
            <ShieldCheck className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">{t.trust}</p>
          </div>
        </div>
      </main>

      {/* Footer helpline */}
      <footer className="w-full py-4 text-center border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-500">{t.helpline}</p>
      </footer>
    </div>
  );
}