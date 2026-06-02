export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <span className="grid size-6 place-items-center rounded-md bg-accent-brand/15">
                <span className="size-2 rounded-full bg-accent-brand" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Carbon to Zero
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              An interactive atlas of global CO₂ emissions, rendered entirely on
              the client with D3 and a static CSV dataset.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            <span className="text-muted-foreground">Built with</span>
            <span className="text-foreground">Next.js · D3 · Tailwind</span>
            <span className="text-muted-foreground">Data shape</span>
            <span className="text-foreground">Our World in Data (2022)</span>
            <span className="text-muted-foreground">Figures</span>
            <span className="text-foreground">Illustrative</span>
          </div>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-muted-foreground/60">
          Figures are anchored on real-world fossil-CO₂ estimates and smoothed
          for presentation. This page is a design demonstration, not a primary
          data source.
        </p>
      </div>
    </footer>
  );
}
