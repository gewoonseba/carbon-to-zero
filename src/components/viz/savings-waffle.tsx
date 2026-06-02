"use client";

import { useMemo, useState } from "react";
import type { CustomerSaving } from "@/lib/types";
import { categoryColors } from "@/lib/palettes";
import { formatTonnes2, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";
import { useVizConfig } from "./viz-config";

const COLS = 10;
const CELL = 10;
const GAP = 2.4;
const SPAN = COLS * CELL + (COLS - 1) * GAP;

/** Largest-remainder rounding so the square counts sum to exactly 100. */
function allocate(values: number[], total = 100): number[] {
  const sum = values.reduce((s, v) => s + v, 0);
  const exact = values.map((v) => (v / sum) * total);
  const floors = exact.map(Math.floor);
  let remaining = total - floors.reduce((s, v) => s + v, 0);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const counts = [...floors];
  for (let k = 0; k < order.length && remaining > 0; k++, remaining--) {
    counts[order[k].i] += 1;
  }
  return counts;
}

export function SavingsWaffle({ data }: { data: CustomerSaving[] }) {
  const { palette, config } = useVizConfig();
  const { ref, inView } = useInView<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.savedKg - a.savedKg),
    [data],
  );

  const totalKg = useMemo(
    () => sorted.reduce((s, c) => s + c.savedKg, 0),
    [sorted],
  );
  const share = (c: CustomerSaving) => (c.savedKg / totalKg) * 100;

  // Colour by asset profile (the "group"); customers within a profile share it.
  const groupColors = useMemo(() => {
    const groups = [...new Set(sorted.map((s) => s.profileLabel))];
    return categoryColors(palette, groups);
  }, [palette, sorted]);

  // cell index → customer index, filled customer-by-customer
  const cells = useMemo(() => {
    const counts = allocate(sorted.map((s) => s.savedKg));
    const arr: number[] = [];
    counts.forEach((n, si) => {
      for (let k = 0; k < n; k++) arr.push(si);
    });
    return arr.slice(0, 100);
  }, [sorted]);

  const maxShare = share(sorted[0]) || 1;
  const animate = config.animate && inView;

  return (
    <div
      ref={ref}
      className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
    >
      {/* waffle */}
      <div className="mx-auto w-full max-w-[440px]">
        <svg
          viewBox={`0 0 ${SPAN} ${SPAN}`}
          className="w-full"
          role="img"
          aria-label="Waffle chart: each square is one percent of all CO₂ saved, coloured by asset profile"
        >
          {cells.map((si, i) => {
            const row = Math.floor(i / COLS);
            const col = i % COLS;
            const customer = sorted[si];
            const dim = active != null && active !== si;
            return (
              <rect
                key={i}
                x={col * (CELL + GAP)}
                y={row * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2.2}
                fill={groupColors.get(customer.profileLabel)}
                style={{
                  opacity: dim ? 0.16 : animate ? 1 : config.animate ? 0 : 1,
                  transform: animate || !config.animate ? "scale(1)" : "scale(0.5)",
                  transformOrigin: `${col * (CELL + GAP) + CELL / 2}px ${
                    row * (CELL + GAP) + CELL / 2
                  }px`,
                  transition: config.animate
                    ? `opacity 0.4s ease ${i * 9}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 9}ms`
                    : "opacity 0.2s ease",
                }}
                onMouseEnter={() => setActive(si)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
        </svg>
      </div>

      {/* customer list */}
      <ul className="flex flex-col gap-1">
        {sorted.map((c, si) => {
          const isActive = active === si;
          return (
            <li
              key={c.id}
              onMouseEnter={() => setActive(si)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]",
              )}
            >
              <span
                className="size-3 shrink-0 rounded-[3px]"
                style={{ background: groupColors.get(c.profileLabel) }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-sm text-foreground/90">
                      {c.name}
                    </span>
                    <span className="hidden shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/55 sm:inline">
                      {c.profileLabel}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-sm font-semibold text-foreground">
                    {formatPercent(share(c))}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: groupColors.get(c.profileLabel),
                      width: animate ? `${(share(c) / maxShare) * 100}%` : "0%",
                      transition: config.animate
                        ? `width 0.9s cubic-bezier(0.16,1,0.3,1) ${si * 50}ms`
                        : undefined,
                    }}
                  />
                </div>
              </div>
              {config.showValues && (
                <span className="tabular hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {formatTonnes2(c.savedTonnes)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
