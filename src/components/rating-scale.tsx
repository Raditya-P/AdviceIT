"use client";

/* A seven-point rating as a row of large buttons. Replaces the slider for
   the response ratings for two reasons. A slider always shows a value, so a
   "required" slider is a fiction: untouched ones would be logged as 4. A
   button row can be genuinely unanswered until the person chooses. And on a
   phone a 44 px button is far easier to hit than a slider thumb. */

import { useLang } from "@/lib/i18n";

export function RatingScale({
  label,
  value,
  onChange,
  low,
  high,
  points = 7,
  invalid = false,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  low: string;
  high: string;
  points?: number;
  invalid?: boolean;
}) {
  const { locale } = useLang();
  const of = locale === "id" ? "dari" : "of";
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium leading-snug">
        {label}{" "}
        {value !== null && (
          <span className="whitespace-nowrap text-muted-foreground">
            <span className="tabular-nums text-primary">{value}</span> {of} {points}
          </span>
        )}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        aria-invalid={invalid || undefined}
        className={`flex gap-1.5 rounded-xl ${invalid ? "ring-2 ring-destructive/40" : ""}`}
      >
        {Array.from({ length: points }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            aria-label={String(v)}
            onClick={() => onChange(v)}
            className={`min-h-11 min-w-0 flex-1 rounded-xl border text-sm font-medium tabular-nums transition-colors sm:min-h-12 ${
              value === v
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary/50 hover:bg-muted"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  );
}
