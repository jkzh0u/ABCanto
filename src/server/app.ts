import { Hono } from "hono";
import { logger } from "hono/logger";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

// All API routes live under /api and are served by src/app/api/[[...route]]/route.ts.
// Chain route definitions so `AppType` captures every route for the typed client.
const app = new Hono()
  .basePath("/api")
  .use(logger())
  .get("/health", (c) => c.json({ ok: true, time: new Date().toISOString() }))
  .get(
    "/hello",
    zValidator("query", z.object({ name: z.string().min(1).default("world") })),
    (c) => {
      const { name } = c.req.valid("query");
      return c.json({ message: `Hello, ${name}!` });
    },
  );

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export type AppType = typeof app;
export default app;
