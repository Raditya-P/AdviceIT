/* How a decision on one case is scored. The dashboard reads these, the
   pre-registration (docs/research/preregistration.md) defines the same
   rules, and scripts/scoring-smoke.ts pins them, so the three cannot drift.

   relied: the participant went with the advice shown. That is Follow, and
   also "Ask a human adviser" when the advice itself was to see a human
   adviser, because then asking one is doing what the advisor said.

   appropriate: relied on sound advice, or did not rely on flawed advice.

   corrected: on flawed advice only, the participant landed on the advice
   that suits the real person: adjusted to that mix, or asked a human
   adviser when that was the sound outcome. A secondary measure. */

export type ScoredRow = Record<string, unknown>;

const HUMAN_REVIEW = "Human review";

export function relied(r: ScoredRow): boolean {
  if (r.decision === "follow") return true;
  return r.decision === "ask-human" && r.recommendedPortfolio === HUMAN_REVIEW;
}

export function appropriate(r: ScoredRow): boolean | null {
  if (r.scenario === "sound") return relied(r);
  if (r.scenario === "flawed") return !relied(r);
  return null;
}

export function corrected(r: ScoredRow): boolean | null {
  if (r.scenario !== "flawed") return null;
  if (r.decision === "adjust") return r.adjustedTo === r.soundPortfolio;
  if (r.decision === "ask-human") return r.soundPortfolio === HUMAN_REVIEW;
  return false;
}

/* Up to 2.15 one of the six cases was an attention check that asked for
   Reject whatever the advice said. Its decision is not a judgement of the
   advice, so it is left out of every reliance figure. Those rows are the
   trial rows without an appVersion that carry an attentionCheck value; from
   3.0.0 every trial row carries one and none is an attention case. */
export function isLegacyAttentionTrial(r: ScoredRow): boolean {
  return r.rowType !== "exit" && !r.appVersion && typeof r.attentionCheck === "string" && r.attentionCheck !== "";
}
