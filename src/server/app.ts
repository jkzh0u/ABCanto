import { Hono } from "hono";
import { logger } from "hono/logger";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { search, searchSoundAndLiteral } from "./dictionary";

// All API routes live under /api and are served by src/app/api/[[...route]]/route.ts.
// Chain route definitions so `AppType` captures every route for the typed client.
const app = new Hono()
  .basePath("/api")
  .use(logger())
  .get("/health", (c) => c.json({ ok: true, time: new Date().toISOString() }))
  .get(
    "/search",
    zValidator(
      "query",
      z.object({
        q: z.string().trim().min(1).max(100),
        // english: "I know what it means"; sound: "I know how it sounds"
        mode: z.enum(["english", "sound"]).default("sound"),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      }),
    ),
    (c) => {
      const { q, mode, limit } = c.req.valid("query");
      return c.json({ query: q, mode, results: search(q, mode, limit) });
    },
  )
  .get(
    "/literal",
    zValidator(
      "query",
      z.object({
        // how it sounds, e.g. "yeet hay" — optional, but makes results much more precise
        sound: z.string().trim().max(100).default(""),
        // word-by-word meaning of the characters, e.g. "hot air"
        meaning: z.string().trim().min(1).max(100),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      }),
    ),
    (c) => {
      const { sound, meaning, limit } = c.req.valid("query");
      return c.json({ sound, meaning, results: searchSoundAndLiteral(sound, meaning, limit) });
    },
  );

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export type AppType = typeof app;
export default app;
