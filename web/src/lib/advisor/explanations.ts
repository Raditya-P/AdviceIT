/* Explanation content, ported from AdviceIT v1 explanations.js.
   Everything is computed from the advisor's actual behaviour, nothing is
   templated text about a specific profile:
     - featureExplanation: the result's contributions with sentences and a
       method note (exact weights for logit, exact Shapley for ml)
     - counterfactualExplanation: smallest single-input change that flips
       the outcome, found by re-running the advisor (model-agnostic)
     - contrastiveExplanation: "why not X", smallest change (or pair) that
       yields X, or an honest statement that X is out of reach
     - confidenceExplanation: calibrated probability of the outcome */

import { ADVISORS } from "./advisors";
import { CONFIG } from "./model";
import { CF, CT, CX, FX, LT, V, inputLabel } from "./strings";
import type { AdvisorResult, Profile } from "./types";

const round1 = (v: number) => Math.round(v * 10) / 10;

function advisorFor(result: AdvisorResult) {
  return ADVISORS[result.advisor];
}

/* Labels and value texts regenerated in the CURRENT locale from the
   profile and labels carried on the result. In English this reproduces
   the stored contribution texts byte for byte; the stored (logged)
   values stay English. */
function displayTexts(result: AdvisorResult): Record<string, { label: string; valueText: string }> {
  const p = result.profile;
  const labels = result.labels;
  if (result.advisor === "ml") {
    return {
      age: { label: inputLabel("Age"), valueText: V.yearsOld(p.age) },
      horizon: { label: inputLabel("Investment horizon"), valueText: V.years(p.horizon) },
      tolerance: { label: inputLabel("Risk tolerance"), valueText: V.toleranceText(p.tolerance, p.toleranceInconsistent) },
      emergencyFund: { label: inputLabel("Emergency fund"), valueText: V.fund(p.emergencyFund) },
      incomeStable: { label: inputLabel("Income stability"), valueText: V.income(p.incomeStable) },
      debtObligations: { label: inputLabel("Debt and obligations"), valueText: V.debt(p.debtObligations) },
      nearTermNeed: { label: inputLabel("Near-term need"), valueText: V.need(p.nearTermNeed) },
    };
  }
  return {
    tolerance: { label: inputLabel("Risk tolerance"), valueText: LT.tolValue(labels.tolerance, p.toleranceInconsistent, p.tolerance) },
    capacity: { label: inputLabel("Risk capacity"), valueText: LT.capValue(labels.capacity, labels.capacityReason) },
    liquidity: { label: inputLabel("Liquidity need"), valueText: LT.liqValue(labels.liquidity, labels.liquidityReason) },
    age: { label: inputLabel("Age"), valueText: V.yearsOld(p.age) },
  };
}

export interface FeatureExplanation {
  baselineScore: number;
  rawScore: number;
  score: number;
  targetLabel: string;
  targetUnit: string;
  methodNote: string;
  toleranceNote: string;
  maxAbs: number;
  items: { key: string; label: string; valueText: string; points: number; sentence: string }[];
}

export function featureExplanation(result: AdvisorResult): FeatureExplanation {
  const name = result.portfolio.name;
  const scoreWord = result.advisor === "ml" ? FX.targetProbability(name) : FX.targetEvidence(name);
  const texts = displayTexts(result);
  const items = result.contributions
    .map((c) => {
      const t = texts[c.key] ?? { label: c.label, valueText: c.valueText };
      const sentence =
        c.points === 0
          ? FX.sentenceUnchanged(t.label, t.valueText, scoreWord)
          : FX.sentenceChanged(t.label, t.valueText, c.points > 0, FX.points(c.points), scoreWord);
      return { key: c.key, label: t.label, valueText: t.valueText, points: round1(c.points), sentence };
    })
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
  const maxAbs = items.reduce((m, it) => Math.max(m, Math.abs(it.points)), 0);
  const methodNote = result.advisor === "ml" ? FX.methodShapley(scoreWord) : FX.methodWeights();
  return {
    baselineScore: result.baselineScore,
    rawScore: result.rawScore,
    score: result.score,
    targetLabel: scoreWord,
    targetUnit: result.advisor === "ml" ? FX.unitPct() : FX.unitLogOdds(),
    methodNote,
    toleranceNote: FX.toleranceNote(),
    maxAbs,
    items,
  };
}

