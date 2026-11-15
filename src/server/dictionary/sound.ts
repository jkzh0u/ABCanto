import { getEntries, type Entry } from "./data";
import { FINAL_SPELLINGS, INITIAL_SPELLINGS, parseSyllable } from "./jyutping";

/**
 * "Sounds like" search: turn loose English-letter spellings ("lei ho", "mgoi",
 * "mo yeh") into Jyutping syllable sequences and look them up.
 */

type SoundIndex = {
  /** toneless syllable key ("m goi") -> entry ids */
  byKey: Map<string, number[]>;
  /** every prefix of every key, for pruning the search */
  prefixes: Set<string>;
  /** all keys, sorted, for prefix-completion lookups */
  sortedKeys: string[];
  /** every toneless syllable that occurs in the dictionary */
  syllables: Set<string>;
};

let index: SoundIndex | null = null;

function getIndex(): SoundIndex {
  if (index) return index;
  const byKey = new Map<string, number[]>();
  const prefixes = new Set<string>();
  const syllables = new Set<string>();
  for (const e of getEntries()) {
    if (!e.syllables.every((s) => parseSyllable(s))) continue;
    const key = e.syllables.join(" ");
    const list = byKey.get(key);
    if (list) list.push(e.id);
    else byKey.set(key, [e.id]);
    for (let i = 1; i <= e.syllables.length; i++) prefixes.add(e.syllables.slice(0, i).join(" "));
    for (const s of e.syllables) syllables.add(s);
  }
  return (index = { byKey, prefixes, sortedKeys: [...byKey.keys()].sort(), syllables });
}

type SyllableMatch = { syllable: string; cost: number };

const MAX_SPELLING = 7;
const syllableCache = new Map<string, SyllableMatch[]>();

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Which Jyutping syllables could this typed chunk be? */
export function matchSyllable(text: string): SyllableMatch[] {
  const cached = syllableCache.get(text);
  if (cached) return cached;
  const { syllables } = getIndex();
  const best = new Map<string, number>();
  const consider = (syllable: string, cost: number) => {
    if (!syllables.has(syllable)) return;
    if (cost < (best.get(syllable) ?? Infinity)) best.set(syllable, cost);
  };

  // A trailing "h" is almost always just vowel-lengthening ("lah", "yeh", "joh").
  const variants: [string, number][] = [[text, 0]];
  if (/[aeiou]h$/.test(text)) variants.push([text.slice(0, -1), 0.05]);

  for (const [v, extra] of variants) {
    for (let split = 0; split <= v.length; split++) {
      const initials = INITIAL_SPELLINGS[v.slice(0, split)];
      const finals = FINAL_SPELLINGS[v.slice(split)];
      if (!initials || !finals) continue;
      for (const [ini, ci] of initials) {
        for (const [fin, cf] of finals) consider(ini + fin, ci + cf + extra);
      }
    }
  }

  // Typo fallback: one edit away from a real syllable.
  if (best.size === 0 && text.length >= 3) {
    for (const s of syllables) {
      if (Math.abs(s.length - text.length) <= 1 && levenshtein(s, text) === 1) consider(s, 1.3);
    }
  }

  const result = [...best]
    .map(([syllable, cost]) => ({ syllable, cost }))
    .sort((a, b) => a.cost - b.cost)
    .slice(0, 12);
  syllableCache.set(text, result);
  return result;
}

type Piece = { text: string; tone: number | null };

/** "nei5hou2 ma" -> [{nei,5},{hou,2},{ma,null}] — digits and spaces are hard syllable boundaries. */
function toPieces(query: string): Piece[] {
  const pieces: Piece[] = [];
  const cleaned = query.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ");
  for (const token of cleaned.split(" ").filter(Boolean)) {
    for (const m of token.matchAll(/([a-z]+)([1-6])?/g)) {
      pieces.push({ text: m[1], tone: m[2] ? Number(m[2]) : null });
    }
  }
  return pieces;
}

