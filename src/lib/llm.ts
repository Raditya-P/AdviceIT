/* The in-browser language model, ported from AdviceIT v1 llm.js (prompt v4).
   Client-only: uses @mlc-ai/web-llm (WebGPU) via dynamic import so it never
   enters a server bundle. Two jobs:
     1. Conversational delivery: explain the recommendation, grounded ONLY
        on the ticked content facts, text logged verbatim.
     2. Language to suitability: read a free-text description into form
        facts. The judgement calls (Inconsistent tolerance, unsure handling)
        live in deterministic code in profileFromExtraction, not in the LLM. */

import type { AdvisorResult } from "./advisor/types";
import { featureExplanation, counterfactualExplanation, confidenceExplanation } from "./advisor/explanations";

export const MODELS = [
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 1.5B (about 1.2 GB, default, best at reading descriptions)" },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B (about 0.9 GB, lighter and faster)" },
];

export function supported() {
  return typeof navigator !== "undefined" && !!(navigator as Navigator & { gpu?: unknown }).gpu;
}

type Engine = {
  reload: (id: string) => Promise<void>;
  chat: { completions: { create: (o: object) => Promise<AsyncIterable<{ choices?: { delta?: { content?: string } }[] }> | { choices: { message: { content: string } }[] }> } };
};

const state: {
  engine: Engine | null;
  loadedModelId: string | null;
  loading: boolean;
  listeners: ((r: { text: string; progress: number; error?: boolean; ready?: boolean }) => void)[];
} = { engine: null, loadedModelId: null, loading: false, listeners: [] };

export function onProgress(fn: (r: { text: string; progress: number; error?: boolean; ready?: boolean }) => void) {
  state.listeners.push(fn);
  return () => {
    const i = state.listeners.indexOf(fn);
    if (i >= 0) state.listeners.splice(i, 1);
  };
}
function emit(r: { text: string; progress: number; error?: boolean; ready?: boolean }) {
  state.listeners.forEach((fn) => fn(r));
}
export function isReady() {
  return !!state.engine && !state.loading;
}
export function loadedModelId() {
  return state.loadedModelId;
}

export async function load(modelId: string): Promise<void> {
  if (state.engine && state.loadedModelId === modelId) return;
  if (state.loading) throw new Error("A model is already loading.");
  state.loading = true;
  emit({ text: "Loading WebLLM library", progress: 0 });
  try {
    const webllm = await import("@mlc-ai/web-llm");
    if (state.engine) {
      await state.engine.reload(modelId);
    } else {
      state.engine = (await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (r: { text: string; progress: number }) => emit({ text: r.text, progress: r.progress }),
      })) as unknown as Engine;
    }
    state.loadedModelId = modelId;
    state.loading = false;
    emit({ text: "Model ready", progress: 1, ready: true });
  } catch (err) {
    state.loading = false;
    emit({ text: "Could not load the model: " + (err instanceof Error ? err.message : String(err)), progress: 0, error: true });
    throw err;
  }
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chat(messages: ChatMessage[], onToken?: (t: string) => void): Promise<string> {
  if (!state.engine) throw new Error("No model loaded.");
  let acc = "";
  const stream = (await state.engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 320,
  })) as AsyncIterable<{ choices?: { delta?: { content?: string } }[] }>;
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      acc += delta;
      onToken?.(acc);
    }
  }
  return acc;
}

export async function complete(messages: ChatMessage[], maxTokens = 200): Promise<string> {
  if (!state.engine) throw new Error("No model loaded.");
  const r = (await state.engine.chat.completions.create({
    messages,
    stream: false,
    temperature: 0,
    max_tokens: maxTokens,
  })) as { choices: { message: { content: string } }[] };
  return r.choices?.[0]?.message?.content ?? "";
}

