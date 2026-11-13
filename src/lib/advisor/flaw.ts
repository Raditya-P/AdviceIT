/* Flawed advice, for measuring appropriate reliance.

   The advisor is given one or two wrong facts about the person, a misread,
   the way a real system goes wrong when an answer is entered or parsed
   incorrectly. Its advice is then unsuitable for the person actually
   described, while everything it says about its own reasoning stays true:
   the explanations describe the facts it was given, wrong ones included.
   A participant can catch the flaw by judging the advice against the case,
   or, with an explanation, by noticing a fact that does not match the case.

   This replaces the shifted-outcome flaw used up to 2.15. That one showed a
   different outcome from the one the advisor computed, so its explanations
   attached the computed outcome's numbers to the shown outcome's name. */

import { ADVISORS } from "./advisors";
import { PORTFOLIOS } from "./model";
import type { AdvisorResult, Outcome, Profile, RawProfile } from "./types";

export type Misread = Partial<
  Pick<Profile, "horizon" | "tolerance" | "emergencyFund" | "incomeStable" | "debtObligations" | "nearTermNeed">
>;

export type FlawedResult = AdvisorResult & {
  flawed: true;
  misread: Misread;
  soundPortfolio: Outcome;
  soundPortfolioIndex: number;
};

/** The advice the advisor gives when it reads `misread` in place of the
 *  real facts, carrying the advice it would have given on the real ones. */
export function recommendWithMisread(advisorId: "ml" | "logit", profile: RawProfile, misread: Misread): FlawedResult {
  const advisor = ADVISORS[advisorId];
  const sound = advisor.recommend(profile);
  const shown = advisor.recommend({ ...profile, ...misread });
  return { ...shown, flawed: true, misread, soundPortfolio: sound.portfolio, soundPortfolioIndex: sound.portfolioIndex };
}

const MISREAD_KEYS = ["horizon", "tolerance", "emergencyFund", "incomeStable", "debtObligations", "nearTermNeed"] as const;

/** For the data: "horizon:15>5;tolerance:medium>low", real value first. */
export function misreadCode(misread: Misread, profile: RawProfile): string {
  return MISREAD_KEYS.filter((k) => misread[k] !== undefined)
    .map((k) => `${k}:${String(profile[k] ?? false)}>${String(misread[k])}`)
    .join(";");
}

/* How far apart two outcomes are, for judging whether a misread makes the
   advice clearly wrong: steps along the five mixes, and a referral to a
   person against any mix counts as far apart. */
export function outcomeDistance(a: Outcome, b: Outcome): number {
  if (a.id === b.id) return 0;
  if (a.allocation === null || b.allocation === null) return 9;
  return Math.abs(PORTFOLIOS.findIndex((p) => p.id === a.id) - PORTFOLIOS.findIndex((p) => p.id === b.id));
}

/* The single misreads tried when a researcher previews flawed advice for a
   profile of their own on the advisor pages. Study cases use the misreads
   fixed in src/lib/study.ts instead, so every participant meets the same
   flaw for the same case. */
function candidates(p: Profile): Misread[] {
  const list: Misread[] = [
    { tolerance: "low" },
    { tolerance: "medium" },
    { tolerance: "high" },
    { horizon: 2 },
    { horizon: 5 },
    { horizon: 20 },
    { horizon: 30 },
    { emergencyFund: !p.emergencyFund },
    { incomeStable: !p.incomeStable },
    { nearTermNeed: !p.nearTermNeed },
    { debtObligations: !p.debtObligations },
  ];
  return list.filter((m) => MISREAD_KEYS.some((k) => m[k] !== undefined && m[k] !== p[k]));
}

/** The single misread that moves this advisor's advice furthest from what
 *  it gives on the real facts, preferring confident wrong advice. Null when
 *  no single fact moves the advice clearly (two steps or a referral). */
export function findMisread(advisorId: "ml" | "logit", profile: RawProfile): Misread | null {
  const advisor = ADVISORS[advisorId];
  const sound = advisor.recommend(profile);
  let best: { misread: Misread; distance: number; confidence: number } | null = null;
  for (const m of candidates(sound.profile)) {
    const shown = advisor.recommend({ ...profile, ...m });
    const distance = outcomeDistance(sound.portfolio, shown.portfolio);
    if (distance < 2) continue;
    const score = Math.min(distance, 3) + shown.topProbability;
    if (!best || score > Math.min(best.distance, 3) + best.confidence) {
      best = { misread: m, distance, confidence: shown.topProbability };
    }
  }
  return best ? best.misread : null;
}
