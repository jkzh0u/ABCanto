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
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!results) return null;
  if (results.length === 0) {
    return loading ? null : <p className="text-zinc-500 dark:text-zinc-400">No matches. {emptyHint}</p>;
  }
  return (
    <ul className={`flex flex-col gap-3 transition-opacity ${loading ? "opacity-60" : ""}`}>
      {results.map((r) => (
        <ResultCard key={r.id} result={r} />
      ))}
    </ul>
  );
}

function ResultCard({ result: r }: { result: SearchResult }) {
  return (
    <li className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <SpeakButton text={r.traditional} label={`${r.traditional} (${r.jyutping})`} />
        <span lang="zh-HK" className="text-3xl font-medium">
          {r.traditional}
        </span>
        {r.simplified !== r.traditional && (
          <span lang="zh-CN" className="text-lg text-zinc-400" title="Simplified">
            {r.simplified}
          </span>
        )}
        <span className="font-mono text-zinc-700 dark:text-zinc-300">{r.jyutping}</span>
        <span className="ml-auto flex gap-1.5">
          {r.cantonese && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Cantonese
            </span>
          )}
          {(r.soundMismatch || !r.exact) && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
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
              className={`flex items-baseline gap-1.5 rounded-lg px-2 py-1 text-sm ${
                c.matched
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              <span lang="zh-HK" className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {c.char}
              </span>
              {c.gloss ?? "—"}
            </span>
          ))}
        </div>
      )}
      <ul className="mt-2 list-disc pl-5 text-zinc-700 marker:text-zinc-400 dark:text-zinc-300">
        {r.definitions.slice(0, 4).map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
      {r.definitions.length > 4 && (
        <p className="mt-1 pl-5 text-sm text-zinc-400">+{r.definitions.length - 4} more meanings</p>
      )}
    </li>
  );
}
