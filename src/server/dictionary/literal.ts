import { getEntries, type Entry } from "./data";
import { meaningfulTokens, tokenize } from "./text";

/**
 * "I know the literal translation" search: match English words to a word's
 * characters one by one. "hot air" -> 熱 (hot) + 氣 (air) -> 熱氣,
 * "flying machine" -> 飛 (fly) + 機 (machine) -> 飛機.
 */

type GlossHit = { position: number; definition: string };

type LiteralIndex = {
  /** char -> token -> best (earliest) definition of that char containing the token */
  glosses: Map<string, Map<string, GlossHit>>;
  /** same, per reading ("要|jiu3"): 要 means "horse" only when read jiu2 */
  readingGlosses: Map<string, Map<string, GlossHit>>;
  /** token -> chars whose definitions contain it */
  tokenChars: Map<string, string[]>;
  /** char -> ids of multi-character entries containing it */
  charEntries: Map<string, number[]>;
  /** "char|jyutping" -> a short gloss, for showing what each character means */
  shortGloss: Map<string, string>;
  /** char -> a short gloss from its most common reading */
  fallbackGloss: Map<string, string>;
};

let index: LiteralIndex | null = null;

/** "to fly (of birds); to flutter" -> "to fly" */
function shorten(definition: string): string {
  const first = definition
    .split(/[;/]|\s\d\.\s/)[0]
    .replace(/\([^)]*\)/g, "")
    .replace(/^\d\.\s*/, "")
    .replace(/\s+M:.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return (first || definition).slice(0, 40);
}

const MAX_SENSES = 12;

function getIndex(): LiteralIndex {
  if (index) return index;
  const entries = getEntries();
  const glosses = new Map<string, Map<string, GlossHit>>();
  const readingGlosses = new Map<string, Map<string, GlossHit>>();
  const shortGloss = new Map<string, string>();
  const fallback = new Map<string, { gloss: string; rank: number }>();
  const charEntries = new Map<string, number[]>();

  for (const e of entries) {
    const chars = [...e.traditional];
    if (chars.length === 1) {
      const ch = chars[0];
      const usable = e.definitions.filter((d) => !/^(see |variant of|old variant|surname |used in |Mandarin equivalent)/i.test(d));
      if (usable.length === 0) continue;
      const map = glosses.get(ch) ?? new Map<string, GlossHit>();
      glosses.set(ch, map);
      const readingKey = `${ch}|${e.jyutping}`;
      const readingMap = readingGlosses.get(readingKey) ?? new Map<string, GlossHit>();
      readingGlosses.set(readingKey, readingMap);
      usable.slice(0, MAX_SENSES).forEach((sense, position) => {
        // Remember the specific part that mentions the word: 氣 "gas; air" -> "air".
        for (const part of sense.split(/[;,]|\s\d\.\s/)) {
          for (const t of tokenize(part.replace(/\([^)]*\)/g, " "))) {
            for (const m of [map, readingMap]) {
              const prev = m.get(t);
              if (!prev || position < prev.position) m.set(t, { position, definition: part });
            }
          }
        }
      });
      shortGloss.set(`${ch}|${e.jyutping}`, shortGloss.get(`${ch}|${e.jyutping}`) ?? shorten(usable[0]));
      const prev = fallback.get(ch);
      if (!prev || e.rankPenalty < prev.rank) fallback.set(ch, { gloss: shorten(usable[0]), rank: e.rankPenalty });
    } else if (chars.length <= 8) {
      for (const ch of new Set(chars)) {
        const list = charEntries.get(ch);
        if (list) list.push(e.id);
        else charEntries.set(ch, [e.id]);
      }
    }
  }

  const tokenChars = new Map<string, string[]>();
  for (const [ch, map] of glosses) {
    for (const t of map.keys()) {
      const list = tokenChars.get(t);
      if (list) list.push(ch);
      else tokenChars.set(t, [ch]);
    }
  }

  return (index = {
    glosses,
    readingGlosses,
    tokenChars,
    charEntries,
    shortGloss,
    fallbackGloss: new Map([...fallback].map(([ch, v]) => [ch, v.gloss])),
  });
}

export type CharacterGloss = {
  char: string;
  jyutping: string | null;
  gloss: string | null;
  /** True when this character matched one of the literal words you typed */
  matched: boolean;
};

/** What does each character of this word mean on its own? */
export function characterBreakdown(entry: Entry, matches?: Map<number, string>): CharacterGloss[] | null {
  const chars = [...entry.traditional];
  if (chars.length < 2 || chars.length > 8) return null;
  const { shortGloss, fallbackGloss } = getIndex();
  const readings = entry.jyutping.split(" ");
  const aligned = readings.length === chars.length;
  return chars.map((char, i) => {
    const jyutping = aligned ? readings[i] : null;
    const matched = matches?.get(i);
    return {
      char,
      jyutping,
      gloss: matched ?? (jyutping && shortGloss.get(`${char}|${jyutping}`)) ?? fallbackGloss.get(char) ?? null,
      matched: matched !== undefined,
    };
  });
}

