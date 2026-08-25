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
import type { AdvisorResult, Profile } from "./types";

const round1 = (v: number) => Math.round(v * 10) / 10;

function advisorFor(result: AdvisorResult) {
  return ADVISORS[result.advisor];
}

function fmtPoints(points: number) {
  const v = round1(Math.abs(points));
  return `${v} ${v === 1 ? "point" : "points"}`;
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
  const scoreWord = result.targetLabel;
  const items = result.contributions
    .map((c) => {
      const direction = c.points > 0 ? "increased" : c.points < 0 ? "reduced" : "did not change";
      const sentence =
        c.points === 0
          ? `${c.label} (${c.valueText}) did not change ${scoreWord} relative to the baseline.`
          : `${c.label} (${c.valueText}) ${direction} ${scoreWord} by ${fmtPoints(c.points)}.`;
      return { key: c.key, label: c.label, valueText: c.valueText, points: round1(c.points), sentence };
    })
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
  const maxAbs = items.reduce((m, it) => Math.max(m, Math.abs(it.points)), 0);
  const methodNote =
    result.advisor === "ml"
      ? `These are Shapley values of ${result.targetLabel}: the average effect of each input across all orders of adding inputs, computed post hoc by re-running the network 128 times against the baseline profile. They describe the network's behaviour, not readable rules.`
      : "These contributions are read directly from the scorecard's weights: weight of the recommended outcome times the input, minus the same for the baseline profile. They are exact, not estimated, and they add up to the change in evidence.";
  return {
    baselineScore: result.baselineScore,
    rawScore: result.rawScore,
    score: result.score,
    targetLabel: result.targetLabel,
    targetUnit: result.targetUnit,
    methodNote,
    toleranceNote: "Risk tolerance is an input to this model, so it appears above as its own contribution.",
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
        sentence: `If your ${n.label} were ${best.value} ${n.unit} instead of ${p[n.key]}, the advice would change to ${best.portfolio}.`,
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
        sentence: `If your risk tolerance were ${tolLabel[t]} instead of ${tolLabel[p.tolerance]}, the advice would change to ${r.portfolio.name}.`,
      });
    }
  }

  const boolFlips: { key: keyof Profile; change: CounterfactualChange | null; sentence: (o: string) => string; value: boolean }[] = [
    {
      key: "emergencyFund",
      value: !p.emergencyFund,
      change: { input: "emergency fund", from: p.emergencyFund ? "yes" : "no", to: p.emergencyFund ? "no" : "yes", outcome: "" },
      sentence: (o) =>
        p.emergencyFund
          ? `If you did not have a 6-month emergency fund, the advice would change to ${o}.`
          : `If you had a 6-month emergency fund, the advice would change to ${o}.`,
    },
    {
      key: "incomeStable",
      value: !p.incomeStable,
      change: { input: "income", from: p.incomeStable ? "stable" : "variable", to: p.incomeStable ? "variable" : "stable", outcome: "" },
      sentence: (o) =>
        p.incomeStable
          ? `If your income were variable instead of stable, the advice would change to ${o}.`
          : `If your income were stable instead of variable, the advice would change to ${o}.`,
    },
    {
      key: "debtObligations",
      value: !p.debtObligations,
      change: { input: "debt", from: p.debtObligations ? "significant" : "none", to: p.debtObligations ? "none" : "significant", outcome: "" },
      sentence: (o) =>
        p.debtObligations
          ? `If you did not have significant debt or obligations, the advice would change to ${o}.`
          : `If you had significant debt or obligations, the advice would change to ${o}.`,
    },
    {
      key: "nearTermNeed",
      value: !p.nearTermNeed,
      change: { input: "near-term need", from: p.nearTermNeed ? "yes" : "no", to: p.nearTermNeed ? "no" : "yes", outcome: "" },
      sentence: (o) =>
        p.nearTermNeed
          ? `If you did not expect to need this money in the near term, the advice would change to ${o}.`
          : `If you expected to need this money in the near term, the advice would change to ${o}.`,
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
  const intro = shown.length
    ? `The recommendation is ${current}. The smallest single changes that would alter it:`
    : `No single change to one input would alter this recommendation. It would take changes to more than one input to move away from ${current}.`;
  return { intro, sentences: shown.map((f) => f.sentence), changes: shown.map((f) => f.change), totalFound: findings.length };
}

export function contrastiveExplanation(result: AdvisorResult, targetName: string): { target: string; found: boolean; sentence: string } {
  const p = result.profile;
  const advisor = advisorFor(result);
  const current = result.portfolio.name;
  if (targetName === current) return { target: targetName, found: true, sentence: `${current} is already the recommendation.` };

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
          candidates.push({ size: delta / range, text: `your ${n.label} were ${v} ${n.unit} instead of ${p[n.key]}` });
          break outer;
        }
      }
    }
  }

  const tolLabel = { low: "Low", medium: "Medium", high: "High" };
  const flips: { changes: Partial<Profile>; text: string }[] = [];
  for (const t of ["low", "medium", "high"] as const) {
    if (t !== p.tolerance)
      flips.push({ changes: { tolerance: t }, text: `your risk tolerance were ${tolLabel[t]} instead of ${tolLabel[p.tolerance]}` });
  }
  flips.push({
    changes: { emergencyFund: !p.emergencyFund },
    text: p.emergencyFund ? "you had no 6-month emergency fund" : "you had a 6-month emergency fund",
  });
  flips.push({ changes: { incomeStable: !p.incomeStable }, text: p.incomeStable ? "your income were variable" : "your income were stable" });
  flips.push({
    changes: { debtObligations: !p.debtObligations },
    text: p.debtObligations ? "you had no significant debt" : "you had significant debt or obligations",
  });
  flips.push({
    changes: { nearTermNeed: !p.nearTermNeed },
    text: p.nearTermNeed ? "you did not need the money in the near term" : "you might need the money in the near term",
  });
  for (const f of flips) {
    if (withChanges(f.changes).portfolio.name === targetName) candidates.push({ size: 0.5, text: f.text });
  }

  candidates.sort((a, b) => a.size - b.size);
  if (candidates.length) {
    return {
      target: targetName,
      found: true,
      sentence:
        `The advice would be ${targetName} if ${candidates[0].text}.` +
        (candidates.length > 1 ? ` Also if ${candidates[1].text}.` : ""),
    };
  }
  for (let a = 0; a < flips.length; a++) {
    for (let b = a + 1; b < flips.length; b++) {
      const keysA = Object.keys(flips[a].changes);
      const keysB = Object.keys(flips[b].changes);
      if (keysA[0] === keysB[0]) continue;
      if (withChanges({ ...flips[a].changes, ...flips[b].changes }).portfolio.name === targetName) {
        return {
          target: targetName,
          found: true,
          sentence: `No single change would give ${targetName}. It would take two changes, for example if ${flips[a].text} and ${flips[b].text}.`,
        };
      }
    }
  }
  return {
    target: targetName,
    found: false,
    sentence: `No single change, and no pair of changes to tolerance, emergency fund, income, debt or near-term need, would give ${targetName} for a profile like yours. The inputs that keep you away from it are the ones with the largest contributions.`,
  };
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
  const who = result.advisor === "logit" ? "The model" : "The network";
  const label = result.confidence;
  const pTop = Math.round(result.topProbability * 100);
  const neighbour = result.neighbourPortfolio ? result.neighbourPortfolio.name : null;
  const pSecond = neighbour ? Math.round((result.topProbability - result.margin / 100) * 100) : null;
  let sentence: string;
  if (label === "low") {
    sentence = `${who} gives ${result.portfolio.name} only ${pTop} percent probability${neighbour ? `, with ${neighbour} close behind at ${pSecond} percent` : ""}. Small changes in your profile could shift it.`;
  } else if (label === "moderate") {
    sentence = `${who} gives ${result.portfolio.name} ${pTop} percent probability${neighbour ? `, against ${pSecond} percent for ${neighbour}` : ""}. Moderate changes in your profile could shift it.`;
  } else {
    sentence = `${who} gives ${result.portfolio.name} ${pTop} percent probability${neighbour ? `, well ahead of ${neighbour} at ${pSecond} percent` : ""}. It would take a substantial change in your profile to move it.`;
  }
  return {
    label,
    labelText: label.charAt(0).toUpperCase() + label.slice(1) + " confidence",
    percent: pTop,
    sentence,
    detail: `${pTop} percent calibrated probability, ${result.margin} points ahead of the next outcome.`,
    probabilities: result.probabilities,
  };
}
