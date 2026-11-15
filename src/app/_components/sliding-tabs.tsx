"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Segmented control with a sliding pill (transitions.dev "Tabs sliding").
 * The pill's position/width are written from the active tab's measurements;
 * CSS in transitions.css owns the tween.
 */
export function SlidingTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const pill = pillRef.current;
    if (!bar || !pill) return;

    const moveTo = (animate: boolean) => {
      const tab = bar.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!tab) return;
      const apply = () => {
        pill.style.transform = `translateX(${tab.offsetLeft}px)`;
        pill.style.width = `${tab.offsetWidth}px`;
      };
      if (animate) return apply();
      // First paint and resizes: snap into place without animating.
      const prev = pill.style.transition;
      pill.style.transition = "none";
      apply();
      void pill.offsetWidth;
      pill.style.transition = prev;
    };

    moveTo(placed.current);
    placed.current = true;

    const observer = new ResizeObserver(() => moveTo(false));
    observer.observe(bar);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={barRef} role="tablist" className="t-tabs">
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className="t-tab text-sm font-medium"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
