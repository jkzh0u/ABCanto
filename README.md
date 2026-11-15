# ABCanto

Find the Cantonese word, either from **what it means** (English → Cantonese) or from
**how it sounds** (type it however you'd spell it: `m goi`, `lei ho`, `mo yeh`).

Next.js frontend, with a [Hono](https://hono.dev) API mounted at `/api`.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
```

API:
- `GET /api/search?q=lei%20ho&mode=sound`: `mode` is `sound` or `english`; characters work in either.
- `GET /api/literal?sound=fay%20gay&meaning=flying%20machine`: `meaning` is required, `sound` is optional but makes results more precise.

## How search works

- **Sound** ([src/server/dictionary/sound.ts](src/server/dictionary/sound.ts)): typed text is split into
  syllables (spaces optional), and each chunk is matched to Jyutping syllables using tables of
  common informal spellings ([jyutping.ts](src/server/dictionary/jyutping.ts)): n/l merger, dropped
  "ng", `j`/`ch`/`ts` for z/c, `ee`/`oo`/`eung`, and so on. Candidate sequences are pruned
  against the dictionary as they're built. Tones are optional (`nei5 hou2` works too).
- **English** ([english.ts](src/server/dictionary/english.ts)): an inverted index over definitions, with
  exact gloss matches ranked above partial ones.
- **Literal** ([literal.ts](src/server/dictionary/literal.ts)): matches a word-by-word translation to
  each character's own meaning, using the character's reading in that word. "flying machine" →
  飛 fly + 機 machine → 飛機. The Literal translation tab needs the meaning; adding how
  it sounds re-ranks the results. English search also picks up literal matches.
- **Ranking** ([data.ts](src/server/dictionary/data.ts)): match quality, then how common the word is in
  spoken Cantonese (HKCanCor), with a boost for Cantonese-specific entries.

## Dictionary data

`data/dictionary.json.gz` is generated and committed. To rebuild it:

```bash
npm run dict:build   # downloads sources into data/raw (gitignored), writes data/dictionary.json.gz
```

`data/frequency.json` comes from HKCanCor. Regenerate it with `scripts/hkcancor-frequency.py`
(needs `pip install pycantonese`), then rerun `dict:build`.

Sources: [CC-Canto](https://cantonese.org) and [CC-CEDICT](https://cc-cedict.org) with
Cantonese readings (CC BY-SA 3.0), and HKCanCor via [PyCantonese](https://pycantonese.org) (CC BY 4.0).

## Embed

`/embed` is a compact version of the search for putting on another site:

```html
<iframe
  src="https://YOUR-ABCANTO-HOST/embed"
  title="ABCanto: find the Cantonese word"
  loading="lazy"
  style="width: 100%; max-width: 720px; height: 560px; border: 0; border-radius: 6px"
></iframe>
```

Add `?theme=light` or `?theme=dark` to the URL to match the host page; otherwise it follows the system theme. It shows the top 5 results, doesn't grab focus on load, and links to the full site.

## Docker

Every push to `main` builds the image and publishes it to GitHub Container Registry as `:latest` via [.github/workflows/deploy.yml](.github/workflows/deploy.yml). It then redeploys the Portainer stack ([docker-compose.yml](docker-compose.yml)) with a fresh pull. That step needs the `PORTAINER_URL` and `PORTAINER_API_KEY` secrets and the `PORTAINER_STACK_ID` variable. To run the image yourself:

```bash
docker run -p 3000:3000 ghcr.io/jkzh0u/abcanto:latest
```

To build locally: `docker build -t abcanto . && docker run -p 3000:3000 abcanto`.