type State = { seq: string[]; tones: (number | null)[]; cost: number };

const BEAM = 40;
const PER_SYLLABLE = 0.1;

/** Find the most likely syllable sequences for a typed query. */
function segment(pieces: Piece[]): State[] {
  const { prefixes } = getIndex();
  let states: State[] = [{ seq: [], tones: [], cost: 0 }];

  for (const piece of pieces) {
    // Within a piece we may split into several syllables ("mgoi" -> m + goi).
    // positions[i] = states that have consumed piece.text[0..i)
    const positions: State[][] = Array.from({ length: piece.text.length + 1 }, () => []);
    positions[0] = states;
    for (let i = 0; i < piece.text.length; i++) {
      const here = positions[i];
      if (here.length === 0) continue;
      for (let len = 1; len <= MAX_SPELLING && i + len <= piece.text.length; len++) {
        const matches = matchSyllable(piece.text.slice(i, i + len));
        if (matches.length === 0) continue;
        const end = i + len === piece.text.length;
        for (const st of here) {
          for (const m of matches) {
            const seq = [...st.seq, m.syllable];
            if (!prefixes.has(seq.join(" "))) continue;
            positions[i + len].push({
              seq,
              tones: [...st.tones, end ? piece.tone : null],
              cost: st.cost + m.cost + PER_SYLLABLE,
            });
          }
        }
      }
      // Keep the beam small at every position.
      for (let j = i + 1; j <= piece.text.length; j++) {
        if (positions[j].length > BEAM) {
          positions[j].sort((a, b) => a.cost - b.cost);
          positions[j].length = BEAM;
        }
      }
    }
    states = positions[piece.text.length];
    if (states.length === 0) return [];
  }
  return states.sort((a, b) => a.cost - b.cost);
}

function toneMismatch(entry: Entry, tones: (number | null)[]): number {
  let n = 0;
  tones.forEach((t, i) => {
    if (t !== null && entry.tones[i] !== null && entry.tones[i] !== t) n++;
  });
  return n;
}

function keysWithPrefix(sorted: string[], prefix: string, limit: number): string[] {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < prefix) lo = mid + 1;
    else hi = mid;
  }
  const out: string[] = [];
  for (let i = lo; i < sorted.length && out.length < limit && sorted[i].startsWith(prefix); i++) {
    out.push(sorted[i]);
  }
  return out;
}

export type SoundResult = { entry: Entry; score: number; exact: boolean };

export function searchBySound(query: string, limit = 20): SoundResult[] {
  const pieces = toPieces(query);
  if (pieces.length === 0) return [];
  const { byKey, sortedKeys } = getIndex();
  const entries = getEntries();
  const best = new Map<number, SoundResult>();
  const offer = (entry: Entry, score: number, exact: boolean) => {
    const prev = best.get(entry.id);
    if (!prev || score < prev.score) best.set(entry.id, { entry, score, exact });
  };

  const states = segment(pieces);
  for (const st of states) {
    const key = st.seq.join(" ");
    for (const id of byKey.get(key) ?? []) {
      const e = entries[id];
      offer(e, st.cost + e.rankPenalty + toneMismatch(e, st.tones) * 0.6, true);
    }
  }

  // Also suggest longer words that start with the best guesses ("m goi" -> 唔該晒).
  for (const st of states.slice(0, 5)) {
    const key = st.seq.join(" ");
    for (const longer of keysWithPrefix(sortedKeys, key + " ", 60)) {
      const extra = longer.split(" ").length - st.seq.length;
      for (const id of byKey.get(longer) ?? []) {
        const e = entries[id];
        offer(e, st.cost + e.rankPenalty + toneMismatch(e, st.tones) * 0.6 + 1.2 + extra * 0.4, false);
      }
    }
  }

  return [...best.values()].sort((a, b) => a.score - b.score).slice(0, limit);
}
