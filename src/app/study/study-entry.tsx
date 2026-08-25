"use client";

/* Resolves the assignment from the URL: cond (a preset, random among the
   assignable pool if absent or unknown), by (random or chosen), and an
   optional pid for researcher-issued links. Custom content and form are
   accepted for researcher use via content= and form=. */

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { CONTENT_PARTS, FORMS, PRESETS, presetFor, specFor, type ContentPart, type Form } from "@/lib/conditions";
import { randomCondition } from "@/lib/study";
import { StudyFlow, type Assignment } from "@/components/study/study-flow";

export function StudyEntry() {
  const sp = useSearchParams();
  const assignment: Assignment = useMemo(() => {
    const condParam = sp.get("cond") || "";
    const by = sp.get("by") === "chosen" ? "chosen" : "random";
    const contentParam = sp.get("content");
    const formParam = sp.get("form");
    if (contentParam !== null || formParam) {
      const content = (contentParam || "")
        .split(",")
        .filter((c): c is ContentPart => (CONTENT_PARTS as readonly string[]).includes(c));
      const form = FORMS.includes(formParam as Form) ? (formParam as Form) : "static";
      return { condition: presetFor(content, form), content, form, assignedBy: "chosen", pid: sp.get("pid") || undefined };
    }
    const condition = condParam in PRESETS ? condParam : randomCondition();
    const spec = specFor(condition);
    return {
      condition,
      content: [...spec.content],
      form: spec.form,
      assignedBy: condParam in PRESETS ? by : "random",
      pid: sp.get("pid") || undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <StudyFlow assignment={assignment} />;
}
