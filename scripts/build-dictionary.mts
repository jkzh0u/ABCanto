/**
 * Builds data/dictionary.json.gz from open Cantonese dictionary sources:
 *   - CC-Canto (Cantonese-specific words)            https://cantonese.org
 *   - CC-CEDICT (general Chinese definitions)         https://cc-cedict.org
 *   - CC-CEDICT Cantonese readings (Jyutping for CEDICT entries)
 * All are licensed CC BY-SA 3.0.
 *
 * Usage: npm run dict:build   (re-downloads sources into data/raw if missing)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { gunzipSync, gzipSync } from "node:zlib";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "data", "dictionary.json.gz");
// Spoken-Cantonese frequencies from HKCanCor (see scripts/hkcancor-frequency.py).
const FREQ = path.join(ROOT, "data", "frequency.json");

const SOURCES = {
  canto: {
    url: "https://cantonese.org/cccanto-170202.zip",
    file: "cccanto-webdist.txt",
  },
  readings: {
    url: "https://cantonese.org/cccedict-canto-readings-150923.zip",
    file: "cccedict-canto-readings-150923.txt",
  },
  cedict: {
    url: "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz",
    file: "cedict_ts.u8",
  },
};

async function download(url: string, dest: string) {
  console.log(`Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function ensureSources() {
  mkdirSync(RAW, { recursive: true });
  for (const { url, file } of Object.values(SOURCES)) {
    const target = path.join(RAW, file);
    if (existsSync(target)) continue;
    const archive = path.join(RAW, path.basename(url));
    await download(url, archive);
    if (archive.endsWith(".zip")) {
      execFileSync("unzip", ["-o", "-q", archive, "-d", RAW]);
    } else if (archive.endsWith(".gz")) {
      writeFileSync(target, gunzipSync(readFileSync(archive)));
    }
    if (!existsSync(target)) throw new Error(`Expected ${target} after extracting ${archive}`);
  }
}

// Line format: TRAD SIMP [pin1 yin1] {jyut6 ping3} /def/def/ # comment
const LINE =
  /^(\S+) (\S+) \[([^\]]*)\](?: \{([^}]*)\})?(?: \/(.*)\/)?\s*(?:#.*)?$/;

type Parsed = {
  trad: string;
  simp: string;
  pinyin: string;
  jyutping: string | null;
  defs: string[];
};

function parseFile(file: string): Parsed[] {
  const out: Parsed[] = [];
  for (const raw of readFileSync(path.join(RAW, file), "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = LINE.exec(line);
    if (!m) continue;
    out.push({
      trad: m[1],
      simp: m[2],
      pinyin: m[3],
      jyutping: m[4] ?? null,
      defs: m[5] ? m[5].split("/").map((d) => d.trim()).filter(Boolean) : [],
    });
  }
  return out;
}

/** Normalise a Jyutping string: lowercase, strip punctuation, resolve changed tones ("dou3*2" -> "dou2"). */
function cleanJyutping(j: string): string {
  return j
    .normalize("NFKC")
    .toLowerCase()
    .replace(/([a-z]+)\d\*(\d)/g, "$1$2")
    .replace(/(\d)(?=[a-z])/g, "$1 ")
    .replace(/[^a-z0-6 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

function cleanDefs(defs: string[]): string[] {
  return defs.filter((d) => !/^CL:/.test(d) && !/^Taiwan pr\./.test(d));
}

const pinyinKey = (p: string) => p.toLowerCase().replace(/[^a-z0-9]/g, "");

type Entry = {
  trad: string;
  simp: string;
  jyutping: string;
  defs: string[];
  canto: boolean;
  proper: boolean;
};

async function main() {
  await ensureSources();

  const cedict = new Map<string, Parsed[]>();
  for (const e of parseFile(SOURCES.cedict.file)) {
    const key = `${e.trad}|${e.simp}`;
    const list = cedict.get(key) ?? [];
    list.push(e);
    cedict.set(key, list);
  }

  const entries = new Map<string, Entry>();
  const add = (p: Parsed, defs: string[], canto: boolean) => {
    if (!p.jyutping) return;
    const jyutping = cleanJyutping(p.jyutping);
    const cleaned = cleanDefs(defs);
    if (!jyutping || cleaned.length === 0) return;
    const key = `${p.trad}|${jyutping}`;
    const existing = entries.get(key);
    const proper = /^[A-Z]/.test(p.pinyin.trim());
    if (existing) {
      const fresh = cleaned.filter((d) => !existing.defs.includes(d));
      // For single characters, CC-CEDICT's first sense is the core meaning (電 "electric"),
      // while CC-Canto often leads with slang senses, so general definitions go first.
      if (!canto && !proper && [...p.trad].length === 1) {
        existing.defs = [...cleaned, ...existing.defs.filter((d) => !cleaned.includes(d))];
      } else existing.defs.push(...fresh);
      existing.canto ||= canto;
      existing.proper &&= proper;
    } else {
      entries.set(key, { trad: p.trad, simp: p.simp, jyutping, defs: [...cleaned], canto, proper });
    }
  };

  // CC-Canto first so its Cantonese-specific senses lead the definition list.
  const canto = parseFile(SOURCES.canto.file);
  for (const e of canto) add(e, e.defs, true);

  // CEDICT definitions joined with their Cantonese readings.
  let unmatched = 0;
  for (const r of parseFile(SOURCES.readings.file)) {
    const candidates = cedict.get(`${r.trad}|${r.simp}`);
    if (!candidates) {
      unmatched++;
      continue;
    }
    const exact = candidates.filter((c) => pinyinKey(c.pinyin) === pinyinKey(r.pinyin));
    for (const c of exact.length ? exact : candidates) add({ ...c, jyutping: r.jyutping }, c.defs, false);
  }

  const freq = JSON.parse(readFileSync(FREQ, "utf8")) as {
    words: Record<string, number>;
    chars: Record<string, number>;
  };

  // Row: [trad, simp, jyutping, defs, flags, wordFreq, minCharFreq]
  const rows = [...entries.values()].map((e) => [
    e.trad,
    e.simp,
    e.jyutping,
    e.defs,
    (e.canto ? 1 : 0) | (e.proper ? 2 : 0),
    freq.words[e.trad] ?? 0,
    Math.min(...[...e.trad].map((ch) => freq.chars[ch] ?? 0)),
  ]);

  const json = JSON.stringify({
    builtAt: new Date().toISOString(),
    license: "CC BY-SA 3.0 — CC-Canto, CC-CEDICT and CC-CEDICT Cantonese readings; frequencies from HKCanCor (CC BY 4.0)",
    entries: rows,
  });
  writeFileSync(OUT, gzipSync(json, { level: 9 }));
  console.log(
    `Wrote ${rows.length} entries (${canto.length} CC-Canto lines, ${unmatched} unmatched readings) to ${path.relative(ROOT, OUT)} (${(readFileSync(OUT).length / 1e6).toFixed(1)} MB)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
