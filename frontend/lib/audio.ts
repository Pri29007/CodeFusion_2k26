export type Lang = "en" | "hi" | "mr" | "pa";
export type AudioType = "welcome" | "mobilenumberverify";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

// Tracks the currently playing static audio, so a new play() call
// always stops the previous one first instead of overlapping.
let currentAudio: HTMLAudioElement | null = null;

export function staticAudioUrl(type: AudioType, langCode: Lang): string {
  return `${SUPABASE_URL}/storage/v1/object/public/static-audio/${type}_${langCode}.wav`;
}

export function playStaticAudio(type: AudioType, langCode: Lang) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  const audio = new Audio(staticAudioUrl(type, langCode));
  currentAudio = audio;
    audio.play().catch((err) => {
    // AbortError happens when this same function interrupts its own
    // previous playback (e.g. React re-running effects in dev mode) —
    // this is expected, not a real failure, so we stay quiet about it.
    if (err.name !== "AbortError") {
      console.error("Static audio playback failed:", err);
    }
  })
}