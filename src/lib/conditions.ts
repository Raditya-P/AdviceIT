/* Explanation conditions as content (what is explained) times delivery
   (how it is shown). Presets name the common combinations, anything else
   is "custom". Both parts are logged. */

export const CONTENT_PARTS = ["feature", "counterfactual", "confidence"] as const;
export type ContentPart = (typeof CONTENT_PARTS)[number];
export const FORMS = ["static", "interactive", "adaptive", "llm"] as const;
export type Form = (typeof FORMS)[number];

export interface ConditionSpec {
  content: ContentPart[];
  form: Form;
}

export const PRESETS: Record<string, ConditionSpec> = {
  none: { content: [], form: "static" },
  feature: { content: ["feature"], form: "static" },
  counterfactual: { content: ["counterfactual"], form: "static" },
  confidence: { content: ["confidence"], form: "static" },
  hybrid: { content: ["feature", "counterfactual", "confidence"], form: "static" },
  interactive: { content: [], form: "interactive" },
  adaptive: { content: ["feature", "counterfactual", "confidence"], form: "adaptive" },
  llm: { content: ["feature", "counterfactual", "confidence"], form: "llm" },
};

export const PRESET_LABELS: Record<string, string> = {
  none: "No explanation",
  feature: "Why (feature-based)",
  counterfactual: "What would change it (counterfactual)",
  confidence: "How sure (confidence)",
  hybrid: "All three (hybrid)",
  interactive: "Interactive what-if",
  adaptive: "Adaptive to literacy",
  llm: "Conversational (LLM)",
  custom: "Custom",
};

export function presetFor(content: ContentPart[], form: Form): string {
  const key = [...content].sort().join("+") + "|" + form;
  for (const name of Object.keys(PRESETS)) {
    const p = PRESETS[name];
    if ([...p.content].sort().join("+") + "|" + p.form === key) return name;
  }
  return "custom";
}

export function specFor(preset: string): ConditionSpec {
  return PRESETS[preset] ?? PRESETS.none;
}

/* The seven participant-facing cards on /participate. "none" stays out of
   the cards (nobody would choose the control) but inside the random pool. */
export const CARDS: { id: string; title: string; tagline: string; needsGpu?: boolean }[] = [
  { id: "feature", title: "Why", tagline: "See which of your inputs pushed the advice, and by how much." },
  { id: "counterfactual", title: "What would change it", tagline: "The smallest change to your situation that would flip the advice." },
  { id: "confidence", title: "How sure", tagline: "The advisor's calibrated confidence, with the full probability picture." },
  { id: "hybrid", title: "All three", tagline: "Why, what would change it, and how sure, together." },
  { id: "interactive", title: "Interactive what-if", tagline: "Steer the inputs yourself and watch the advice react live." },
  { id: "adaptive", title: "Adaptive", tagline: "An explanation that adjusts to your financial literacy." },
  { id: "llm", title: "Conversational", tagline: "Chat with an explainer running entirely in your browser.", needsGpu: true },
];
