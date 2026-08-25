/* The two advisors, ported from AdviceIT v1 ml_model.js and logit_model.js.
   Both are learned by ml/train_model.py (numpy, seeded) on ILS-Bench and
   shipped as weights in src/data/ml_weights.json:
     - ml:    a multilayer perceptron, 12 encoded inputs, opaque, explained
              post hoc with exact Shapley values over the seven form inputs
     - logit: a multinomial logistic regression, the interpretable
              rule-based advisor, explained exactly from its weights
   The JavaScript forward passes reproduce the Python training accuracies
   exactly (verified in the v1 test suite and re-verified in verify.ts). */

import weights from "@/data/ml_weights.json";
import {
  HUMAN_REVIEW_INDEX,
  OUTCOMES,
  PORTFOLIOS,
  deriveSuitabilityLabels,
  normalizeProfile,
  round1,
} from "./model";
import type { Advisor, AdvisorResult, Contribution, Profile, RawProfile } from "./types";

type Layer = { activation: string; W: number[][]; b: number[] };
const W = weights as unknown as {
  featureLayout: { tolerance: string[]; capacity: string[]; liquidity: string[]; age: { mean: number; std: number } };
  classes: string[];
  layers: Layer[];
  temperature: number;
  logit: { W: number[][]; b: number[]; temperature: number; meta: Record<string, number> };
  meta: Record<string, unknown>;
};

const LAYOUT = W.featureLayout;
const CONFIDENCE = { high: 0.75, moderate: 0.5 };

export const BASELINE: RawProfile = {
  age: 45,
  horizon: 10,
  tolerance: "medium",
  emergencyFund: true,
  incomeStable: true,
  debtObligations: false,
  nearTermNeed: false,
  toleranceInconsistent: false,
};

function oneHot(value: string, options: string[]) {
  return options.map((o) => (o === value ? 1 : 0));
}

function featureVector(profile: Profile): number[] {
  const labels = deriveSuitabilityLabels(profile);
  return [
    ...oneHot(labels.tolerance, LAYOUT.tolerance),
    ...oneHot(labels.capacity, LAYOUT.capacity),
    ...oneHot(labels.liquidity, LAYOUT.liquidity),
    (profile.age - LAYOUT.age.mean) / LAYOUT.age.std,
  ];
}

function softmax(z: number[], t: number) {
  const max = Math.max(...z.map((v) => v / t));
  const e = z.map((v) => Math.exp(v / t - max));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / sum);
}

function mlForward(x: number[]) {
  let a = x;
  for (const layer of W.layers) {
    const out: number[] = [];
    for (let j = 0; j < layer.b.length; j++) {
      let s = layer.b[j];
      for (let k = 0; k < a.length; k++) s += a[k] * layer.W[k][j];
      out[j] = layer.activation === "relu" ? Math.max(0, s) : s;
    }
    a = out;
  }
  return a;
}

function logitForward(x: number[]) {
  const out: number[] = [];
  for (let j = 0; j < W.logit.b.length; j++) {
    let s = W.logit.b[j];
    for (let k = 0; k < x.length; k++) s += x[k] * W.logit.W[k][j];
    out[j] = s;
  }
  return out;
}

export function mlProbabilities(profile: Profile) {
  return softmax(mlForward(featureVector(profile)), W.temperature);
}

export function logitProbabilities(profile: Profile) {
  return softmax(logitForward(featureVector(profile)), W.logit.temperature);
}

/* ------------------------------------------------------------------
   Exact Shapley values for the network, over the SEVEN form inputs the
   participant controls (2^7 = 128 coalitions). The target is the
   probability of the recommended outcome, in percentage points, relative
   to the neutral baseline profile. Efficiency holds by construction.
   ------------------------------------------------------------------ */
const FEATURE_KEYS = [
  "age",
  "horizon",
  "tolerance",
  "emergencyFund",
  "incomeStable",
  "debtObligations",
  "nearTermNeed",
] as const;

function factorial(n: number) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function mixedProfile(profile: Profile, mask: number): Profile {
  const p: Record<string, unknown> = {};
  FEATURE_KEYS.forEach((key, idx) => {
    p[key] = mask & (1 << idx) ? profile[key] : (BASELINE as Record<string, unknown>)[key];
  });
  // The inconsistency flag travels with the tolerance input (bit 2).
  p.toleranceInconsistent = mask & (1 << 2) ? Boolean(profile.toleranceInconsistent) : false;
  return normalizeProfile(p as RawProfile);
}

function shapley(profile: Profile, classIndex: number) {
  const n = FEATURE_KEYS.length;
  const cache = new Map<number, number>();
  const f = (mask: number) => {
    if (!cache.has(mask)) cache.set(mask, mlProbabilities(mixedProfile(profile, mask))[classIndex] * 100);
    return cache.get(mask)!;
  };
  const phi: number[] = [];
  for (let i = 0; i < n; i++) {
    let total = 0;
    for (let mask = 0; mask < 1 << n; mask++) {
      if (mask & (1 << i)) continue;
      let size = 0;
      for (let b = 0; b < n; b++) if (mask & (1 << b)) size++;
      const weight = (factorial(size) * factorial(n - size - 1)) / factorial(n);
      total += weight * (f(mask | (1 << i)) - f(mask));
    }
    phi[i] = total;
  }
  return { values: phi, baseline: f(0), full: f((1 << n) - 1) };
}

