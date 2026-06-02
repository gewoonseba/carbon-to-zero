import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

interface SectionProps {
  id: string;
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  source?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({
  id,
  index,
  eyebrow,
  title,
  lede,
  source,
  children,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-20 sm:px-8 md:py-28",
        className,
      )}
    >
      <Reveal className="mb-10 max-w-3xl md:mb-14">
        <div className="flex items-center gap-4">
          <span className="tabular font-mono text-xs text-accent-brand">
            {index}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </span>
          <span className="rule-accent h-px flex-1" />
        </div>
        <h2 className="mt-5 font-display text-4xl font-medium leading-[1.04] tracking-tight text-balance text-foreground sm:text-5xl md:text-[3.4rem]">
          {title}
        </h2>
        {lede ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {lede}
          </p>
        ) : null}
      </Reveal>

      <Reveal delay={80}>{children}</Reveal>

      {source ? (
        <p className="mt-6 text-xs text-muted-foreground/70">{source}</p>
      ) : null}
    </section>
  );
}
