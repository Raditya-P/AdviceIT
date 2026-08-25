"use client";

/* The allocation bar and its legend, shared by the recommendation card and
   the marketing preview. Each asset class has its own colour token, so the
   four classes are told apart by hue rather than by opacity. */

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

export function AllocationBar({
  allocation,
  height = "h-11",
  animate = true,
}: {
  allocation: Allocation;
  height?: string;
  animate?: boolean;
}) {
  const { locale } = useLang();
  const label = ASSET_CLASSES.map(
    (ac) => `${assetLabel(ac.label)} ${allocation[ac.key]} ${tr(locale, { en: "percent", id: "persen" })}`,
  ).join(", ");
  return (
    <div
      role="img"
      aria-label={`${tr(locale, { en: "Allocation", id: "Alokasi" })}: ${label}`}
      className={`flex ${height} overflow-hidden rounded-xl ${animate ? "grow-bar" : ""}`}
    >
      {ASSET_CLASSES.map((ac) => {
        const pct = allocation[ac.key];
        if (pct <= 0) return null;
        return (
          <div
            key={ac.key}
            title={`${assetLabel(ac.label)} ${pct}%`}
            className="flex items-center justify-center text-xs font-semibold text-white/95"
            style={{ width: `${pct}%`, background: ASSET_COLOR[ac.key] }}
          >
            {pct >= 12 ? `${pct}%` : ""}
          </div>
        );
      })}
    </div>
  );
}

export function AllocationLegend({ allocation }: { allocation: Allocation }) {
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
          <span className="font-medium text-foreground tabular-nums">{allocation[ac.key]}%</span>
        </li>
      ))}
    </ul>
  );
}
