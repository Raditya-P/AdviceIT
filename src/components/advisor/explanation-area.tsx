"use client";

/* Dispatches an explanation condition (content x delivery) to renderers. */

import type { AdvisorResult } from "@/lib/advisor/types";
import type { ContentPart, Form, Modality } from "@/lib/conditions";
import { AdaptiveBox, ConfidenceBox, CounterfactualBox, FeatureBox } from "./explanation-boxes";
import { LlmChat } from "./llm-chat";
import { WhatIfPanel } from "./what-if";

export function ExplanationArea({
  result,
  content,
  form,
  modality = "visual",
  literacyLevel,
  researcherNote,
  showModelPicker,
  autoStartLlm,
  studyMode,
  onInteract,
  onLlmOpening,
  onLlmTurn,
}: {
  result: AdvisorResult;
  content: ContentPart[];
  form: Form;
  modality?: Modality;
  literacyLevel: "low" | "high";
  researcherNote?: boolean;
  showModelPicker?: boolean;
  autoStartLlm?: boolean;
  /* Set by study trials: the what-if panel stops comparing its preview
     against the shown recommendation, so a flawed trial is not announced. */
  studyMode?: boolean;
  onInteract?: (kind: "move" | "whynot") => void;
  onLlmOpening?: (text: string, modelId: string) => void;
  onLlmTurn?: (info: { routed: boolean; intent?: string }) => void;
}) {
  if (form === "llm") {
    return (
      <LlmChat
        result={result}
        content={content}
        showModelPicker={showModelPicker}
        autoStart={autoStartLlm}
        onOpening={onLlmOpening}
        onTurn={onLlmTurn}
      />
    );
  }
  if (form === "adaptive") {
    return (
      <AdaptiveBox
        result={result}
        content={content}
        level={literacyLevel}
        modality={modality}
        showNote={researcherNote ? `Adaptive variant: ${literacyLevel === "low" ? "plain" : "detailed"} (literacy level ${literacyLevel}).` : undefined}
      />
    );
  }
  const boxes = (
    <>
      {content.includes("feature") && <FeatureBox result={result} modality={modality} />}
      {content.includes("counterfactual") && <CounterfactualBox result={result} />}
      {content.includes("confidence") && <ConfidenceBox result={result} />}
    </>
  );
  return (
    <div className="space-y-3">
      {form === "interactive" && <WhatIfPanel result={result} onInteract={onInteract} assess={!studyMode} />}
      {boxes}
      {form === "static" && content.length === 0 && researcherNote && (
        <p className="text-sm italic text-muted-foreground">
          Condition: no explanation. Only the recommendation is shown to the participant.
        </p>
      )}
    </div>
  );
}
