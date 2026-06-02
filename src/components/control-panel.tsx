"use client";

import { SlidersHorizontal, RotateCcw, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PALETTES } from "@/lib/palettes";
import { useVizConfig } from "./viz/viz-config";

type BoolKey = "showGrid" | "showValues" | "showAnnotations" | "animate";

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function ControlPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { config, palette, update, reset } = useVizConfig();

  const toggles: Array<{
    key: BoolKey;
    label: string;
    description: string;
  }> = [
    { key: "showGrid", label: "Gridlines", description: "Reference lines behind the data." },
    { key: "showValues", label: "Value labels", description: "Print numbers directly on the marks." },
    { key: "showAnnotations", label: "Annotations", description: "Editorial markers and reference lines." },
    { key: "animate", label: "Motion", description: "Entrance and transition animations." },
  ];

  return (
    <>
      {/* floating trigger */}
      <Button
        type="button"
        size="lg"
        onClick={() => onOpenChange(true)}
        className="fixed bottom-6 right-6 z-40 h-12 gap-2 rounded-full px-5 shadow-xl shadow-black/40"
      >
        <SlidersHorizontal data-icon="inline-start" />
        Customize
      </Button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto border-white/10 bg-card/95 shadow-brand backdrop-blur-xl sm:max-w-md"
        >
          <SheetHeader className="border-b border-white/10">
            <SheetTitle className="font-display text-2xl">
              Customize the view
            </SheetTitle>
            <SheetDescription>
              Restyle every chart on the page in real time.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-5 py-6">
            {/* palette */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Colour palette
                </Label>
                <span className="text-xs text-muted-foreground">
                  {palette.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {PALETTES.map((p) => {
                  const isActive = p.id === config.paletteId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => update({ paletteId: p.id })}
                      className={cn(
                        "group relative flex flex-col gap-2 rounded-xl border p-3 text-left transition-all",
                        isActive
                          ? "border-accent-brand bg-accent-brand/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/25",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {p.label}
                        </span>
                        {isActive && (
                          <Check className="size-3.5 text-accent-brand" />
                        )}
                      </div>
                      <div className="flex h-2.5 gap-1 overflow-hidden rounded-full">
                        {p.categorical.slice(0, 6).map((c) => (
                          <span
                            key={c}
                            className="h-full flex-1"
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* toggles */}
            <div className="flex flex-col divide-y divide-white/5">
              {toggles.map((t) => (
                <ToggleRow
                  key={t.key}
                  id={t.key}
                  label={t.label}
                  description={t.description}
                  checked={config[t.key]}
                  onChange={(v) => update({ [t.key]: v })}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={reset}
              className="mt-1 gap-2 rounded-full"
            >
              <RotateCcw data-icon="inline-start" />
              Reset to defaults
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