export interface CounterfactualChange {
  input: string;
  from: string;
  to: string;
  outcome: string;
}

export interface CounterfactualExplanation {
  intro: string;
  sentences: string[];
  changes: CounterfactualChange[];
  totalFound: number;
}

export function counterfactualExplanation(result: AdvisorResult): CounterfactualExplanation {
  const p = result.profile;
  const current = result.portfolio.name;
  const advisor = advisorFor(result);
  const findings: { key: string; relativeSize: number; change: CounterfactualChange; sentence: string }[] = [];

  const withChange = (changes: Partial<Profile>) => advisor.recommend({ ...p, ...changes });

  const numeric = [
    { key: "age" as const, label: "age", unit: "years old", limits: CONFIG.LIMITS.age },
    { key: "horizon" as const, label: "horizon", unit: "years", limits: CONFIG.LIMITS.horizon },
  ];
  for (const n of numeric) {
    const range = n.limits.max - n.limits.min;
    let best: { value: number; delta: number; portfolio: string } | null = null;
    for (let delta = 1; delta <= range && !best; delta++) {
      for (const v of [p[n.key] + delta, p[n.key] - delta]) {
        if (v < n.limits.min || v > n.limits.max) continue;
        const r = withChange({ [n.key]: v });
        if (r.portfolio.name !== current) {
          best = { value: v, delta, portfolio: r.portfolio.name };
          break;
        }
      }
    }
    if (best) {
      findings.push({
        key: n.key,
        relativeSize: best.delta / range,
        change: { input: n.label, from: String(p[n.key]), to: `${best.value} ${n.unit}`, outcome: best.portfolio },
        sentence: CF.numeric(n.key, best.value, p[n.key], best.portfolio),
      });
    }
  }

  const tolOrder = ["low", "medium", "high"] as const;
  const tolLabel = { low: "Low", medium: "Medium", high: "High" };
  for (const t of tolOrder) {
    if (t === p.tolerance) continue;
    const r = withChange({ tolerance: t });
    if (r.portfolio.name !== current) {
      const steps = Math.abs(tolOrder.indexOf(t) - tolOrder.indexOf(p.tolerance));
      findings.push({
        key: `tolerance:${t}`,
        relativeSize: 0.5 * steps,
        change: { input: "risk tolerance", from: tolLabel[p.tolerance], to: tolLabel[t], outcome: r.portfolio.name },
        sentence: CF.tolerance(tolLabel[t], tolLabel[p.tolerance], r.portfolio.name),
      });
    }
  }

  const boolFlips: { key: keyof Profile; change: CounterfactualChange | null; sentence: (o: string) => string; value: boolean }[] = [
    {
      key: "emergencyFund",
      value: !p.emergencyFund,
      change: { input: "emergency fund", from: p.emergencyFund ? "yes" : "no", to: p.emergencyFund ? "no" : "yes", outcome: "" },
      sentence: (o) => CF.fund(p.emergencyFund, o),
    },
    {
      key: "incomeStable",
      value: !p.incomeStable,
      change: { input: "income", from: p.incomeStable ? "stable" : "variable", to: p.incomeStable ? "variable" : "stable", outcome: "" },
      sentence: (o) => CF.income(p.incomeStable, o),
    },
    {
      key: "debtObligations",
      value: !p.debtObligations,
      change: { input: "debt", from: p.debtObligations ? "significant" : "none", to: p.debtObligations ? "none" : "significant", outcome: "" },
      sentence: (o) => CF.debt(p.debtObligations, o),
    },
    {
      key: "nearTermNeed",
      value: !p.nearTermNeed,
      change: { input: "near-term need", from: p.nearTermNeed ? "yes" : "no", to: p.nearTermNeed ? "no" : "yes", outcome: "" },
      sentence: (o) => CF.need(p.nearTermNeed, o),
    },
  ];
  for (const f of boolFlips) {
    const r = withChange({ [f.key]: f.value });
    if (r.portfolio.name !== current) {
      findings.push({
        key: f.key,
        relativeSize: 0.5,
        change: { ...(f.change as CounterfactualChange), outcome: r.portfolio.name },
        sentence: f.sentence(r.portfolio.name),
      });
    }
  }

  findings.sort((a, b) => a.relativeSize - b.relativeSize);
  const shown = findings.slice(0, 3);
  const intro = shown.length ? CF.intro(current) : CF.none(current);
  return { intro, sentences: shown.map((f) => f.sentence), changes: shown.map((f) => f.change), totalFound: findings.length };
}

