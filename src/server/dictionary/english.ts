import { getEntries, type Entry } from "./data";
import { FILLER, STOPWORDS, core, tokenize } from "./text";

/**
 * "I know what it means" search: English words -> entries whose definitions match.
 */

type Sense = { full: string[]; segments: string[][]; position: number };

type EnglishIndex = {
  postings: Map<string, number[]>;
  senses: Sense[][];
  idf: Map<string, number>;
};

let index: EnglishIndex | null = null;

function getIndex(): EnglishIndex {
  if (index) return index;
  const entries = getEntries();
  const postings = new Map<string, number[]>();
  const senses: Sense[][] = [];
  for (const e of entries) {
    const list: Sense[] = [];
    const seen = new Set<string>();
    e.definitions.forEach((d, position) => {
      if (/^Mandarin equivalent/i.test(d)) return;
      const full = tokenize(d);
      list.push({ full, segments: d.split(/[;,]/).map(core).filter((s) => s.length), position });
      for (const t of full) {
        if (seen.has(t)) continue;
        seen.add(t);
        const p = postings.get(t);
        if (p) p.push(e.id);
        else postings.set(t, [e.id]);
      }
    });
    senses.push(list);
  }
  const idf = new Map<string, number>();
  for (const [t, p] of postings) idf.set(t, Math.log(entries.length / p.length));
  return (index = { postings, senses, idf });
}

const sameTokens = (a: string[], b: string[]) => a.length === b.length && a.every((t, i) => t === b[i]);

function containsPhrase(haystack: string[], needle: string[]): boolean {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

/** How well does a single sense match? Lower is better. */
function senseCost(sense: Sense, queryCore: string[], queryAll: string[], senseCount: number): number {
  let cost: number;
  const queryGist = queryCore.filter((t) => !FILLER.has(t));
  if (sense.segments.some((s) => sameTokens(s, queryCore))) {
    cost = sense.segments.length === 1 ? 0 : 0.2;
  } else if (queryGist.length && sense.segments.some((s) => sameTokens(s.filter((t) => !FILLER.has(t)), queryGist))) {
    cost = 0.4;
  } else if (containsPhrase(sense.full, queryAll)) {
    cost = 0.8 + Math.min(0.6, (sense.full.length - queryAll.length) * 0.05);
  } else {
    cost = 2;
  }
  // A match deep in a long list of senses (common for single characters) is a weak signal.
  return cost + Math.min(1.2, sense.position * 0.08) + Math.log2(senseCount) * 0.12;
}

export type EnglishResult = { entry: Entry; score: number };

export function searchByEnglish(query: string, limit = 20): EnglishResult[] {
  const { postings, senses, idf } = getIndex();
  const entries = getEntries();
  const queryAll = tokenize(query);
  if (queryAll.length === 0) return [];
  const queryCore = core(query);
  const meaningful = queryAll.filter((t) => !STOPWORDS.has(t) && !FILLER.has(t));
  const terms = [...new Set(meaningful.length ? meaningful : queryAll)];
  const totalWeight = terms.reduce((sum, t) => sum + (idf.get(t) ?? 0), 0);
  if (totalWeight === 0) return [];

  // Weighted coverage: rare words ("thank") matter more than common ones ("you").
  const coverage = new Map<number, number>();
  for (const t of terms) {
    const w = idf.get(t) ?? 0;
    for (const id of postings.get(t) ?? []) coverage.set(id, (coverage.get(id) ?? 0) + w);
  }

  const results: EnglishResult[] = [];
  for (const [id, weight] of coverage) {
    const frac = weight / totalWeight;
    if (frac < 0.5) continue;
    const e = entries[id];
    const list = senses[id];
    const best = Math.min(...list.map((s) => senseCost(s, queryCore, queryAll, list.length)));
    // Short headwords are more likely to be "the word" for a concept.
    const lengthPenalty = Math.max(0, e.traditional.length - 2) * 0.15;
    // Match quality dominates; popularity breaks ties between good matches.
    results.push({ entry: e, score: best * 1.5 + (1 - frac) * 2.5 + e.rankPenalty * 0.6 + lengthPenalty });
  }
  return results.sort((a, b) => a.score - b.score).slice(0, limit);
}
