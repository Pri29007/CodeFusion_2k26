"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  Check,
  BadgeCheck,
  Volume2,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type SchemeVerdict = {
  scheme_name: string;
  level: string;
  category: string;
  reason: string;
  confidence: string;
  eligible: boolean;
  missing_info: string[];
  is_automatable: boolean;
};

type FillState = "idle" | "filling" | "done";

function formatFieldName(field: string) {
  const words = field.split("_").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function SchemeCard({ scheme }: { scheme: SchemeVerdict }) {
  const [fillState, setFillState] = useState<FillState>("idle");

  function handleAutoFill() {
    if (fillState !== "idle") return;

    setFillState("filling");

    setTimeout(() => {
      setFillState("done");
    }, 1600);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2.5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] font-bold text-slate-900 text-sm leading-snug">
            {scheme.scheme_name}
          </h3>

          <span className="shrink-0 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1 capitalize">
            {scheme.level}
          </span>
        </div>

        <p className="text-sm text-slate-500 mt-1">
          {scheme.category}
        </p>
      </div>

      <div className="flex items-start gap-1.5 bg-slate-50 rounded-lg px-2.5 py-2">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-900 shrink-0 mt-0.5" />

        <p className="text-[11px] text-slate-600 leading-relaxed">
          {scheme.reason}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
          <BadgeCheck className="w-3 h-3" />
          Eligible
        </span>

        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 capitalize">
          Confidence: {scheme.confidence}
        </span>
      </div>

      {scheme.missing_info?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {scheme.missing_info.map((field) => (
            <span
              key={field}
              className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5"
            >
              Needs: {formatFieldName(field)}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAutoFill}
        disabled={fillState !== "idle"}
        className={`mt-auto min-h-[40px] w-full rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors ${
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

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<SchemeVerdict[]>([]);
  const [loading, setLoading] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  /*
   * Fetch eligible schemes from Supabase.
   */
  const fetchSchemes = useCallback(async () => {
    const aadhaar = localStorage.getItem("aadhaar_number");

    if (!aadhaar) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("applications")
      .select("scheme_name, form_data")
      .eq("aadhaar_number", aadhaar);

    if (error) {
      console.error("Failed to fetch schemes:", error);
      setLoading(false);
      return;
    }

    const mapped: SchemeVerdict[] = (data ?? []).map((row: any) => ({
      scheme_name:
        row.form_data?.scheme_name ?? row.scheme_name,

      level:
        row.form_data?.level ?? "state",

      category:
        row.form_data?.category ?? "",

      reason:
        row.form_data?.reason ?? "",

      confidence:
        row.form_data?.confidence ?? "medium",

      eligible:
        row.form_data?.eligible ?? true,

      missing_info:
        row.form_data?.missing_info ?? [],

      is_automatable:
        row.form_data?.is_automatable ?? false,
    }));

    setSchemes(mapped.filter((scheme) => scheme.eligible));
    setLoading(false);
  }, []);

  /*
   * Build the expected audio URL.
   *
   * Example:
   * static-audio/111100004444/summary_hi.wav
   */
  function getAudioUrl() {
    const aadhaar = localStorage.getItem("aadhaar_number");
    const language =
      localStorage.getItem("preferred_language") || "hi";

    if (!aadhaar) return null;

    return `https://fphpuyadffaxkgdkmeua.supabase.co/storage/v1/object/public/static-audio/${aadhaar}/summary_${language}.wav`;
  }

  /*
   * Check whether the backend has already uploaded the audio.
   */
  const checkAudio = useCallback(async () => {
    const url = getAudioUrl();

    if (!url) return false;

    try {
      const response = await fetch(url, {
        method: "HEAD",
        cache: "no-store",
      });

      if (response.ok) {
        setAudioAvailable(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to check audio:", error);
      return false;
    }
  }, []);

  /*
   * Play the already-generated audio.
   */
  const handleListen = useCallback(async () => {
    const url = getAudioUrl();

    if (!url) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(url);

    audioRef.current = audio;

    audio.onplay = () => {
      setIsPlaying(true);
    };

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.onerror = () => {
      console.error("Audio playback failed.");
      setIsPlaying(false);
    };

    try {
      await audio.play();
    } catch (error) {
      console.error("Audio playback failed:", error);
      setIsPlaying(false);
    }
  }, []);

  /*
   * Initial scheme fetch.
   */
  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  /*
   * Poll Supabase for the generated audio.
   *
   * The backend is responsible for generating and uploading it.
   * The frontend only checks whether it exists.
   */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    async function pollAudio() {
      if (stopped) return;

      const available = await checkAudio();

      if (available && interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    // Check immediately.
    pollAudio();

    // If backend hasn't uploaded it yet, check every 5 seconds.
    interval = setInterval(pollAudio, 5000);

    return () => {
      stopped = true;

      if (interval) {
        clearInterval(interval);
      }
    };
  }, [checkAudio]);

  /*
   * Clean up audio when leaving the page.
   */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />

          <h2 className="font-[family-name:var(--font-display)] font-bold text-slate-900 text-base sm:text-lg">
            Schemes You Qualify For
          </h2>
        </div>

        <button
          type="button"
          onClick={handleListen}
          disabled={isPlaying || !audioAvailable}
          className="shrink-0 min-h-[40px] px-4 rounded-full bg-blue-900 text-white text-sm font-semibold flex items-center gap-2 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}

          {isPlaying ? "Playing..." : "Listen"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Finding schemes you may be eligible for...
        </div>
      )}

      {!loading && schemes.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-600">
            We&apos;re finding schemes that you may be eligible for.
          </p>

          <p className="text-sm text-slate-400 mt-1">
            Please refresh in a few minutes.
          </p>
        </div>
      )}

      {!loading && schemes.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {schemes.map((scheme) => (
            <SchemeCard
              key={scheme.scheme_name}
              scheme={scheme}
            />
          ))}
        </div>
      )}
    </section>
  );
}