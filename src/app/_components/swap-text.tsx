"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const SWAP_MS = 150; // matches --text-swap-dur

/**
 * Text that swaps in place with a blurred up-and-down motion when it changes
 * (transitions.dev "Text states swap"): old text exits up, new text enters from below.
 */
export function SwapText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);

  // Phase 1: the old text exits, then the new text is swapped in.
  useEffect(() => {
    if (text === shown) return;
    ref.current?.classList.add("is-exit");
    const timer = setTimeout(() => setShown(text), SWAP_MS);
    return () => clearTimeout(timer);
  }, [text, shown]);

  // Phases 2 and 3: jump below without a transition, reflow, then animate to rest.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el?.classList.contains("is-exit")) return;
    el.classList.remove("is-exit");
    el.classList.add("is-enter-start");
    void el.offsetHeight;
    el.classList.remove("is-enter-start");
  }, [shown]);

  return (
    <span ref={ref} className={`t-text-swap ${className ?? ""}`} aria-live="polite">
      {shown}
    </span>
  );
}
