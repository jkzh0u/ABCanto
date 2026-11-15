"""
Export word and character frequencies from HKCanCor (Hong Kong Cantonese Corpus,
CC BY 4.0, via the pycantonese package) to data/frequency.json.

Spoken-Cantonese frequencies let the search rank common words (你好, 唔該) above
rare dictionary entries that happen to sound the same.

Usage:
  python3 -m venv .venv && .venv/bin/pip install pycantonese
  .venv/bin/python scripts/hkcancor-frequency.py
Then rebuild the dictionary: npm run dict:build
"""

import collections
import json
import pathlib
import re

import pycantonese

HAN = re.compile(r"^[㐀-鿿\U00020000-\U0002ffff]+$")

def main():
    words = collections.Counter(w for w in pycantonese.hkcancor().words() if HAN.match(w))
    chars = collections.Counter()
    for w, n in words.items():
        for ch in w:
            chars[ch] += n

    out = pathlib.Path(__file__).resolve().parent.parent / "data" / "frequency.json"
    out.write_text(
        json.dumps(
            {
                "source": "HKCanCor via pycantonese (CC BY 4.0)",
                "words": dict(words.most_common()),
                "chars": dict(chars.most_common()),
            },
            ensure_ascii=False,
            separators=(",", ":"),
        )
    )
    print(f"Wrote {len(words)} words, {len(chars)} chars to {out}")


# pycantonese parses the corpus with multiprocessing, which needs the main guard.
if __name__ == "__main__":
    main()
