"use client";

/* The allocation bar and its legend, shared by the recommendation card and
   the marketing preview. Each asset class has its own colour token, so the
   four classes are told apart by hue rather than by opacity. */

import { AnimatedNumber } from "@/components/motion";
import { ASSET_CLASSES } from "@/lib/advisor/model";
import { assetLabel } from "@/lib/advisor/strings";
import { tr, useLang } from "@/lib/i18n";

export const ASSET_COLOR: Record<string, string> = {
  equities: "var(--equities)",
  bonds: "var(--bonds)",
  cash: "var(--cash)",
  realAssets: "var(--real-assets)",
};

export type Allocation = { equities: number; bonds: number; cash: number; realAssets: number };

/* animate: true grows the bar in when it mounts, "reveal" when its Reveal
   parent scrolls into view, false not at all. smooth keeps all four bands
   mounted, empty ones at zero width, so a change of mix slides the bands to
   their new widths instead of redrawing them. */
export function AllocationBar({
  allocation,
  height = "h-11",
  animate = true,
  smooth = false,
}: {
  allocation: Allocation;
  height?: string;
  animate?: boolean | "reveal";
  smooth?: boolean;
}) {
  const { locale } = useLang();
  const label = ASSET_CLASSES.map(
    (ac) => `${assetLabel(ac.label)} ${allocation[ac.key]} ${tr(locale, { en: "percent", id: "persen" })}`,
  ).join(", ");
  return (
    <div
      role="img"
      aria-label={`${tr(locale, { en: "Allocation", id: "Alokasi" })}: ${label}`}
      className={`flex ${height} overflow-hidden rounded-xl ${
        animate === "reveal" ? "reveal-grow" : animate ? "grow-bar" : ""
      } ${smooth ? "alloc-smooth" : ""}`}
    >
      {ASSET_CLASSES.map((ac) => {
        const pct = allocation[ac.key];
        if (pct <= 0 && !smooth) return null;
        return (
          <div
            key={ac.key}
            title={`${assetLabel(ac.label)} ${pct}%`}
            className="flex items-center justify-center overflow-hidden text-xs font-semibold whitespace-nowrap text-white/95"
            style={{ width: `${pct}%`, background: ASSET_COLOR[ac.key], opacity: pct > 0 ? 1 : 0 }}
          >
            {pct >= 12 ? smooth ? <><AnimatedNumber value={pct} />%</> : `${pct}%` : ""}
          </div>
        );
      })}
    </div>
  );
}

/* animated: the percentages glide to new values when the mix changes. */
export function AllocationLegend({ allocation, animated = false }: { allocation: Allocation; animated?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
      {ASSET_CLASSES.map((ac) => (
        <li key={ac.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block size-2.5 rounded-full"
            style={{ background: ASSET_COLOR[ac.key] }}
          />
          {assetLabel(ac.label)}
          <span className="font-medium text-foreground tabular-nums">
            {animated ? <AnimatedNumber value={allocation[ac.key]} /> : allocation[ac.key]}%
          </span>
        </li>
      ))}
    </ul>
  );
}
