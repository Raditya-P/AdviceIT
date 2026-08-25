"use client";

/* The seven-point rating control used by the study trials and by the
   visitor response panel on the advisor pages. */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useLang } from "@/lib/i18n";

export function RatingSlider({
  label,
  value,
  onChange,
  low,
  high,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  low: string;
  high: string;
}) {
  const { locale } = useLang();
  return (
    <div className="space-y-1.5">
      <Label>
        {label} <span className="tabular-nums text-primary">{value}</span> {locale === "id" ? "dari" : "of"} 7
      </Label>
      <Slider min={1} max={7} step={1} value={[value]} onValueChange={(v: number[]) => onChange(v[0])} aria-label={label} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
