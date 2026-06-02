"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#trajectory", label: "Trajectory" },
  { href: "#emitters", label: "Emitters" },
  { href: "#per-person", label: "Per person" },
  { href: "#sectors", label: "Sectors" },
];

export function SiteHeader({ onCustomize }: { onCustomize: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent-brand/15">
            <span className="size-2 rounded-full bg-accent-brand" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Carbon to Zero
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCustomize}
          className="gap-2 rounded-full border-white/15 bg-white/[0.03]"
        >
          <SlidersHorizontal data-icon="inline-start" />
          <span className="hidden sm:inline">Customize</span>
        </Button>
      </div>
    </header>
  );
}
