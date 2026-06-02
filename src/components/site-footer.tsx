import type { FleetTotal } from "@/lib/types";
import { formatTonnes, formatInt } from "@/lib/format";

export function SiteFooter({ fleet }: { fleet: FleetTotal }) {
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
              A live ledger of the CO₂ Companion Energy avoids by steering
              customers&rsquo; batteries — rendered on the client with D3 over
              the Carbon Reporting API.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            <span className="text-muted-foreground">Built with</span>
            <span className="text-foreground">Next.js · D3 · Tailwind</span>
            <span className="text-muted-foreground">Data source</span>
            <span className="text-foreground">Companion Carbon Reporting</span>
            <span className="text-muted-foreground">CO₂ saved</span>
            <span className="text-foreground">
              {formatTonnes(fleet.totalSavedTonnes)} · {formatInt(fleet.batteryCount)}{" "}
              batteries
            </span>
          </div>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-muted-foreground/60">
          Figures use mock fixtures calibrated to a real fleet workbook.
          Avoided emissions compare actual grid draw against a counterfactual
          with the battery backed out, priced at each interval&rsquo;s grid
          carbon intensity.
        </p>
      </div>
    </footer>
  );
}
