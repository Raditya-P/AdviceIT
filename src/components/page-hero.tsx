import type { ReactNode } from "react";

/* The shared page opener: eyebrow, title, lead paragraph, on the soft glow
   used across the site. Server-safe, so both server and client pages can
   use it. */

export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  width = "max-w-4xl",
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
  width?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border/70">
      <div aria-hidden className="surface-glow" />
      <div className={`relative mx-auto ${width} px-4 py-14 sm:px-6 sm:py-16`}>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>}
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {lead && <div className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{lead}</div>}
        {children}
      </div>
    </section>
  );
}
