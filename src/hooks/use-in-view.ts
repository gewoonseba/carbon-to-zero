"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reports whether an element has scrolled into view. Once it has, it stays
 * `true` (used to fire entrance animations a single time).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: { rootMargin?: string; threshold?: number } = {},
) {
  const { rootMargin = "0px 0px -12% 0px", threshold = 0.2 } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold]);

  return { ref, inView };
}
