/** English text helpers shared by the meaning and literal searches. */

export const STOPWORDS = new Set([
  "to", "a", "an", "the", "of", "for", "in", "on", "at", "or", "and", "is", "be", "sb", "sth",
]);

/** Words that rarely change the meaning of a gloss: "thank you" ~ "thanks". */
export const FILLER = new Set(["you", "me", "it", "one", "someone", "something", "oneself", "very", "really"]);

/**
 * Very light stemmer so "thanks" finds "thank" and "flying" finds "fly".
 * It only has to be consistent: queries and definitions go through the same function.
 */
export function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 4 && /(s|x|ch|sh)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 5 && word.endsWith("ing")) return undouble(word.slice(0, -3));
  if (word.length > 4 && word.endsWith("ed") && !word.endsWith("eed")) return undouble(word.slice(0, -2));
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** "runn" -> "run", "stopp" -> "stop" */
function undouble(w: string): string {
  return /([b-df-hj-np-tv-z])\1$/.test(w) && !/(ll|ss|ff|zz)$/.test(w) ? w.slice(0, -1) : w;
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().replace(/'s\b/g, "").match(/[a-z0-9]+/g) ?? []).map(stem);
}

/** Tokens with parentheticals and leading "to"/"a"/"the" removed — the "core" of a sense. */
export function core(text: string): string[] {
  const tokens = tokenize(text.replace(/\([^)]*\)/g, " "));
  while (tokens.length > 1 && STOPWORDS.has(tokens[0])) tokens.shift();
  return tokens;
}

/** The words of a query that carry meaning. */
export function meaningfulTokens(text: string): string[] {
  return tokenize(text).filter((t) => !STOPWORDS.has(t) && !FILLER.has(t));
}
