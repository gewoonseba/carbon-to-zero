"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useMeasure } from "@/hooks/use-measure";
import { useInView } from "@/hooks/use-in-view";

/* -------------------------------------------------------------------------- */
/* ChartFrame — responsive, self-measuring container with a scroll reveal.    */
/* -------------------------------------------------------------------------- */

interface ChartFrameProps {
  /** height / width ratio used to derive the drawing height */
  aspect?: number;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  children: (size: {
    width: number;
    height: number;
    inView: boolean;
  }) => React.ReactNode;
}

export function ChartFrame({
  aspect = 0.5,
  minHeight = 240,
  maxHeight = 640,
  className,
  children,
}: ChartFrameProps) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const height = width
    ? Math.max(minHeight, Math.min(maxHeight, Math.round(width * aspect)))
    : minHeight;

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      viewRef.current = node;
    },
    [ref, viewRef],
  );

  return (
    <div
      ref={setRefs}
      className={cn("relative w-full", className)}
      style={{ minHeight: height }}
    >
      {width > 0 ? children({ width, height, inView }) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ChartTooltip — floating, edge-aware, glassy card.                          */
/* -------------------------------------------------------------------------- */

export interface TooltipState {
  x: number;
  y: number;
  content: React.ReactNode;
}

export function ChartTooltip({
  tooltip,
  containerWidth,
}: {
  tooltip: TooltipState | null;
  containerWidth: number;
}) {
  if (!tooltip) return null;
  const flip = tooltip.x > containerWidth * 0.62;

  return (
    <div
      className="pointer-events-none absolute z-30 max-w-[16rem] -translate-y-1/2 rounded-xl border border-white/10 bg-popover/85 px-3.5 py-2.5 text-popover-foreground shadow-2xl shadow-black/60 backdrop-blur-md"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: `translate(${flip ? "calc(-100% - 16px)" : "16px"}, -50%)`,
      }}
      role="tooltip"
    >
      {tooltip.content}
    </div>
  );
}

export function TooltipRow({
  label,
  value,
  swatch,
}: {
  label: string;
  value: string;
  swatch?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {swatch ? (
          <span
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ background: swatch }}
          />
        ) : null}
        {label}
      </span>
      <span className="tabular font-medium text-foreground">{value}</span>
    </div>
  );
}

export function TooltipTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-sm font-semibold tracking-tight text-foreground">
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Legend — colour swatches with labels.                                      */
/* -------------------------------------------------------------------------- */

export interface LegendItem {
  label: string;
  color: string;
}

export function Legend({
  items,
  className,
  active,
  onHover,
}: {
  items: LegendItem[];
  className?: string;
  active?: string | null;
  onHover?: (label: string | null) => void;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-2", className)}>
      {items.map((item) => {
        const dimmed = active != null && active !== item.label;
        return (
          <li
            key={item.label}
            className={cn(
              "flex items-center gap-2 text-xs transition-opacity duration-200",
              dimmed ? "opacity-35" : "opacity-100",
              onHover && "cursor-default",
            )}
            onMouseEnter={() => onHover?.(item.label)}
            onMouseLeave={() => onHover?.(null)}
          >
            <span
              className="size-2.5 rounded-[3px]"
              style={{ background: item.color }}
            />
            <span className="text-muted-foreground">{item.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
