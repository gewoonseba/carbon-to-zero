"use client";

import { useMemo, useState } from "react";
import type { SectorEmission } from "@/lib/types";
import { categoryColors } from "@/lib/palettes";
import { formatMtRaw, formatPercent } from "@/lib/format";
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

export function SectorWaffle({ data }: { data: SectorEmission[] }) {
  const { palette, config } = useVizConfig();
  const { ref, inView } = useInView<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.share_pct - a.share_pct),
    [data],
  );

  const groupColors = useMemo(() => {
    const groups = [...new Set(sorted.map((s) => s.group))];
    return categoryColors(palette, groups);
  }, [palette, sorted]);

  // cell index → sector index, filled sector-by-sector
  const cells = useMemo(() => {
    const counts = allocate(sorted.map((s) => s.share_pct));
    const arr: number[] = [];
    counts.forEach((n, si) => {
      for (let k = 0; k < n; k++) arr.push(si);
    });
    return arr.slice(0, 100);
  }, [sorted]);

  const maxShare = sorted[0]?.share_pct ?? 1;
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
          aria-label="Waffle chart: each square is one percent of global emissions, coloured by sector group"
        >
          {cells.map((si, i) => {
            const row = Math.floor(i / COLS);
            const col = i % COLS;
            const sector = sorted[si];
            const dim = active != null && active !== si;
            return (
              <rect
                key={i}
                x={col * (CELL + GAP)}
                y={row * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2.2}
                fill={groupColors.get(sector.group)}
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

      {/* sector list */}
      <ul className="flex flex-col gap-1">
        {sorted.map((s, si) => {
          const isActive = active === si;
          return (
            <li
              key={s.sector}
              onMouseEnter={() => setActive(si)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]",
              )}
            >
              <span
                className="size-3 shrink-0 rounded-[3px]"
                style={{ background: groupColors.get(s.group) }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-sm text-foreground/90">
                      {s.sector}
                    </span>
                    <span className="hidden shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/55 sm:inline">
                      {s.group}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-sm font-semibold text-foreground">
                    {formatPercent(s.share_pct)}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: groupColors.get(s.group),
                      width: animate ? `${(s.share_pct / maxShare) * 100}%` : "0%",
                      transition: config.animate
                        ? `width 0.9s cubic-bezier(0.16,1,0.3,1) ${si * 50}ms`
                        : undefined,
                    }}
                  />
                </div>
              </div>
              {config.showValues && (
                <span className="tabular hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {formatMtRaw(s.co2_mt)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
