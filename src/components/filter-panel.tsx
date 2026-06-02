"use client";

import { useMemo } from "react";
import { type DateRange } from "react-day-picker";
import { timeFormat } from "d3";
import { Filter, RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { categoryColors } from "@/lib/palettes";
import { formatTonnes2 } from "@/lib/format";
import { matchPreset, RANGE_PRESETS } from "@/lib/filter";
import { useVizConfig } from "./viz/viz-config";
import { useFilter } from "./viz/filter-config";

const fmtDay = timeFormat("%-d %b %Y");

/** ISO yyyy-mm-dd ↔ a local-midnight Date (round-trips without timezone drift). */
const fromISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
    {children}
  </Label>
);

export function FilterPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { palette } = useVizConfig();
  const {
    source,
    state,
    bounds,
    isDefault,
    activeCount,
    setRange,
    setCustomers,
    reset,
  } = useFilter();

  const minDate = fromISO(bounds.min);
  const maxDate = fromISO(bounds.max);
  const selected: DateRange = { from: fromISO(state.from), to: fromISO(state.to) };
  const activePreset = matchPreset(state, bounds);

  const selectedIds = useMemo(
    () => new Set(state.customerIds),
    [state.customerIds],
  );

  // A fixed, per-customer swatch (matches the savings-area legend ordering).
  const swatches = useMemo(
    () => categoryColors(palette, source.customers.map((c) => c.name)),
    [palette, source.customers],
  );

  // Each site's CO₂ saved within the active date window — reflects the date
  // filter even for sites that aren't currently selected.
  const windowTonnes = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of source.series) {
      let kg = 0;
      for (const p of s.points) {
        if (p.date >= state.from && p.date <= state.to) kg += p.savedKg;
      }
      m.set(s.id, kg / 1000);
    }
    return m;
  }, [source.series, state.from, state.to]);

  const allSelected = selectedIds.size === source.customers.length;
  const nDays =
    Math.round(
      (Date.parse(`${state.to}T00:00:00Z`) -
        Date.parse(`${state.from}T00:00:00Z`)) /
        86_400_000,
    ) + 1;

  function handleCalendar(range: DateRange | undefined) {
    if (!range?.from) return;
    const from = toISO(range.from);
    setRange(from, range.to ? toISO(range.to) : from);
  }

  function applyPreset(id: string) {
    const preset = RANGE_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const r = preset.resolve(bounds);
    setRange(r.from, r.to);
  }

  function toggleCustomer(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    // Never allow an empty selection; preserve the source ordering.
    if (next.size === 0) return;
    setCustomers(source.customers.filter((c) => next.has(c.id)).map((c) => c.id));
  }

  return (
    <>
      {/* floating trigger */}
      <Button
        type="button"
        size="lg"
        onClick={() => onOpenChange(true)}
        className="fixed bottom-6 right-6 z-40 h-12 gap-2 rounded-full px-5 shadow-xl shadow-black/40"
      >
        <Filter data-icon="inline-start" />
        Filter
        {activeCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-0.5 size-5 rounded-full px-0 tabular"
          >
            {activeCount}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto border-white/10 bg-card/95 shadow-brand backdrop-blur-xl sm:max-w-md"
        >
          <SheetHeader className="border-b border-white/10">
            <SheetTitle className="font-display text-2xl">
              Filter the data
            </SheetTitle>
            <SheetDescription>
              Scope every chart to a date window and a set of sites.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-5 py-6">
            {/* date range */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <Eyebrow>Date range</Eyebrow>
                <span className="tabular text-xs text-muted-foreground">
                  {fmtDay(selected.from!)} – {fmtDay(selected.to!)}
                </span>
              </div>

              <ToggleGroup
                type="single"
                size="sm"
                variant="outline"
                value={activePreset ?? ""}
                onValueChange={(v) => v && applyPreset(v)}
                className="w-full bg-card/60"
              >
                {RANGE_PRESETS.map((p) => (
                  <ToggleGroupItem
                    key={p.id}
                    value={p.id}
                    className="flex-1 px-2 text-xs"
                  >
                    {p.label.replace(/^Last /, "")}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <div className="flex justify-center rounded-xl border border-white/10 bg-white/[0.02] p-2">
                <Calendar
                  mode="range"
                  selected={selected}
                  onSelect={handleCalendar}
                  defaultMonth={selected.from}
                  startMonth={minDate}
                  endMonth={maxDate}
                  captionLayout="dropdown"
                  disabled={{ before: minDate, after: maxDate }}
                  className="bg-transparent p-0"
                />
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* customers */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <Eyebrow>Sites</Eyebrow>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={allSelected}
                  onClick={() => setCustomers(source.customers.map((c) => c.id))}
                  className="h-7 px-2 text-xs text-muted-foreground"
                >
                  Select all
                </Button>
              </div>

              <div className="flex flex-col gap-1">
                {source.customers.map((c) => {
                  const isSelected = selectedIds.has(c.id);
                  const isLast = isSelected && selectedIds.size === 1;
                  return (
                    <Label
                      key={c.id}
                      htmlFor={`site-${c.id}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 font-normal transition-colors hover:bg-white/[0.03]",
                        isLast && "cursor-not-allowed",
                      )}
                    >
                      <Checkbox
                        id={`site-${c.id}`}
                        checked={isSelected}
                        disabled={isLast}
                        onCheckedChange={() => toggleCustomer(c.id)}
                      />
                      <span
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{ background: swatches.get(c.name) }}
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm text-foreground">
                          {c.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {c.location}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-xs font-medium text-muted-foreground">
                        {formatTonnes2(windowTonnes.get(c.id) ?? 0)}
                      </span>
                    </Label>
                  );
                })}
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* summary + reset */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {selectedIds.size} of {source.customers.length}
                </span>{" "}
                sites · {nDays} days
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reset}
                disabled={isDefault}
                className="gap-2 rounded-full"
              >
                <RotateCcw data-icon="inline-start" />
                Reset
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
