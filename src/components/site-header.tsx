"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "#savings", label: "Savings" },
  { href: "#savers", label: "Top savers" },
  { href: "#efficiency", label: "Efficiency" },
  { href: "#mix", label: "The mix" },
  { href: "#cars", label: "In cars" },
];

export function SiteHeader({
  onOpenFilters,
  filterCount = 0,
}: {
  onOpenFilters: () => void;
  filterCount?: number;
}) {
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
          onClick={onOpenFilters}
          className="gap-2 rounded-full border-white/15 bg-white/[0.03]"
        >
          <Filter data-icon="inline-start" />
          <span className="hidden sm:inline">Filter</span>
          {filterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 size-5 rounded-full px-0 tabular"
            >
              {filterCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