/* ---------------- Grounding facts for the conversational delivery ------- */
export function factsFor(result: AdvisorResult, content: string[]) {
  const include = (part: string) => !content || !content.length || content.includes(part);
  const fx = featureExplanation(result);
  const cf = counterfactualExplanation(result);
  const cx = confidenceExplanation(result);
  const p = result.profile;
  const alloc = result.portfolio.allocation;
  const facts: Record<string, unknown> = {
    advisor:
      result.advisor === "ml"
        ? "a neural network trained on 400 expert-validated suitability cases (ILS-Bench)"
        : "an interpretable scorecard fitted on 400 expert-validated suitability cases (ILS-Bench)",
    profile: {
      age: p.age,
      horizonYears: p.horizon,
      statedRiskTolerance: p.tolerance,
      emergencyFund: p.emergencyFund ? "yes, at least 6 months" : "no",
      income: p.incomeStable ? "stable" : "variable",
      debtOrObligations: p.debtObligations ? "significant" : "none reported",
      nearTermNeed: p.nearTermNeed ? "yes" : "no",
    },
    suitabilityLabels: {
      riskTolerance: result.labels.tolerance,
      riskCapacity: `${result.labels.capacity} (${result.labels.capacityReason})`,
      liquidityNeed: `${result.labels.liquidity} (${result.labels.liquidityReason})`,
    },
    recommendation: result.portfolio.name,
  };
  if (include("feature")) facts.inputContributions = fx.items.map((it) => it.sentence);
  if (include("counterfactual")) facts.whatWouldChangeIt = cf.sentences.length ? cf.sentences : [cf.intro];
  if (include("confidence")) facts.confidence = `${cx.labelText}. ${cx.sentence}`;
  if (alloc) {
    facts.allocationPercent = {
      globalEquities: alloc.equities,
      bonds: alloc.bonds,
      cashAndMoneyMarket: alloc.cash,
      realAssets: alloc.realAssets,
    };
  } else {
    facts.humanReview = "No automated portfolio is given. The case should be reviewed by a human adviser. " + (result.escalationReason || "");
  }
  facts.probabilityOfRecommendation = `${result.score} percent`;
  return facts;
}

export function systemPrompt(result: AdvisorResult, content: string[]) {
  return [
    "You are the explanation assistant of AdviceIT, a research tool about AI investment advice.",
    `You explain a recommendation that was produced by ${(factsFor(result, content) as { advisor: string }).advisor}. You did not produce it yourself.`,
    "Use ONLY the facts below. Do not add products, numbers, market views or advice that are not in the facts.",
    "If asked something the facts do not cover, say that you do not have that information.",
    "Write plainly, in short sentences, for a non-expert. Never use em dashes or semicolons.",
    "",
    "FACTS (JSON):",
    JSON.stringify(factsFor(result, content), null, 2),
  ].join("\n");
}

export const OPENING_REQUEST =
  "In three or four sentences, explain to me why I received this recommendation, what mattered most, and how sure the model is. Then invite me to ask a follow-up question.";

/* ---------------- Language to suitability (extraction v4) --------------- */
export function extractionMessages(narrative: string): ChatMessage[] {
  const system = [
    "You read a short description written by an investor and extract facts for a suitability form.",
    "Reply with ONE JSON object on a single line and nothing else, using exactly these keys and allowed values:",
    '{"age": integer or null,',
    ' "whenNeeded": "under2" | "2to5" | "6to10" | "over10" | "unsure" | null,',
    ' "appetite": "low" | "medium" | "high" | "unsure" | null,',
    ' "lossStress": true | false | null,',
    ' "emergencyFund": true | false | "unsure" | null,',
    ' "incomeStable": true | false | "unsure" | null,',
    ' "debtOrObligations": true | false | null,',
    ' "nearTermNeed": true | false | null,',
    ' "note": string of at most 10 words}',
    "Three kinds of answer: the value when the text says it, the string unsure when the person SAYS they do not know or have not checked, null only when the text is silent. Extract, do not judge.",
    "age: the text states it, in phrases like I am 46 or as a 64-year-old. Read it, do not answer null.",
    "whenNeeded: how soon the money is needed for its MAIN goal. Money needed very soon or within a year or two: under2. A few years: 2to5. Do NOT answer over10 by default, only when the text says the money can stay invested for well over ten years, such as retirement decades away. The person says they do not know when: unsure.",
    "nearTermNeed: true if ANY concrete need could take this money within about two years (rent, tuition, a tax bill, a purchase, a deposit, medical costs), even when the main goal is far away.",
    "appetite: what the person SAYS they want. Aggressive portfolio, high returns, grow quickly, recover a gap fast: high. Cautious, avoid losses, preserve capital: low. Balanced or moderate: medium. The person says they are not sure how much risk they can take: unsure.",
    "lossStress: true if the text says a loss would cause serious stress, anxiety or hardship, or that they cannot tolerate losses, or that they panicked and sold during a past decline.",
    "emergencyFund: true only for a solid cash reserve or emergency fund. false if the reserve is described as small, limited or absent. unsure if they say they have not checked it.",
    "incomeStable: true for a secure or steady income. false for irregular, variable, contract or a single unstable income. unsure if they say they cannot estimate their income.",
    "debtOrObligations: true for high-interest debt, loans to repay, or heavy or several fixed expenses. false if debt is said to be manageable or absent.",
  ].join("\n");
  return [
    { role: "system", content: system },
    { role: "user", content: `Description:\n${narrative}\n\nJSON:` },
  ];
}