const TOLERANCE_TEXT: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };

function featureValueTexts(profile: Profile): Record<string, { label: string; valueText: string }> {
  const tolText =
    TOLERANCE_TEXT[profile.tolerance] + " tolerance" + (profile.toleranceInconsistent ? ", read as Inconsistent" : "");
  return {
    age: { label: "Age", valueText: `${profile.age} years old` },
    horizon: { label: "Investment horizon", valueText: `${profile.horizon} ${profile.horizon === 1 ? "year" : "years"}` },
    tolerance: { label: "Risk tolerance", valueText: tolText },
    emergencyFund: { label: "Emergency fund", valueText: profile.emergencyFund ? "6 months covered" : "no 6-month buffer" },
    incomeStable: { label: "Income stability", valueText: profile.incomeStable ? "stable income" : "variable income" },
    debtObligations: {
      label: "Debt and obligations",
      valueText: profile.debtObligations ? "significant debt or obligations" : "no significant debt",
    },
    nearTermNeed: { label: "Near-term need", valueText: profile.nearTermNeed ? "money may be needed soon" : "no near-term need" },
  };
}

function confidenceLabel(pTop: number): "high" | "moderate" | "low" {
  if (pTop >= CONFIDENCE.high) return "high";
  if (pTop >= CONFIDENCE.moderate) return "moderate";
  return "low";
}

function topTwo(probs: number[]) {
  let top = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[top]) top = i;
  let second = -1;
  for (let i = 0; i < probs.length; i++) if (i !== top && (second < 0 || probs[i] > probs[second])) second = i;
  return { top, second };
}

function baseResult(
  advisor: "ml" | "logit",
  profile: Profile,
  probs: number[],
): Omit<AdvisorResult, "contributions" | "targetLabel" | "targetUnit" | "baselineScore" | "rawScore" | "contribIntro" | "contribTotal"> {
  const labels = deriveSuitabilityLabels(profile);
  const { top, second } = topTwo(probs);
  const outcome = OUTCOMES[top];
  const pTop = probs[top];
  const who = advisor === "ml" ? "The network, trained on expert decisions," : "The interpretable model, fitted on expert decisions,";
  return {
    advisor,
    profile,
    labels,
    score: round1(pTop * 100),
    probabilities: probs.map((p) => Math.round(p * 1000) / 1000),
    portfolioIndex: top,
    portfolio: outcome,
    escalated: top === HUMAN_REVIEW_INDEX,
    escalationReason:
      top === HUMAN_REVIEW_INDEX
        ? `${who} judges this profile (${labels.tolerance} tolerance, ${labels.capacity} capacity, ${labels.liquidity} liquidity need) as one that should go to a human adviser.`
        : null,
    scorePortfolio: top === HUMAN_REVIEW_INDEX ? PORTFOLIOS[Math.min(second, PORTFOLIOS.length - 1)] : outcome,
    margin: Math.round((pTop - probs[second]) * 1000) / 10,
    topProbability: Math.round(pTop * 1000) / 1000,
    confidence: confidenceLabel(pTop),
    neighbourPortfolio: OUTCOMES[second],
  };
}

export function mlRecommend(raw: RawProfile): AdvisorResult {
  const profile = normalizeProfile(raw);
  const probs = mlProbabilities(profile);
  const base = baseResult("ml", profile, probs);
  const sh = shapley(profile, base.portfolioIndex);
  const texts = featureValueTexts(profile);
  const contributions: Contribution[] = FEATURE_KEYS.map((key, i) => ({
    key,
    label: texts[key].label,
    valueText: texts[key].valueText,
    points: sh.values[i],
  }));
  const name = base.portfolio.name;
  return {
    ...base,
    contributions,
    targetLabel: `the probability of ${name}`,
    targetUnit: "percentage points",
    baselineScore: round1(sh.baseline),
    rawScore: round1(sh.full),
    contribIntro: `Compared with a neutral baseline profile, each of your inputs moved the probability of ${name} as follows (largest effect first, in percentage points):`,
    contribTotal: `Baseline profile ${round1(sh.baseline)} percent plus contributions = ${round1(sh.full)} percent probability of ${name} for your profile.`,
  };
}

/* Exact contributions for the interpretable rule-based advisor: weight of
   the recommended outcome times the input, minus the same for the baseline,
   summed per label group. Additive in log-odds by construction. */
const GROUPS = [
  { key: "tolerance", label: "Risk tolerance", from: 0, to: 4 },
  { key: "capacity", label: "Risk capacity", from: 4, to: 7 },
  { key: "liquidity", label: "Liquidity need", from: 7, to: 11 },
  { key: "age", label: "Age", from: 11, to: 12 },
];

