"use client";

/* Resolves the assignment from the URL. The plain way in carries nothing:
   the server places the participant in the least-filled condition at
   consent, and a condition drawn here is only the fallback. A researcher can
   fix one of the five study conditions with ?cond= for testing, and name the
   participant with ?pid=; such a session is logged with assignmentMethod
   "url". The pid is cleaned to what the collector accepts (letters, digits,
   - and _, up to 40), because a pid like "P 07" would otherwise have every
   row of the session refused. */

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { modalityOf, specFor } from "@/lib/conditions";
import { cleanParticipantId } from "@/lib/records";
import { ASSIGNABLE_CONDITIONS, randomCondition } from "@/lib/study";
import { StudyFlow, type Assignment } from "@/components/study/study-flow";

export function StudyEntry() {
  const sp = useSearchParams();
  const assignment: Assignment = useMemo(() => {
    const condParam = sp.get("cond") || "";
    const fixed = (ASSIGNABLE_CONDITIONS as readonly string[]).includes(condParam);
    const condition = fixed ? condParam : randomCondition();
    const spec = specFor(condition);
    return {
      condition,
      content: [...spec.content],
      form: spec.form,
      modality: modalityOf(spec),
      assignedBy: fixed && sp.get("by") === "chosen" ? "chosen" : "random",
      balanced: !fixed,
      pid: cleanParticipantId(sp.get("pid")),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <StudyFlow assignment={assignment} />;
}
