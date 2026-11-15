import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";

export type Entry = {
  id: number;
  traditional: string;
  simplified: string;
  /** Space-separated Jyutping with tones, e.g. "m4 goi1" */
  jyutping: string;
  /** Jyutping syllables without tones, e.g. ["m", "goi"] */
  syllables: string[];
  tones: (number | null)[];
  definitions: string[];
  /** From CC-Canto: a Cantonese-specific word or sense */
  cantonese: boolean;
  properNoun: boolean;
  /** Lower is better: a rough "how likely is this the word you want" penalty */
  rankPenalty: number;
};

// [trad, simp, jyutping, defs, flags, wordFreq, minCharFreq] — see scripts/build-dictionary.mts
type RawEntry = [string, string, string, string[], number, number, number];

const DATA_FILE = path.join(process.cwd(), "data", "dictionary.json.gz");

const OBSCURE_DEF = /^(old |archaic |ancient |obsolete |\(old\)|\(archaic\)|variant of|surname |see |used in |\(literary\)|\(classical\))/i;

function load(): Entry[] {
  const raw = JSON.parse(gunzipSync(readFileSync(DATA_FILE)).toString("utf8")) as {
    entries: RawEntry[];
  };

  // Character "productivity": how many words each character appears in.
  // Without corpus frequencies this is a decent proxy for how common a character is.
  const charCount = new Map<string, number>();
  for (const [trad] of raw.entries) {
    for (const ch of new Set(trad)) charCount.set(ch, (charCount.get(ch) ?? 0) + 1);
  }

  return raw.entries.map(([traditional, simplified, jyutping, definitions, flags, wordFreq, charFreq], id) => {
    const parts = jyutping.split(" ");
    const syllables = parts.map((p) => p.replace(/[1-6]$/, ""));
    const tones = parts.map((p) => (/[1-6]$/.test(p) ? Number(p.at(-1)) : null));
    const cantonese = (flags & 1) !== 0;
    const properNoun = (flags & 2) !== 0;

    let rankPenalty = 0;
    if (cantonese) rankPenalty -= 0.5;
    if (properNoun) rankPenalty += 1.5;
    if (definitions.every((d) => OBSCURE_DEF.test(d))) rankPenalty += 1.5;
    // How often the word itself is said in spoken Cantonese (HKCanCor).
    rankPenalty -= Math.min(Math.log10(wordFreq + 1), 3.5) * 0.6;
    // Words built from characters rarely heard in speech are probably not the one you want.
    rankPenalty += Math.max(0, 3 - Math.log10(charFreq + 1)) * 0.35;
    const minProductivity = Math.min(...[...traditional].map((ch) => charCount.get(ch) ?? 1));
    rankPenalty += Math.max(0, 2.5 - Math.log10(minProductivity + 1)) * 0.25;
    // Fewer senses usually means a rarer word.
    rankPenalty -= Math.min(definitions.length, 6) * 0.04;

    return {
      id,
      traditional,
      simplified,
      jyutping,
      syllables,
      tones,
      definitions,
      cantonese,
      properNoun,
      rankPenalty,
    };
  });
}

let cache: Entry[] | null = null;

export function getEntries(): Entry[] {
  return (cache ??= load());
}