export function logitRecommend(raw: RawProfile): AdvisorResult {
  const profile = normalizeProfile(raw);
  const probs = logitProbabilities(profile);
  const base = baseResult("logit", profile, probs);
  const k = base.portfolioIndex;
  const x = featureVector(profile);
  const xb = featureVector(normalizeProfile(BASELINE));
  const labels = base.labels;
  const baseLogit = logitForward(xb)[k];
  const fullLogit = logitForward(x)[k];
  const valueText: Record<string, string> = {
    tolerance:
      labels.tolerance + (profile.toleranceInconsistent ? " (read from the description)" : ` (stated ${profile.tolerance})`),
    capacity: `${labels.capacity} (${labels.capacityReason})`,
    liquidity: `${labels.liquidity} (${labels.liquidityReason})`,
    age: `${profile.age} years old`,
  };
  const contributions: Contribution[] = GROUPS.map((g) => {
    let pts = 0;
    for (let i = g.from; i < g.to; i++) pts += W.logit.W[i][k] * (x[i] - xb[i]);
    return { key: g.key, label: g.label, valueText: valueText[g.key], points: pts };
  });
  const name = base.portfolio.name;
  return {
    ...base,
    contributions,
    targetLabel: `the evidence for ${name}`,
    targetUnit: "log-odds points",
    baselineScore: round1(baseLogit),
    rawScore: round1(fullLogit),
    contribIntro: `Compared with a neutral baseline profile, each input moved the evidence for ${name} as follows (largest effect first, in log-odds points, read directly from the model's weights):`,
    contribTotal: `Baseline evidence ${round1(baseLogit)} plus contributions = ${round1(fullLogit)} log-odds points for ${name}, which the model turns into a ${Math.round(base.topProbability * 100)} percent probability.`,
  };
}

/* The whole scorecard of the interpretable advisor: what every input value
   is worth, in points, for every outcome. Age is shown per 10 years older
   than the baseline age. */
export function scorecard() {
  const groups: { label: string; rows: { label: string; points: number[] }[] }[] = [];
  const row = (label: string, points: number[]) => ({ label, points: points.map(round1) });
  const groupRows = (title: string, options: string[], offset: number) => {
    groups.push({
      label: title,
      rows: options.map((opt, i) => row(opt, W.logit.b.map((_, k) => W.logit.W[offset + i][k]))),
    });
  };
  groupRows("Risk tolerance", LAYOUT.tolerance, 0);
  groupRows("Risk capacity", LAYOUT.capacity, LAYOUT.tolerance.length);
  groupRows("Liquidity need", LAYOUT.liquidity, LAYOUT.tolerance.length + LAYOUT.capacity.length);
  const ageOffset = LAYOUT.tolerance.length + LAYOUT.capacity.length + LAYOUT.liquidity.length;
  groups.push({
    label: "Age",
    rows: [row(`per 10 years older than ${Math.round(LAYOUT.age.mean)}`, W.logit.b.map((_, k) => (W.logit.W[ageOffset][k] * 10) / LAYOUT.age.std))],
  });
  groups.push({ label: "Starting points", rows: [row("every profile starts here", [...W.logit.b])] });
  return { outcomes: OUTCOMES.map((o) => o.name), groups };
}

export const mlMeta = W.meta as Record<string, never> & {
  cvAccuracy: number;
  cvAccuracySd: number;
  cvMacroF1: number;
  cvFolds: number;
  cvRepeats: number;
  cases: number;
  seed: number;
  trainedOn: string;
  trainAccuracy: number;
  eceBefore: number;
  eceAfter: number;
  hidden: number;
  epochs: number;
  majorityBaselineAccuracy: number;
  lookupBaselineAccuracy: number;
  authorAgreementWithConsensus: number;
  perClassRecall?: Record<string, number>;
  confusion?: number[][];
};
export const logitMeta = W.logit.meta;
export const mlTemperature = W.temperature;
export const logitTemperature = W.logit.temperature;
export const classes = W.classes;

export const ADVISORS: Record<"ml" | "logit", Advisor> = {
  ml: {
    id: "ml",
    name: "AI advisor",
    description: `A neural network trained on ILS-Bench, ${(W.meta as { cases?: number }).cases} expert-validated cases, ${Math.round((W.meta as { cvAccuracy: number }).cvAccuracy * 100)} percent cross-validated accuracy over six outcomes including Human review. Its weights are not readable, so explanations are computed post hoc.`,
    recommend: mlRecommend,
  },
  logit: {
    id: "logit",
    name: "Interpretable rule-based advisor",
    description: `A scorecard fitted on the same data by multinomial logistic regression, ${Math.round(W.logit.meta.cvAccuracy * 100)} percent cross-validated accuracy. One weight per input and outcome, every weight readable, explanations exact.`,
    recommend: logitRecommend,
  },
};
