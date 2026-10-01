"use client";

/* Resolves the assignment from the URL: cond (a preset, random among the
   assignable pool if absent or unknown), by (random or chosen), and an
   optional pid for researcher-issued links. Custom content and form are
   accepted for researcher use via content= and form=. The pid is cleaned to
   what the collector accepts (letters, digits, - and _, up to 40), because
   a pid like "P 07" would otherwise have every row of the session refused. */

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  CONTENT_PARTS,
  FORMS,
  MODALITIES,
  isPreset,
  modalityOf,
  presetFor,
  specFor,
  type ContentPart,
  type Form,
  type Modality,
} from "@/lib/conditions";
import { cleanParticipantId } from "@/lib/records";
import { randomCondition } from "@/lib/study";
import { StudyFlow, type Assignment } from "@/components/study/study-flow";

export function StudyEntry() {
  const sp = useSearchParams();
  const assignment: Assignment = useMemo(() => {
    const condParam = sp.get("cond") || "";
    const by = sp.get("by") === "chosen" ? "chosen" : "random";
    const contentParam = sp.get("content");
    const formParam = sp.get("form");
    const modalityParam = sp.get("modality");
    const modality: Modality = MODALITIES.includes(modalityParam as Modality)
      ? (modalityParam as Modality)
      : "visual";
    if (contentParam !== null || formParam) {
      const content = (contentParam || "")
        .split(",")
        .filter((c): c is ContentPart => (CONTENT_PARTS as readonly string[]).includes(c));
      const form = FORMS.includes(formParam as Form) ? (formParam as Form) : "static";
      return {
        condition: presetFor(content, form, modality),
        content,
        form,
        modality,
        assignedBy: "chosen",
        pid: cleanParticipantId(sp.get("pid")),
      };
    }
    const condition = isPreset(condParam) ? condParam : randomCondition();
    const spec = specFor(condition);
    return {
      condition,
      content: [...spec.content],
      form: spec.form,
      modality: modalityParam ? modality : modalityOf(spec),
      assignedBy: isPreset(condParam) ? by : "random",
      /* The plain way in, with nothing fixed by the link: the server picks
         the cell at consent, and this draw is only the fallback. */
      balanced: !isPreset(condParam) && !modalityParam,
      pid: cleanParticipantId(sp.get("pid")),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <StudyFlow assignment={assignment} />;
}