export function contrastiveExplanation(result: AdvisorResult, targetName: string): { target: string; found: boolean; sentence: string } {
  const p = result.profile;
  const advisor = advisorFor(result);
  const current = result.portfolio.name;
  if (targetName === current) return { target: targetName, found: true, sentence: CT.already(current) };

  const withChanges = (changes: Partial<Profile>) => advisor.recommend({ ...p, ...changes });
  const candidates: { size: number; text: string }[] = [];

  const numeric = [
    { key: "age" as const, label: "age", unit: "years old", limits: CONFIG.LIMITS.age },
    { key: "horizon" as const, label: "horizon", unit: "years", limits: CONFIG.LIMITS.horizon },
  ];
  for (const n of numeric) {
    const range = n.limits.max - n.limits.min;
    outer: for (let delta = 1; delta <= range; delta++) {
      for (const v of [p[n.key] + delta, p[n.key] - delta]) {
        if (v < n.limits.min || v > n.limits.max) continue;
        if (withChanges({ [n.key]: v }).portfolio.name === targetName) {
          candidates.push({ size: delta / range, text: CT.numericText(n.key, v, p[n.key]) });
          break outer;
        }
      }
    }
  }

  const tolLabel = { low: "Low", medium: "Medium", high: "High" };
  const flips: { changes: Partial<Profile>; text: string }[] = [];
  for (const t of ["low", "medium", "high"] as const) {
    if (t !== p.tolerance) flips.push({ changes: { tolerance: t }, text: CT.tolText(tolLabel[t], tolLabel[p.tolerance]) });
  }
  flips.push({ changes: { emergencyFund: !p.emergencyFund }, text: CT.fundText(p.emergencyFund) });
  flips.push({ changes: { incomeStable: !p.incomeStable }, text: CT.incomeText(p.incomeStable) });
  flips.push({ changes: { debtObligations: !p.debtObligations }, text: CT.debtText(p.debtObligations) });
  flips.push({ changes: { nearTermNeed: !p.nearTermNeed }, text: CT.needText(p.nearTermNeed) });
  for (const f of flips) {
    if (withChanges(f.changes).portfolio.name === targetName) candidates.push({ size: 0.5, text: f.text });
  }

  candidates.sort((a, b) => a.size - b.size);
  if (candidates.length) {
    return {
      target: targetName,
      found: true,
      sentence: CT.single(targetName, candidates[0].text, candidates.length > 1 ? candidates[1].text : undefined),
    };
  }
  for (let a = 0; a < flips.length; a++) {
    for (let b = a + 1; b < flips.length; b++) {
      const keysA = Object.keys(flips[a].changes);
      const keysB = Object.keys(flips[b].changes);
      if (keysA[0] === keysB[0]) continue;
      if (withChanges({ ...flips[a].changes, ...flips[b].changes }).portfolio.name === targetName) {
        return { target: targetName, found: true, sentence: CT.pair(targetName, flips[a].text, flips[b].text) };
      }
    }
  }
  return { target: targetName, found: false, sentence: CT.notFound(targetName) };
}

export interface ConfidenceExplanation {
  label: "high" | "moderate" | "low";
  labelText: string;
  percent: number;
  sentence: string;
  detail: string;
  probabilities: number[];
}

export function confidenceExplanation(result: AdvisorResult): ConfidenceExplanation {
  const label = result.confidence;
  const pTop = Math.round(result.topProbability * 100);
  const neighbour = result.neighbourPortfolio ? result.neighbourPortfolio.name : null;
  const pSecond = neighbour ? Math.round((result.topProbability - result.margin / 100) * 100) : null;
  return {
    label,
    labelText: CX.labelText(label),
    percent: pTop,
    sentence: CX.sentence(result.advisor, label, result.portfolio.name, pTop, neighbour, pSecond),
    detail: CX.detail(pTop, result.margin),
    probabilities: result.probabilities,
  };
}
