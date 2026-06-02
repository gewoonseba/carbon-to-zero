"use client";

import { useEffect, useRef, useState } from "react";

export interface Size {
  width: number;
  height: number;
}

/**
 * Tracks an element's content-box size via ResizeObserver. Width is `0` until
 * the first measurement, which lets charts defer drawing until they know their
 * real dimensions (avoids SSR/responsive guesswork).
 */
export function useMeasure<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, ...size };
}
