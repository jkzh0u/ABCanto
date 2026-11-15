"use client";

import { useRef, useState } from "react";
import { Results } from "./_components/results";
import { useLiveSearch, type SearchRequest } from "./_components/use-live-search";

type Tab = "sound" | "english" | "literal";

type Example = { q: string; sound?: string };

const TABS: { id: Tab; label: string; hint: string; placeholder: string; examples: Example[]; emptyHint: string }[] = [
  {
    id: "sound",
    label: "How it sounds",
    hint: "Type it how it sounds in English letters. Spelling doesn't have to be perfect. You can also type characters.",
    placeholder: "e.g. m goi, lei ho, mo yeh",
    examples: [{ q: "m goi" }, { q: "lei ho" }, { q: "mo yeh" }, { q: "jo san" }, { q: "chee seen" }, { q: "sik ning mung" }],
    emptyHint: "Try spacing out the syllables, or a different spelling.",
  },
  {
    id: "english",
    label: "What it means",
    hint: "Type the meaning in English to find the Cantonese word. You can also type characters.",
    placeholder: "e.g. thank you, delicious, crazy",
    examples: [{ q: "thank you" }, { q: "delicious" }, { q: "crazy" }, { q: "nothing" }, { q: "sorry" }, { q: "good morning" }],
    emptyHint: "Try a simpler or different English word.",
  },
  {
    id: "literal",
    label: "Literal translation",
    hint: "Type what the word literally means, word by word, like “flying machine” for 飛機 (airplane).",
    placeholder: "e.g. flying machine, hot air",
    examples: [
      { q: "flying machine", sound: "fay gay" },
      { q: "hot air", sound: "yeet hay" },
      { q: "electric brain", sound: "din lo" },
      { q: "fire car" },
      { q: "snow cabinet" },
      { q: "cow milk" },
    ],
    emptyHint: "Try simpler words for the meaning, or add how it sounds.",
  },
];

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-400";

export function Search() {
  const [tab, setTab] = useState<Tab>("sound");
  const [query, setQuery] = useState("");
  const [sound, setSound] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const q = query.trim();
  const s = sound.trim();

  let request: SearchRequest | null = null;
  if (q) {
    request =
      tab === "literal"
        ? { endpoint: "literal", query: s ? { meaning: q, sound: s } : { meaning: q } }
        : { endpoint: "search", query: { q, mode: tab } };
  }
  const { results, loading, error } = useLiveSearch(request);
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              inputRef.current?.focus();
            }}
            className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {tab === "literal" && (
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Literally means</span>
        )}
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={current.placeholder}
          aria-label={tab === "literal" ? "Literally means" : "Search"}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={`${inputClass} py-3 text-lg`}
        />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{current.hint}</p>

        {tab === "literal" && (
          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Sounds like <span className="font-normal text-zinc-400">(optional)</span>
            </span>
            <input
              value={sound}
              onChange={(e) => setSound(e.target.value)}
              placeholder="e.g. fay gay"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className={`${inputClass} py-2.5`}
            />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Adding how it sounds makes results much more accurate.
            </span>
          </label>
        )}
      </div>

      {!q && (
        <div className="flex flex-wrap gap-2">
          {current.examples.map((ex) => (
            <button
              key={ex.q}
              onClick={() => {
                setQuery(ex.q);
                if (tab === "literal") setSound(ex.sound ?? "");
              }}
              className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {ex.q}
              {ex.sound && <span className="text-zinc-400"> · {ex.sound}</span>}
            </button>
          ))}
        </div>
      )}

      <Results results={results} loading={loading} error={error} emptyHint={current.emptyHint} />
    </div>
  );
}
