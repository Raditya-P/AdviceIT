"use client";

/* A number field that can actually be typed into. A controlled input that
   clamps on every keystroke cannot: typing "4" on the way to "45" snaps to
   the minimum, and the next digit turns that into "185", which snaps to the
   maximum. So the typed text lives here as a draft, the committed value
   follows it as soon as the draft is in range, and whatever is left out of
   range is clamped once when the field loses focus. */

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "onBlur" | "type" | "min" | "max"> & {
  value: number;
  onCommit: (value: number) => void;
  min: number;
  max: number;
};

export function NumberField({ value, onCommit, min, max, ...rest }: Props) {
  /* The draft is only shown while it belongs to the current committed value,
     so a profile loaded from an example, a bench case or the narrative reader
     replaces whatever was being typed. */
  const [draft, setDraft] = useState<{ text: string; value: number } | null>(null);
  const text = draft && draft.value === value ? draft.text : String(value);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)));

  return (
    <Input
      {...rest}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        const v = Number(next);
        if (next.trim() !== "" && Number.isFinite(v) && v >= min && v <= max) {
          const rounded = Math.round(v);
          onCommit(rounded);
          setDraft({ text: next, value: rounded });
        } else {
          setDraft({ text: next, value });
        }
      }}
      onBlur={() => {
        const v = Number(text);
        if (text.trim() !== "" && Number.isFinite(v) && clamp(v) !== value) onCommit(clamp(v));
        setDraft(null);
      }}
    />
  );
}
