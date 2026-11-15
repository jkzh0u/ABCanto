"use client";

import { useRef, useState } from "react";
import { Results } from "./_components/results";
import { SlidingTabs } from "./_components/sliding-tabs";
import { SwapText } from "./_components/swap-text";
import { useLiveSearch, type SearchRequest } from "./_components/use-live-search";

type Tab = "sound" | "english" | "literal";

type Example = { q: string; sound?: string };

const TABS: { id: Tab; label: string; hint: string; placeholder: string; examples: Example[]; emptyHint: string }[] = [
  {
    id: "sound",
    label: "How it sounds",
    hint: "Type it how it sounds in English letters. Spelling doesn't have to be perfect. You can also type characters.",
    placeholder: "e.g. m goi, lei ho, mo yeh",
    examples: [
      { q: "m goi" },
      { q: "ngo" },
      { q: "lei ho" },
      { q: "mo yeh" },
      { q: "jo san" },
      { q: "chee seen" },
      { q: "sik ning mung" },
    ],
    emptyHint: "Try spacing out the syllables, or a different spelling.",
  },
  {
    id: "english",
    label: "What it means",
    hint: "Type the meaning in English to find the Cantonese word. You can also type characters.",
    placeholder: "e.g. thank you, delicious, crazy",
    examples: [
      { q: "thank you" },
      { q: "delicious" },
      { q: "crazy" },
      { q: "nothing" },
      { q: "sorry" },
      { q: "good morning" },
    ],
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

const inputClass = "field px-4";

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
      <SlidingTabs
        tabs={TABS}
        value={tab}
        onChange={(id) => {
          setTab(id);
          inputRef.current?.focus();
        }}
      />

      <div className="flex flex-col">
        {/* Extra fields for the literal tab expand and collapse in place. */}
        <div className="t-acc" data-open={tab === "literal"}>
          <div className="t-acc-panel">
            <div className="t-acc-panel-inner" inert={tab !== "literal"}>
              <span className="block pb-2 text-sm font-semibold text-ink-soft">Literally means</span>
            </div>
          </div>
        </div>
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
        <p className="mt-2 text-sm text-ink-faint">
          <SwapText text={current.hint} />
        </p>

        <div className="t-acc" data-open={tab === "literal"}>
          <div className="t-acc-panel">
            <div className="t-acc-panel-inner" inert={tab !== "literal"}>
              <label className="flex flex-col gap-1.5 pt-3">
                <span className="text-sm font-semibold text-ink-soft">
                  Sounds like <span className="font-normal text-ink-faint">(optional)</span>
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
                <span className="text-sm text-ink-faint">
                  Adding how it sounds makes results much more accurate.
                </span>
              </label>
            </div>
          </div>
        </div>
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
              className="chip px-3 py-1 text-sm"
            >
              {ex.q}
              {ex.sound && <span className="text-ink-faint"> · {ex.sound}</span>}
            </button>
          ))}
        </div>
      )}

      <Results results={results} loading={loading} error={error} emptyHint={current.emptyHint} />
    </div>
  );
}
