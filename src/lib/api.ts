import { hc } from "hono/client";
import type { AppType } from "@/server/app";

// Type-safe client for the Hono API. Use from client components:
//   const res = await api.api.hello.$get({ query: { name: "Jackson" } });
export const api = hc<AppType>(
  typeof window === "undefined" ? (process.env.APP_URL ?? "http://localhost:3000") : "/",
);
