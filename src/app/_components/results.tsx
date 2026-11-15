"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import type { SearchResult } from "@/server/dictionary";
import { SpeakButton } from "./speak-button";

export function Results({
  results,
  loading,
  error,
  emptyHint,
}: {
  results: SearchResult[] | null;
  loading: boolean;
  error: string | null;
  emptyHint: string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  // Replay the staggered entrance only when the set of results changes,
  // not on every keystroke that returns the same words.
  const resultKey = results?.map((r) => r.id).join(",") ?? "";
  // Also replay when the list (re)appears, e.g. the same results after clearing the box.
  const listVisible = !error && !!results && results.length > 0;

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.classList.remove("is-shown");
    void list.offsetHeight;
    list.classList.add("is-shown");
  }, [resultKey, listVisible]);

  if (error) return <p className="text-sm text-seal">{error}</p>;
  if (!results) return null;
  if (results.length === 0) {
    return loading ? null : <p className="text-ink-faint">No matches. {emptyHint}</p>;
  }
  return (
    <ul ref={listRef} className={`t-stagger flex flex-col gap-3 transition-opacity ${loading ? "opacity-60" : ""}`}>
      {results.map((r, i) => (
        <ResultCard key={r.id} result={r} index={i} />
      ))}
    </ul>
  );
}

function ResultCard({ result: r, index }: { result: SearchResult; index: number }) {
  return (
    <li
      className="t-stagger-line rounded-[4px] border border-rule-strong bg-paper-light/70 p-4 shadow-[0_1px_0_var(--rule)] sm:p-5"
      // Stagger the first few cards; the rest arrive together.
      style={{ "--i": Math.min(index, 8) } as CSSProperties}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <SpeakButton text={r.traditional} label={`${r.traditional} (${r.jyutping})`} />
        <span lang="zh-HK" className="text-3xl font-bold text-ink sm:text-4xl">
          {r.traditional}
        </span>
        {r.simplified !== r.traditional && (
          <span lang="zh-CN" className="text-lg text-ink-faint" title="Simplified">
            {r.simplified}
          </span>
        )}
        <span className="text-ink-soft italic tracking-wide">{r.jyutping}</span>
        <span className="ml-auto flex gap-1.5">
          {r.cantonese && (
            <span
              className="rounded-[3px] border border-seal px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-seal"
              title="A Cantonese word or sense (from CC-Canto)"
            >
              Cantonese
            </span>
          )}
          {(r.soundMismatch || !r.exact) && (
            <span className="rounded-[3px] border border-rule-strong px-1.5 py-0.5 text-[11px] uppercase tracking-wider text-ink-faint">
              {r.soundMismatch ? "different sound" : "longer word"}
            </span>
          )}
        </span>
      </div>
      {r.characters && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="What each character means">
          {r.characters.map((c, i) => (
            <span
              key={i}
              className={`flex items-baseline gap-1.5 rounded-[3px] border px-2 py-1 text-sm ${
                c.matched ? "border-seal/50 bg-seal-soft text-ink" : "border-rule bg-paper-deep/60 text-ink-soft"
              }`}
            >
              <span lang="zh-HK" className={`text-base font-bold ${c.matched ? "text-seal" : "text-ink"}`}>
                {c.char}
              </span>
              {c.gloss ?? "—"}
            </span>
          ))}
        </div>
      )}
      <ul className="mt-3 list-disc pl-5 text-ink-soft marker:text-ink-faint">
        {r.definitions.slice(0, 4).map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
      {r.definitions.length > 4 && (
        <p className="mt-1 pl-5 text-sm text-ink-faint">+{r.definitions.length - 4} more meanings</p>
      )}
    </li>
  );
}
