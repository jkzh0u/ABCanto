import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image (.next/standalone/server.js).
  output: "standalone",
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
