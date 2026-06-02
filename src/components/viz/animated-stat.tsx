"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { useVizConfig } from "./viz-config";

/**
 * Counts up to `value` once scrolled into view (cubic ease-out). Honours the
 * global "animate" toggle and reduced-motion preferences.
 */
export function AnimatedStat({
  value,
  format,
  duration = 1600,
  className,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const { config } = useVizConfig();
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.5 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // With animation disabled, show the final value immediately — there's no
    // reason to gate on visibility when nothing is counting up.
    if (!config.animate) {
      const id = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(id);
    }
    if (!inView) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, config.animate]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
