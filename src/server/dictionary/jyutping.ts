/**
 * Jyutping syllable structure plus tables of how people actually spell
 * Cantonese sounds when typing "how it sounds" in English letters.
 *
 * Each table maps a user spelling -> list of [jyutping part, cost].
 * Cost 0 is a perfect/standard spelling; higher costs are looser guesses.
 */

export const INITIALS = [
  "", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "ng", "h", "gw", "kw", "w", "z", "c", "s", "j",
] as const;

export const FINALS = [
  "aa", "aai", "aau", "aam", "aan", "aang", "aap", "aat", "aak",
  "a", "ai", "au", "am", "an", "ang", "ap", "at", "ak",
  "e", "ei", "eu", "em", "en", "eng", "ep", "et", "ek",
  "i", "iu", "im", "in", "ing", "ip", "it", "ik",
  "o", "oi", "ou", "on", "ong", "ot", "ok",
  "u", "ui", "un", "ung", "ut", "uk",
  "oe", "oeng", "oet", "oek", "eoi", "eon", "eot",
  "yu", "yun", "yut",
  "m", "ng",
] as const;

const SYLLABLE = new RegExp(
  `^(${[...INITIALS].filter(Boolean).sort((a, b) => b.length - a.length).join("|")})?` +
    `(${[...FINALS].sort((a, b) => b.length - a.length).join("|")})([1-6])?$`,
);

/** Split a Jyutping syllable like "goi1" into parts, or null if it isn't one. */
export function parseSyllable(s: string): { initial: string; final: string; tone: number | null } | null {
  const m = SYLLABLE.exec(s);
  if (!m) return null;
  const initial = m[1] ?? "";
  const final = m[2];
  // Syllabic nasals (m, ng) only stand alone.
  if ((final === "m" || final === "ng") && initial) return null;
  return { initial, final, tone: m[3] ? Number(m[3]) : null };
}

type Table = Record<string, [string, number][]>;

function addAll(table: Table, spelling: string, target: string, cost: number) {
  const list = (table[spelling] ??= []);
  const existing = list.find(([t]) => t === target);
  if (existing) existing[1] = Math.min(existing[1], cost);
  else list.push([target, cost]);
}

/** user spelling -> jyutping initial */
export const INITIAL_SPELLINGS: Table = (() => {
  const t: Table = {};
  for (const i of INITIALS) addAll(t, i, i, 0);
  const loose: [string, string, number][] = [
    // n/l merger: most speakers say "lei" for 你 (nei5)
    ["l", "n", 0.1], ["n", "l", 0.1],
    // dropped ng: "o" for 我 (ngo5); and the reverse
    ["", "ng", 0.3], ["ng", "", 0.4],
    // aspirated vs unaspirated is hard to hear for English speakers
    ["b", "p", 0.8], ["p", "b", 0.8], ["d", "t", 0.8], ["t", "d", 0.8],
    ["g", "k", 0.8], ["k", "g", 0.8], ["c", "k", 0.6], ["ck", "k", 0.5],
    ["gw", "g", 0.4], ["g", "gw", 0.5], ["kw", "k", 0.4], ["k", "kw", 0.5], ["qu", "kw", 0.3], ["q", "kw", 0.6],
    ["gu", "gw", 0.6], ["ku", "kw", 0.6],
    // Jyutping z/c/j are spelled every which way
    ["j", "z", 0.1], ["j", "j", 0.2], ["dz", "z", 0.2], ["ts", "c", 0.2], ["ch", "c", 0.1], ["ch", "z", 0.4],
    ["z", "c", 0.6], ["c", "z", 0.6], ["ts", "z", 0.5], ["tz", "z", 0.3], ["zh", "z", 0.3], ["tsz", "z", 0.4],
    ["y", "j", 0], ["y", "", 0.5], ["i", "j", 0.6],
    ["sh", "s", 0.2], ["x", "s", 0.6], ["ss", "s", 0.3],
    ["w", "", 0.6], ["wh", "w", 0.3], ["v", "w", 0.8], ["r", "l", 0.8],
    ["", "j", 0.5], ["", "w", 0.5], ["", "h", 0.6], ["h", "", 0.5],
  ];
  for (const [s, j, c] of loose) addAll(t, s, j, c);
  return t;
})();