type TriState = boolean | "unsure" | null;
export interface Extraction {
  age: number | null;
  whenNeeded: "under2" | "2to5" | "6to10" | "over10" | "unsure" | null;
  appetite: "low" | "medium" | "high" | "unsure" | null;
  lossStress: TriState;
  emergencyFund: TriState;
  incomeStable: TriState;
  debtObligations: TriState;
  nearTermNeed: TriState;
  reasoning: string;
}

export function parseExtraction(text: string): Extraction | null {
  if (!text) return null;
  let obj: Record<string, unknown> | null = null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      obj = JSON.parse(text.slice(start, end + 1));
    } catch {
      obj = null;
    }
  }
  if (!obj) {
    // Salvage a truncated reply key by key.
    obj = {};
    let m: RegExpMatchArray | null;
    if ((m = text.match(/"age"\s*:\s*(\d+)/))) obj.age = parseInt(m[1], 10);
    if ((m = text.match(/"whenNeeded"\s*:\s*"(under2|2to5|6to10|over10|unsure)"/))) obj.whenNeeded = m[1];
    if ((m = text.match(/"appetite"\s*:\s*"(low|medium|moderate|high|unsure)"/i))) obj.appetite = m[1];
    for (const key of ["lossStress", "emergencyFund", "incomeStable", "debtOrObligations", "nearTermNeed"]) {
      const mm = text.match(new RegExp(`"${key}"\\s*:\\s*(true|false|"unsure")`));
      if (mm) obj[key] = mm[1] === "true" ? true : mm[1] === "false" ? false : "unsure";
    }
    if (!Object.keys(obj).length) return null;
    obj.note = "salvaged from a truncated reply";
  }
  const intIn = (v: unknown, lo: number, hi: number) => {
    const n = parseInt(String(v), 10);
    return isNaN(n) || n < lo || n > hi ? null : n;
  };
  const bool = (v: unknown): TriState =>
    v === true || v === "true" ? true : v === false || v === "false" ? false : v === "unsure" ? "unsure" : null;
  const when =
    typeof obj.whenNeeded === "string" && ["under2", "2to5", "6to10", "over10", "unsure"].includes(obj.whenNeeded)
      ? (obj.whenNeeded as Extraction["whenNeeded"])
      : null;
  let appetite = typeof obj.appetite === "string" ? obj.appetite.toLowerCase() : null;
  if (appetite === "moderate") appetite = "medium";
  if (!appetite || !["low", "medium", "high", "unsure"].includes(appetite)) appetite = null;
  return {
    age: intIn(obj.age, 18, 80),
    whenNeeded: when,
    appetite: appetite as Extraction["appetite"],
    lossStress: bool(obj.lossStress),
    emergencyFund: bool(obj.emergencyFund),
    incomeStable: bool(obj.incomeStable),
    debtObligations: bool(obj.debtOrObligations),
    nearTermNeed: bool(obj.nearTermNeed),
    reasoning: typeof obj.note === "string" ? obj.note : "",
  };
}

/* Judgement in deterministic code. unsure maps conservatively, the way the
   expert panel judged under-specified cases: an unchecked fund or an income
   the person cannot estimate counts as a strain, an unknown timeframe reads
   as short, and not knowing one's own risk appetite reads as Inconsistent. */
const WHEN_TO_HORIZON: Record<string, number> = { under2: 2, "2to5": 4, "6to10": 8, over10: 20, unsure: 4 };

export interface ExtractedProfile {
  age: number | null;
  horizon: number | null;
  tolerance: "low" | "medium" | "high" | null;
  emergencyFund: boolean | null;
  incomeStable: boolean | null;
  debtObligations: boolean | null;
  nearTermNeed: boolean | null;
  toleranceInconsistent: boolean;
}

export function profileFromExtraction(ex: Extraction): ExtractedProfile {
  const fund = ex.emergencyFund === "unsure" ? false : ex.emergencyFund;
  const income = ex.incomeStable === "unsure" ? false : ex.incomeStable;
  const debt = ex.debtObligations === "unsure" ? null : ex.debtObligations;
  let strains = 0;
  if (fund === false) strains++;
  if (income === false) strains++;
  if (debt === true) strains++;
  const inconsistent =
    (ex.appetite === "high" && (ex.lossStress === true || ex.nearTermNeed === true || strains >= 2)) || ex.appetite === "unsure";
  return {
    age: ex.age,
    horizon: ex.whenNeeded ? WHEN_TO_HORIZON[ex.whenNeeded] : null,
    tolerance: ex.appetite === "unsure" ? "medium" : ex.appetite,
    toleranceInconsistent: inconsistent,
    emergencyFund: fund as boolean | null,
    incomeStable: income as boolean | null,
    debtObligations: debt,
    nearTermNeed: ex.nearTermNeed === "unsure" ? null : (ex.nearTermNeed as boolean | null),
  };
}
