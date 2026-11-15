"use client";

import { useState, useSyncExternalStore } from "react";

/**
 * Plays Cantonese audio using the browser's built-in text-to-speech.
 * Most systems ship a Cantonese (Hong Kong) voice: Sinji on Apple devices,
 * Tracy/Danny on Windows, and Google's voice in Chrome and on Android.
 */

const isCantonese = (v: SpeechSynthesisVoice) => /^(zh[-_]HK|yue)/i.test(v.lang);

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter(isCantonese);
  // Prefer local voices (no network needed, and usually lower latency).
  return voices.find((v) => v.localService) ?? voices[0] ?? null;
}

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  // Voices load asynchronously in most browsers.
  window.speechSynthesis.addEventListener("voiceschanged", onChange);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", onChange);
}

/** The chosen voice's id, or null if this device has no Cantonese voice. */
function useCantoneseVoice(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => pickVoice()?.voiceURI ?? null,
    () => null,
  );
}

export function SpeakButton({ text, label }: { text: string; label: string }) {
  const voiceURI = useCantoneseVoice();
  const [speaking, setSpeaking] = useState(false);

  function speak() {
    const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceURI);
    if (!voice) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.85;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  const available = voiceURI !== null;
  return (
    <button
      type="button"
      onClick={speak}
      disabled={!available}
      aria-label={available ? `Play ${label}` : "Audio unavailable"}
      title={
        available
          ? "Play in Cantonese"
          : "No Cantonese voice on this device. Add a Cantonese (Hong Kong) voice in your system's speech settings."
      }
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full transition-colors ${
        available
          ? speaking
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          : "cursor-not-allowed bg-zinc-50 text-zinc-300 dark:bg-zinc-950 dark:text-zinc-700"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {available ? (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          <path d="m22 9-6 6m0-6 6 6" />
        )}
      </svg>
    </button>
  );
}
