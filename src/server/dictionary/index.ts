import { getEntries, type Entry } from "./data";
import { searchByEnglish } from "./english";
import { characterBreakdown, literalMatch, searchByLiteral, type CharacterGloss } from "./literal";
import { searchBySound } from "./sound";
import { meaningfulTokens } from "./text";

export type SearchMode = "english" | "sound";
export type { CharacterGloss };

export type SearchResult = {
  id: number;
  traditional: string;
  simplified: string;
  jyutping: string;
  definitions: string[];
  cantonese: boolean;
  /** For sound search: false when this is a longer word that starts with what you typed */
  exact: boolean;
  /** True when the word was found because its characters spell out the literal meaning */
  literal: boolean;
  /** Literal page only: matched the meaning but not the typed sound */
  soundMismatch: boolean;
  /** What each character means on its own (multi-character words only) */
  characters: CharacterGloss[] | null;
};

const HAN = /\p{Script=Han}/u;

function toResult(
  e: Entry,
  opts: { exact?: boolean; literal?: boolean; soundMismatch?: boolean; matches?: Map<number, string> } = {},
): SearchResult {
  return {
    id: e.id,
    traditional: e.traditional,
    simplified: e.simplified,
    jyutping: e.jyutping,
    definitions: e.definitions,
    cantonese: e.cantonese,
    exact: opts.exact ?? true,
    literal: opts.literal ?? false,
    soundMismatch: opts.soundMismatch ?? false,
    characters: characterBreakdown(e, opts.matches),
  };
}

/** Characters typed directly: exact headword matches first, then words containing them. */
function searchByCharacters(query: string, limit: number): SearchResult[] {
  const q = query.replace(/\s+/g, "");
  const exact: Entry[] = [];
  const partial: Entry[] = [];
  for (const e of getEntries()) {
    if (e.traditional === q || e.simplified === q) exact.push(e);
    else if (partial.length < 500 && (e.traditional.includes(q) || e.simplified.includes(q))) partial.push(e);
  }
  const byRank = (a: Entry, b: Entry) =>
    a.rankPenalty + a.traditional.length * 0.3 - (b.rankPenalty + b.traditional.length * 0.3);
  return [
    ...exact.sort(byRank).map((e) => toResult(e)),
    ...partial.sort(byRank).map((e) => toResult(e, { exact: false })),
  ].slice(0, limit);
}

/** Literal matches compete with meaning matches but lose ties to them. */
const LITERAL_OFFSET = 0.3;

function searchEnglish(q: string, limit: number): SearchResult[] {
  const byId = new Map<number, { entry: Entry; score: number; matches?: Map<number, string> }>();
  for (const r of searchByEnglish(q, limit * 2)) byId.set(r.entry.id, { entry: r.entry, score: r.score });
  for (const r of searchByLiteral(q, limit * 2)) {
    const score = r.score + LITERAL_OFFSET;
    const prev = byId.get(r.entry.id);
    if (!prev || score < prev.score) byId.set(r.entry.id, { entry: r.entry, score, matches: r.match.matches });
    else prev.matches = r.match.matches;
  }
  return [...byId.values()]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((r) => toResult(r.entry, { literal: r.matches !== undefined, matches: r.matches }));
}

/**
 * Sound + literal meaning together: "yeet hay" + "hot air" -> 熱氣.
 * Sound candidates are re-ranked by how well their characters spell out the
 * literal meaning; pure literal matches are added in case the spelling was too far off.
 */
export function searchSoundAndLiteral(sound: string, literal: string, limit = 20): SearchResult[] {
  const tokens = meaningfulTokens(literal);
  if (tokens.length === 0) return [];
  if (!sound.trim()) return searchLiteralOnly(literal, limit);

  type Scored = {
    entry: Entry;
    score: number;
    exact: boolean;
    soundMismatch: boolean;
    match: ReturnType<typeof literalMatch>;
  };
  // The meaning is required here, so sound matches that ignore it rank low.
  const NO_MEANING = 2.5;
  const SOUND_MISS = 2;
  const byId = new Map<number, Scored>();
  for (const r of searchBySound(sound, 300)) {
    const match = literalMatch(r.entry, tokens);
    // Each literal word that lines up with a character is strong evidence.
    const adjust = match ? -(match.matched * 2.5 - match.cost * 0.5) : NO_MEANING;
    byId.set(r.entry.id, { entry: r.entry, score: r.score + adjust, exact: r.exact, soundMismatch: false, match });
  }
  // Didn't sound like it, but the characters fit the meaning: keep as a fallback.
  for (const r of searchByLiteral(literal, limit)) {
    if (!byId.has(r.entry.id)) {
      byId.set(r.entry.id, { entry: r.entry, score: r.score + SOUND_MISS, exact: true, soundMismatch: true, match: r.match });
    }
  }

  return [...byId.values()]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((r) =>
      toResult(r.entry, { exact: r.exact, literal: !!r.match, soundMismatch: r.soundMismatch, matches: r.match?.matches }),
    );
}

/**
 * Literal meaning without a sound: words whose characters spell it out come first,
 * then words whose definition matches (covers one-word meanings like "teacher").
 */
function searchLiteralOnly(literal: string, limit: number): SearchResult[] {
  const DEFINITION_OFFSET = 1;
  const byId = new Map<number, { entry: Entry; score: number; matches?: Map<number, string> }>();
  for (const r of searchByLiteral(literal, limit * 2)) {
    byId.set(r.entry.id, { entry: r.entry, score: r.score, matches: r.match.matches });
  }
  for (const r of searchByEnglish(literal, limit * 2)) {
    if (!byId.has(r.entry.id)) byId.set(r.entry.id, { entry: r.entry, score: r.score + DEFINITION_OFFSET });
  }
  return [...byId.values()]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((r) => toResult(r.entry, { literal: r.matches !== undefined, matches: r.matches }));
}

export function search(query: string, mode: SearchMode, limit = 20): SearchResult[] {
  const q = query.trim();
  if (!q) return [];
  if (HAN.test(q)) return searchByCharacters(q, limit);
  if (mode === "english") return searchEnglish(q, limit);
  return searchBySound(q, limit).map((r) => toResult(r.entry, { exact: r.exact }));
}
