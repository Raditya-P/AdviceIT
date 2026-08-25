/* The shared vocabulary and rules, ported from AdviceIT v1 model.js.
   Holds the outcome vocabulary (five portfolios plus Human review, the
   ILS-Bench classes), the documented form-to-label rules, the flawed
   scenario shift and the example profiles. The rules follow the ILS-Bench
   codebook: capacity is defined by income, savings, debt and obligations,
   liquidity by the need to access the funds soon. */

import type { Labels, Outcome, Profile, RawProfile, Tolerance } from "./types";

export const CONFIG = {
  LIMITS: {
    age: { min: 18, max: 80 },
    horizon: { min: 1, max: 40 },
  },
  // Liquidity-need bands on the horizon in years (upper bounds, inclusive).
  LIQUIDITY_BANDS: { urgentMax: 2, highMax: 5, moderateMax: 10 },
};

export const PORTFOLIOS: Outcome[] = [
  {
    id: "capital-preservation",
    name: "Capital preservation",
    allocation: { equities: 15, bonds: 50, cash: 30, realAssets: 5 },
    summary: "Capital preservation first: mostly bonds and cash, a small equity sleeve.",
  },
  {
    id: "conservative",
    name: "Conservative",
    allocation: { equities: 30, bonds: 50, cash: 15, realAssets: 5 },
    summary: "Modest growth with limited swings: bonds lead, equities support.",
  },
  {
    id: "balanced",
    name: "Balanced",
    allocation: { equities: 50, bonds: 35, cash: 5, realAssets: 10 },
    summary: "An even mix of growth and stability, the classic middle road.",
  },
  {
    id: "growth",
    name: "Growth",
    allocation: { equities: 70, bonds: 20, cash: 0, realAssets: 10 },
    summary: "Growth oriented: equities dominate, bonds cushion the ride.",
  },
  {
    id: "aggressive-growth",
    name: "Aggressive growth",
    allocation: { equities: 85, bonds: 5, cash: 0, realAssets: 10 },
    summary: "Maximum long-term growth, accepting large short-term swings.",
  },
];

export const HUMAN_REVIEW: Outcome = {
  id: "human-review",
  name: "Human review",
  allocation: null,
  summary: "No automated portfolio. This situation should be reviewed by a human adviser before any advice is given.",
};

export const OUTCOMES: Outcome[] = [...PORTFOLIOS, HUMAN_REVIEW];
export const HUMAN_REVIEW_INDEX = PORTFOLIOS.length;

export const ASSET_CLASSES = [
  { key: "equities" as const, label: "Global equities" },
  { key: "bonds" as const, label: "Bonds" },
  { key: "cash" as const, label: "Cash and money market" },
  { key: "realAssets" as const, label: "Real assets" },
];

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function normalizeProfile(raw: RawProfile): Profile {
  const tolerance: Tolerance =
    raw.tolerance === "low" || raw.tolerance === "high" ? raw.tolerance : "medium";
  return {
    age: clamp(Math.round(Number(raw.age)), CONFIG.LIMITS.age.min, CONFIG.LIMITS.age.max),
    horizon: clamp(Math.round(Number(raw.horizon)), CONFIG.LIMITS.horizon.min, CONFIG.LIMITS.horizon.max),
    tolerance,
    toleranceInconsistent: Boolean(raw.toleranceInconsistent),
    emergencyFund: Boolean(raw.emergencyFund),
    incomeStable: Boolean(raw.incomeStable),
    debtObligations: Boolean(raw.debtObligations),
    nearTermNeed: Boolean(raw.nearTermNeed),
    knowledge: raw.knowledge || "intermediate",
  };
}

const TOLERANCE_LABEL: Record<Tolerance, string> = { low: "Low", medium: "Moderate", high: "High" };

/* Suitability labels in the ILS-Bench vocabulary.
   Capacity counts what could force selling at a loss: no emergency fund,
   variable income, significant debt. None: High. One: Moderate. More: Low.
   Liquidity need follows the horizon, but a concrete near-term need makes
   it Urgent whatever the horizon, as the expert panel judged such cases. */
export function deriveSuitabilityLabels(profile: Profile): Labels {
  const tolerance = profile.toleranceInconsistent ? "Inconsistent" : TOLERANCE_LABEL[profile.tolerance];
  const strains: string[] = [];
  if (!profile.emergencyFund) strains.push("no emergency fund");
  if (!profile.incomeStable) strains.push("variable income");
  if (profile.debtObligations) strains.push("significant debt or obligations");
  const capacity = strains.length === 0 ? "High" : strains.length === 1 ? "Moderate" : "Low";
  const lb = CONFIG.LIQUIDITY_BANDS;
  const liquidity =
    profile.nearTermNeed || profile.horizon <= lb.urgentMax
      ? "Urgent"
      : profile.horizon <= lb.highMax
        ? "High"
        : profile.horizon <= lb.moderateMax
          ? "Moderate"
          : "Low";
  return {
    tolerance,
    capacity,
    liquidity,
    capacityReason: strains.length ? strains.join(" and ") : "emergency fund, stable income, no significant debt",
    liquidityReason: profile.nearTermNeed
      ? "the money may be needed in the near term"
      : `${profile.horizon} ${profile.horizon === 1 ? "year" : "years"} horizon`,
  };
}

/* Flawed advice for measuring appropriate reliance: the shown outcome is
   shifted two portfolios in the wrong direction. A Human review outcome is
   replaced by an automated portfolio two steps more aggressive than the
   score-based second choice, the realistic failure of automating a case
   that should have gone to a human. */
export function applyFlawedScenario<T extends { portfolioIndex: number; scorePortfolio: Outcome; portfolio: Outcome }>(
  result: T,
): T & { flawed: true; soundPortfolio: Outcome; soundPortfolioIndex: number } {
  const idx = result.portfolioIndex;
  let wrongIdx: number;
  if (idx === HUMAN_REVIEW_INDEX) {
    const base = result.scorePortfolio ? PORTFOLIOS.findIndex((p) => p.id === result.scorePortfolio.id) : 2;
    wrongIdx = clamp((base < 0 ? 2 : base) + 2, 0, PORTFOLIOS.length - 1);
  } else {
    wrongIdx = idx <= 2 ? idx + 2 : idx - 2;
    wrongIdx = clamp(wrongIdx, 0, PORTFOLIOS.length - 1);
  }
  return {
    ...result,
    flawed: true as const,
    soundPortfolio: result.portfolio,
    soundPortfolioIndex: result.portfolioIndex,
    portfolio: PORTFOLIOS[wrongIdx],
    portfolioIndex: wrongIdx,
  };
}

export interface ExampleProfile {
  id: string;
  label: string;
  profile: RawProfile;
}

export const EXAMPLE_PROFILES: ExampleProfile[] = [
  {
    id: "young",
    label: "Young long-horizon investor",
    profile: { age: 26, horizon: 30, tolerance: "high", emergencyFund: true, incomeStable: true, knowledge: "beginner" },
  },
  {
    id: "midcareer",
    label: "Mid-career, no safety net",
    profile: { age: 40, horizon: 15, tolerance: "medium", emergencyFund: false, incomeStable: true, knowledge: "intermediate" },
  },
  {
    id: "retirement",
    label: "Near-retirement investor",
    profile: { age: 63, horizon: 6, tolerance: "low", emergencyFund: true, incomeStable: true, knowledge: "advanced" },
  },
  {
    id: "escalation",
    label: "Short horizon, no buffer",
    profile: { age: 34, horizon: 2, tolerance: "high", emergencyFund: false, incomeStable: false, knowledge: "beginner" },
  },
];
