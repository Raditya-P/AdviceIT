/* Explanation conditions as content (what is explained) times delivery
   (how it is shown). Presets name the common combinations, anything else
   is "custom". Both parts are logged. */

export const CONTENT_PARTS = ["feature", "counterfactual", "confidence"] as const;
export type ContentPart = (typeof CONTENT_PARTS)[number];
export const FORMS = ["static", "interactive", "adaptive", "llm"] as const;
export type Form = (typeof FORMS)[number];

/* Modality applies to the "why" content only, which is the one content that
   exists in both a visual and a textual form. Counterfactual content is
   inherently textual and confidence content is inherently both, so a
   modality manipulation on those would not be a manipulation. Replicates
   Szymanski, Millecamp and Verbert (IUI 2021) and Szymanski et al. (TIIS
   2025). Default is "visual", which is what every version before 2.5.0
   showed, so existing rows stay comparable. */
export const MODALITIES = ["visual", "textual", "hybrid"] as const;
export type Modality = (typeof MODALITIES)[number];

export interface ConditionSpec {
  content: ContentPart[];
  form: Form;
  modality?: Modality;
}

/* The nine cells of the pilot's fractional design. Five vary content at
   static delivery, three vary delivery at the full content, and
   "interactive" keeps interactivity with no written explanation, whose
   clean comparator is "none" rather than "hybrid". */
export const PRESETS: Record<string, ConditionSpec> = {
  none: { content: [], form: "static" },
  feature: { content: ["feature"], form: "static", modality: "visual" },
  "feature-textual": { content: ["feature"], form: "static", modality: "textual" },
  "feature-hybrid": { content: ["feature"], form: "static", modality: "hybrid" },
  counterfactual: { content: ["counterfactual"], form: "static" },
  confidence: { content: ["confidence"], form: "static" },
  hybrid: { content: ["feature", "counterfactual", "confidence"], form: "static" },
  interactive: { content: [], form: "interactive" },
  "interactive-hybrid": { content: ["feature", "counterfactual", "confidence"], form: "interactive" },
  adaptive: { content: ["feature", "counterfactual", "confidence"], form: "adaptive" },
  llm: { content: ["feature", "counterfactual", "confidence"], form: "llm" },
};

export const PRESET_LABELS: Record<string, string> = {
  none: "No explanation",
  feature: "Why (visual)",
  "feature-textual": "Why (textual)",
  "feature-hybrid": "Why (hybrid)",
  counterfactual: "What would change it (counterfactual)",
  confidence: "How sure (confidence)",
  hybrid: "All three (hybrid)",
  interactive: "Interactive only",
  "interactive-hybrid": "Interactive with all three",
  adaptive: "Adaptive to literacy",
  llm: "Conversational (LLM)",
  custom: "Custom",
};

const PRESET_LABELS_ID: Record<string, string> = {
  none: "Tanpa penjelasan",
  feature: "Mengapa (visual)",
  "feature-textual": "Mengapa (tekstual)",
  "feature-hybrid": "Mengapa (hibrida)",
  counterfactual: "Apa yang mengubahnya (kontrafaktual)",
  confidence: "Seberapa yakin (keyakinan)",
  hybrid: "Ketiganya (hibrida)",
  interactive: "Hanya interaktif",
  "interactive-hybrid": "Interaktif dengan ketiganya",
  adaptive: "Adaptif terhadap literasi",
  llm: "Percakapan (LLM)",
  custom: "Kustom",
};

export function presetLabel(name: string, locale: "en" | "id") {
  if (locale === "id") return PRESET_LABELS_ID[name] ?? PRESET_LABELS[name] ?? name;
  return PRESET_LABELS[name] ?? name;
}

export function presetFor(content: ContentPart[], form: Form, modality: Modality = "visual"): string {
  const key = [...content].sort().join("+") + "|" + form + "|" + modality;
  for (const name of Object.keys(PRESETS)) {
    const p = PRESETS[name];
    if ([...p.content].sort().join("+") + "|" + p.form + "|" + (p.modality ?? "visual") === key) return name;
  }
  return "custom";
}

export function modalityOf(spec: ConditionSpec): Modality {
  return spec.modality ?? "visual";
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
  {
    id: "interactive-hybrid",
    title: "Interactive with all three",
    tagline: "All three explanations, plus controls to move the inputs and watch the advice react.",
  },
  { id: "adaptive", title: "Adaptive", tagline: "An explanation that adjusts to your financial literacy." },
  { id: "llm", title: "Conversational", tagline: "Chat with an explainer running entirely in your browser.", needsGpu: true },
  {
    id: "interactive",
    title: "Interactive only",
    tagline: "Move the inputs yourself, with nothing written to explain the advice.",
  },
];
