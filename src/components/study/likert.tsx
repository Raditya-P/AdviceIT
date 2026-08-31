"use client";

/* A five-point agreement scale, used for need for cognition,
   ease-of-satisfaction and the explanation perception items. Radio inputs
   rather than a slider, because agreement scales are ordinal categories and
   a slider invites a continuous reading of them. */

import { LIKERT_LABELS } from "@/lib/study";
import { useLang } from "@/lib/i18n";

export function LikertRow({
  label,
  value,
  onChange,
  index,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  index: number;
}) {
  const { locale } = useLang();
  const labels = LIKERT_LABELS[locale];
  return (
    <fieldset className="space-y-2 border-t border-border/70 pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-1 font-medium">
        {index}. {label}
      </legend>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            aria-label={labels[v - 1]}
            onClick={() => onChange(v)}
            className={`min-w-11 flex-1 rounded-xl border px-2 py-2 text-xs transition-colors sm:text-sm ${
              value === v
                ? "border-primary bg-primary font-medium text-primary-foreground"
                : "border-border hover:border-primary/50 hover:bg-muted"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{labels[0]}</span>
        <span>{labels[4]}</span>
      </div>
    </fieldset>
  );
}
