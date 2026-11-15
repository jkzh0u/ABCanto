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

  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
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
      onClick={toggle}
      disabled={!available}
      aria-label={available ? (speaking ? `Stop ${label}` : `Play ${label}`) : "Audio unavailable"}
      title={
        available
          ? speaking
            ? "Stop"
            : "Play in Cantonese"
          : "No Cantonese voice on this device. Add a Cantonese (Hong Kong) voice in your system's speech settings."
      }
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full border transition-colors ${
        available
          ? speaking
            ? "border-seal bg-seal text-paper-light"
            : "border-rule-strong bg-paper-deep text-ink-soft hover:border-seal hover:text-seal"
          : "cursor-not-allowed border-rule bg-transparent text-ink-faint/50"
      }`}
    >
      {available ? (
        // Speaker ⇄ stop, cross-faded (transitions.dev "Icon swap").
        <span className="t-icon-swap" data-state={speaking ? "b" : "a"} aria-hidden="true">
          <span className="t-icon" data-icon="a">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </span>
          <span className="t-icon" data-icon="b">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <rect x="7" y="7" width="10" height="10" rx="2" />
            </svg>
          </span>
        </span>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          <path d="m22 9-6 6m0-6 6 6" />
        </svg>
      )}
    </button>
  );
}