/** user spelling -> jyutping final */
export const FINAL_SPELLINGS: Table = (() => {
  const t: Table = {};
  for (const f of FINALS) addAll(t, f, f, 0);
  const loose: [string, string, number][] = [
    // long aa
    ["a", "aa", 0.1], ["ah", "aa", 0.1], ["ar", "aa", 0.3],
    ["ai", "aai", 0.2], ["ie", "aai", 0.7], ["y", "aai", 0.8], ["ye", "aai", 0.8],
    ["au", "aau", 0.2], ["ow", "aau", 0.4], ["ao", "aau", 0.4],
    ["am", "aam", 0.2], ["an", "aan", 0.2], ["ang", "aang", 0.2],
    ["ap", "aap", 0.2], ["at", "aat", 0.2], ["ak", "aak", 0.2], ["ack", "aak", 0.4],
    // short a, often written with u in English ("sum", "gum", "sun")
    ["ow", "au", 0.4], ["ao", "au", 0.5], ["ou", "au", 0.7],
    ["um", "am", 0.3], ["un", "an", 0.4], ["ung", "ang", 0.7], ["up", "ap", 0.4], ["ut", "at", 0.5],
    ["uk", "ak", 0.7], ["ack", "ak", 0.3], ["uck", "ak", 0.5], ["ei", "ai", 0.8],
    // e / ei
    ["eh", "e", 0.1], ["ea", "e", 0.6], ["ay", "e", 0.7],
    ["ay", "ei", 0.2], ["ey", "ei", 0.2], ["ai", "ei", 0.8], ["i", "ei", 0.6], ["ee", "ei", 0.7], ["eih", "ei", 0.2],
    ["eng", "eng", 0], ["eang", "eng", 0.3], ["ek", "ek", 0], ["eck", "ek", 0.3], ["ehk", "ek", 0.3],
    ["ew", "eu", 0.4],
    // i
    ["ee", "i", 0.1], ["ea", "i", 0.4], ["ie", "i", 0.5], ["y", "i", 0.4], ["ii", "i", 0.3],
    ["ew", "iu", 0.2], ["eu", "iu", 0.3], ["iew", "iu", 0.3], ["eeu", "iu", 0.3], ["io", "iu", 0.6],
    ["eem", "im", 0.2], ["een", "in", 0.2], ["eep", "ip", 0.2], ["eet", "it", 0.2],
    ["ick", "ik", 0.2], ["eek", "ik", 0.3], ["ek", "ik", 0.3], ["eng", "ing", 0.4], ["eeng", "ing", 0.3],
    // o / ou
    ["oh", "o", 0.1], ["or", "o", 0.2], ["aw", "o", 0.3], ["awe", "o", 0.4],
    ["o", "ou", 0.2], ["oh", "ou", 0.4], ["ow", "ou", 0.5], ["oe", "ou", 0.4], ["oa", "ou", 0.5], ["u", "ou", 0.8],
    ["oy", "oi", 0.1], ["oey", "oi", 0.3], ["oei", "oi", 0.4],
    ["ong", "ong", 0], ["orng", "ong", 0.3], ["ock", "ok", 0.2], ["ork", "ok", 0.3], ["ot", "ot", 0],
    // u
    ["oo", "u", 0.1], ["ooi", "ui", 0.1], ["ooy", "ui", 0.3], ["ooey", "ui", 0.3], ["ui", "ui", 0],
    ["oon", "un", 0.2], ["oot", "ut", 0.2], ["ook", "uk", 0.1], ["ok", "uk", 0.4], ["uk", "uk", 0],
    ["oong", "ung", 0.2], ["ong", "ung", 0.3], ["ung", "ung", 0],
    // oe / eo
    ["eung", "oeng", 0.1], ["eong", "oeng", 0.2], ["oeung", "oeng", 0.2], ["erng", "oeng", 0.4], ["ung", "oeng", 0.8],
    ["euk", "oek", 0.1], ["eok", "oek", 0.2], ["erk", "oek", 0.4], ["er", "oe", 0.3], ["eu", "oe", 0.5],
    ["eui", "eoi", 0.1], ["ui", "eoi", 0.2], ["oi", "eoi", 0.6], ["ue", "eoi", 0.5], ["uy", "eoi", 0.4], ["oy", "eoi", 0.6],
    ["eun", "eon", 0.2], ["un", "eon", 0.2], ["en", "eon", 0.7],
    ["eut", "eot", 0.2], ["ut", "eot", 0.3], ["ot", "eot", 0.7],
    // yu (after s, z, c, j, h, ...)
    ["u", "yu", 0.3], ["ue", "yu", 0.2], ["ew", "yu", 0.5], ["oo", "yu", 0.6], ["ui", "yu", 0.8],
    ["uen", "yun", 0.1], ["un", "yun", 0.3], ["uene", "yun", 0.4], ["oon", "yun", 0.6],
    ["uet", "yut", 0.1], ["ut", "yut", 0.3],
    // syllabic nasals: 唔 (m4), 五 (ng5)
    ["mm", "m", 0.1], ["um", "m", 0.4], ["hm", "m", 0.6], ["n", "m", 0.8],
    ["ngh", "ng", 0.2], ["mh", "ng", 0.9],
  ];
  for (const [s, j, c] of loose) addAll(t, s, j, c);
  return t;
})();