export type LiteralMatch = {
  cost: number;
  /** how many of the typed words found a character */
  matched: number;
  /** char position -> the definition it matched on */
  matches: Map<number, string>;
};

/** Align typed words with the word's characters. Lower cost is better. */
export function literalMatch(entry: Entry, tokens: string[]): LiteralMatch | null {
  const { glosses, readingGlosses } = getIndex();
  const chars = [...entry.traditional];
  const m = tokens.length;
  const n = chars.length;
  if (m === 0) return null;
  const readings = entry.jyutping.split(" ");
  const aligned = readings.length === n;
  // Use the meanings of the character as it's pronounced in this word; if that
  // reading has no entry of its own, fall back to any reading at a penalty.
  const hitCache = new Map<string, GlossHit | undefined>();
  const hit = (i: number, j: number): GlossHit | undefined => {
    const key = `${i}|${j}`;
    if (hitCache.has(key)) return hitCache.get(key);
    let h: GlossHit | undefined;
    const byReading = aligned ? readingGlosses.get(`${chars[j]}|${readings[j]}`) : undefined;
    if (byReading) h = byReading.get(tokens[i]);
    else {
      const any = glosses.get(chars[j])?.get(tokens[i]);
      if (any) h = { ...any, position: any.position + (aligned ? 3 : 0) };
    }
    hitCache.set(key, h);
    return h;
  };
  const gain = (h: GlossHit) => 10 - Math.min(h.position, 10) * 0.5;

  // Best in-order alignment (LCS-style DP).
  const f = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const h = hit(i - 1, j - 1);
      f[i][j] = Math.max(f[i - 1][j], f[i][j - 1], h ? f[i - 1][j - 1] + gain(h) : -Infinity);
    }
  }
  const ordered = new Map<number, GlossHit>();
  for (let i = m, j = n; i > 0 && j > 0; ) {
    const h = hit(i - 1, j - 1);
    if (h && f[i][j] === f[i - 1][j - 1] + gain(h)) {
      ordered.set(j - 1, h);
      i--;
      j--;
    } else if (f[i][j] === f[i - 1][j]) i--;
    else j--;
  }

  // Out-of-order alignment, in case word order differs ("machine for flying").
  const unordered = new Map<number, GlossHit>();
  for (let i = 0; i < m; i++) {
    let best: [number, GlossHit] | null = null;
    for (let j = 0; j < n; j++) {
      const h = hit(i, j);
      if (h && !unordered.has(j) && (!best || h.position < best[1].position)) best = [j, h];
    }
    if (best) unordered.set(best[0], best[1]);
  }

  const useOrdered = ordered.size >= unordered.size;
  const chosen = useOrdered ? ordered : unordered;
  const k = chosen.size;
  if (k === 0) return null;
  let cost = (m - k) * 1.5 + (n - k) * 0.7 + (useOrdered ? 0 : 0.4);
  // A character's main meaning counts for much more than its tenth sense.
  for (const h of chosen.values()) cost += Math.min(h.position, 10) * 0.18;
  return {
    cost,
    matched: k,
    matches: new Map([...chosen].map(([j, h]) => [j, shorten(h.definition)])),
  };
}

export type LiteralResult = { entry: Entry; score: number; match: LiteralMatch };

/** Find words whose characters spell out the literal meaning, e.g. "flying machine" -> 飛機. */
export function searchByLiteral(query: string, limit = 20): LiteralResult[] {
  const tokens = meaningfulTokens(query);
  if (tokens.length < 2 || tokens.length > 6) return [];
  const { tokenChars, charEntries } = getIndex();
  const entries = getEntries();

  // Count how many of the typed words each candidate word could cover.
  const covered = new Map<number, Set<number>>();
  tokens.forEach((t, i) => {
    for (const ch of tokenChars.get(t) ?? []) {
      for (const id of charEntries.get(ch) ?? []) {
        const set = covered.get(id);
        if (set) set.add(i);
        else covered.set(id, new Set([i]));
      }
    }
  });

  const needed = Math.max(2, Math.ceil(tokens.length * 0.6));
  const results: LiteralResult[] = [];
  for (const [id, set] of covered) {
    if (set.size < needed) continue;
    const e = entries[id];
    if ([...e.traditional].length > tokens.length + 2) continue;
    const match = literalMatch(e, tokens);
    if (!match || match.matched < needed) continue;
    results.push({ entry: e, score: match.cost + e.rankPenalty * 0.6, match });
  }
  return results.sort((a, b) => a.score - b.score).slice(0, limit);
}
