/* Shared types for the advisor pipeline. Ported from the verified vanilla
   modules of AdviceIT v1 (model.js, ml_model.js, logit_model.js). */

export type Tolerance = "low" | "medium" | "high";

export interface Profile {
  age: number;
  horizon: number;
  tolerance: Tolerance;
  toleranceInconsistent: boolean;
  emergencyFund: boolean;
  incomeStable: boolean;
  debtObligations: boolean;
  nearTermNeed: boolean;
  knowledge: string;
}

export type RawProfile = Partial<Profile> & { age: number; horizon: number };

export interface Labels {
  tolerance: string;
  capacity: string;
  liquidity: string;
  capacityReason: string;
  liquidityReason: string;
}

export interface Outcome {
  id: string;
  name: string;
  allocation: { equities: number; bonds: number; cash: number; realAssets: number } | null;
  summary: string;
}

export interface Contribution {
  key: string;
  label: string;
  valueText: string;
  points: number;
}

export interface AdvisorResult {
  advisor: "ml" | "logit";
  profile: Profile;
  labels: Labels;
  contributions: Contribution[];
  targetLabel: string;
  targetUnit: string;
  baselineScore: number;
  rawScore: number;
  score: number;
  probabilities: number[];
  portfolioIndex: number;
  portfolio: Outcome;
  escalated: boolean;
  escalationReason: string | null;
  scorePortfolio: Outcome;
  margin: number;
  topProbability: number;
  confidence: "high" | "moderate" | "low";
  neighbourPortfolio: Outcome;
  contribIntro: string;
  contribTotal: string;
  flawed?: boolean;
  soundPortfolio?: Outcome;
  soundPortfolioIndex?: number;
}

export interface Advisor {
  id: "ml" | "logit";
  name: string;
  description: string;
  recommend: (p: RawProfile) => AdvisorResult;
}
