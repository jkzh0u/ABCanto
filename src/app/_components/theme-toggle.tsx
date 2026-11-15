"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme";

type Theme = "light" | "dark";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const systemTheme = (): Theme => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

/**
 * Follows the system theme by default. Clicking switches between day (晝) and
 * night (夜); choosing the theme your system already uses goes back to following it.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          if (next === systemTheme()) localStorage.removeItem(THEME_KEY);
          else localStorage.setItem(THEME_KEY, next);
        } catch {
          // Storage may be unavailable (private mode); the theme still applies for this visit.
        }
      }}
      aria-label={next === "dark" ? "Switch to dark theme" : "Switch to light theme"}
      title={next === "dark" ? "Night (dark theme)" : "Day (light theme)"}
      className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-rule-strong text-sm font-bold text-ink-soft transition-colors hover:border-seal hover:text-seal"
      lang="zh-HK"
    >
      {next === "dark" ? "夜" : "晝"}
    </button>
  );
}
