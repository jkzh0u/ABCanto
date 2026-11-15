"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { SearchMode, SearchResult } from "@/server/dictionary";

export type SearchRequest =
  | { endpoint: "search"; query: { q: string; mode: SearchMode; limit?: string } }
  | { endpoint: "literal"; query: { meaning: string; sound?: string; limit?: string } };

async function run(req: SearchRequest) {
  const res =
    req.endpoint === "search"
      ? await api.api.search.$get({ query: req.query })
      : await api.api.literal.$get({ query: req.query });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return (await res.json()).results as SearchResult[];
}

/** Debounced search-as-you-type. Pass null when there's nothing to search yet. */
export function useLiveSearch(req: SearchRequest | null) {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  // A string key keeps the effect from re-running on every render.
  const key = req ? JSON.stringify(req) : null;

  useEffect(() => {
    if (!key) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await run(JSON.parse(key) as SearchRequest);
        if (id !== requestId.current) return;
        setResults(found);
        setError(null);
      } catch (err) {
        if (id === requestId.current) setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [key]);

  // Nothing to search: don't show stale results.
  return key ? { results, loading, error } : { results: null, loading: false, error: null };
}
