import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dictionary is read from disk at runtime by the /api route.
  outputFileTracingIncludes: {
    "/api/*": ["./data/dictionary.json.gz"],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
