/* The study flow definition, ported from AdviceIT v1 study.js and extended
   for the public site: seeded reproducible trial plans, random assignment
   of explanation condition and advisor (both logged), an attention check,
   consent and debrief texts, an exit questionnaire, and a verifiable
   completion code. */

import type { RawProfile } from "./advisor/types";

export interface StudyCase {
  id: string;
  label: string;
  profile: RawProfile;
  text: string;
}

export const CASES: StudyCase[] = [
  {
    id: "C1",
    label: "Early career saver",
    profile: { age: 27, horizon: 30, tolerance: "high", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
    text: "You are 27, in a permanent job with a steady salary, and you have six months of expenses in a savings account. You are investing for retirement, roughly 30 years away, and you say you are comfortable with large swings in value along the way.",
  },
  {
    id: "C2",
    label: "Mid-career, no buffer",
    profile: { age: 40, horizon: 15, tolerance: "medium", emergencyFund: false, incomeStable: true, knowledge: "intermediate" },
    text: "You are 40, employed with a stable income, but you do not have an emergency fund set aside. This money is for a goal about 15 years away, and you describe your attitude to risk as moderate.",
  },
  {
    id: "C3",
    label: "Approaching retirement",
    profile: { age: 61, horizon: 6, tolerance: "low", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
    text: "You are 61, still working with a stable income, with a solid cash reserve. You expect to start drawing on this money in about 6 years, and you prefer to avoid large losses even if that means lower returns.",
  },
  {
    id: "C4",
    label: "Freelancer with a near-term need",
    profile: { age: 34, horizon: 2, tolerance: "high", emergencyFund: false, incomeStable: false, nearTermNeed: true, knowledge: "intermediate" },
    text: "You are 34, self-employed with an income that varies a lot from month to month, and only a small cash reserve. You may need this money within about 2 years for a house deposit, but you say you want the highest possible return.",
  },
  {
    id: "C5",
    label: "Steady mid-life investor",
    profile: { age: 48, horizon: 12, tolerance: "medium", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
    text: "You are 48, with a stable job and a comfortable emergency fund. This money is for a goal about 12 years away, and you describe yourself as moderately comfortable with risk.",
  },
  {
    id: "C6",
    label: "Young, variable income",
    profile: { age: 30, horizon: 20, tolerance: "medium", emergencyFund: true, incomeStable: false, knowledge: "intermediate" },
    text: "You are 30, working on short contracts so your income is irregular, but you keep six months of expenses in cash. You are investing for about 20 years and would accept moderate ups and downs.",
  },
  {
    id: "C7",
    label: "Cautious saver, long horizon",
    profile: { age: 36, horizon: 25, tolerance: "low", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
    text: "You are 36, in a secure job with a full emergency fund. You are investing for about 25 years, but you say you would find any noticeable loss stressful and prefer a cautious approach.",
  },
  {
    id: "C8",
    label: "Late starter",
    profile: { age: 55, horizon: 10, tolerance: "high", emergencyFund: false, incomeStable: true, debtObligations: true, knowledge: "intermediate" },
    text: "You are 55, employed with a stable income, without an emergency fund and still repaying a sizeable loan. You want to catch up on retirement savings over the next 10 years and say you are willing to take substantial risk to do so.",
  },
];

/* Seeded generator (mulberry32) so a participant ID always yields the same
   trial order: the link is the assignment. */
export function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface Trial {
  index: number;
  profileId: string;
  label: string;
  text: string;
  profile: RawProfile;
  scenario: "sound" | "flawed";
  attention: boolean;
}

export function buildPlan(participantId: string, n = 6): Trial[] {
  const count = Math.max(2, Math.min(12, n));
  const rand = mulberry32(hashString(String(participantId || "anon")));
  const cases = shuffle(CASES, rand);
  const picked: StudyCase[] = [];
  for (let i = 0; i < count; i++) picked.push(cases[i % cases.length]);
  let scenarios: ("sound" | "flawed")[] = [];
  for (let k = 0; k < count; k++) scenarios.push(k < Math.ceil(count / 2) ? "sound" : "flawed");
  scenarios = shuffle(scenarios, rand);
  const attentionIndex = Math.min(2, count - 1);
  return picked.map((c, idx) => ({
    index: idx,
    profileId: c.id,
    label: c.label,
    text: c.text,
    profile: c.profile,
    scenario: scenarios[idx],
    attention: idx === attentionIndex,
  }));
}

/* Random assignment for the public study. "none" stays in the pool as the
   control. The conversational condition is excluded from random assignment
   because it needs WebGPU and a large download. */
export const ASSIGNABLE_CONDITIONS = ["none", "feature", "counterfactual", "confidence", "hybrid", "interactive", "adaptive"] as const;
export type Condition = (typeof ASSIGNABLE_CONDITIONS)[number] | "llm";

export function randomParticipantId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "P-";
  for (let i = 0; i < 6; i++) id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  return id;
}

export function randomCondition(): Condition {
  return ASSIGNABLE_CONDITIONS[Math.floor(Math.random() * ASSIGNABLE_CONDITIONS.length)];
}

export function randomAdvisor(): "ml" | "logit" {
  return Math.random() < 0.5 ? "ml" : "logit";
}

/* Verifiable completion code: derived from the participant ID, so the
   researcher can check a claimed code against the ID. */
export function completionCode(participantId: string) {
  const h = hashString("adviceit:" + participantId);
  return "AIT-" + h.toString(36).toUpperCase().slice(0, 6);
}

export const TEXTS = {
  consentTitle: "Before you start",
  consent: [
    "This is a research study about how people use investment advice from an automated advisor. It takes about 10 to 15 minutes.",
    "You will read a few short descriptions of hypothetical investors, see the advisor's recommendation for each of them, and tell us whether you would follow it and how much you trust it. Three questions about financial knowledge come first, and two open questions come at the end.",
    "Nothing here is real financial advice, and no real money is involved. Please answer as the person described in each case.",
    "Your answers are stored under an anonymous participant ID together with the recommendation you saw and your responses. No name, email or account information is collected, and nothing can identify you. You can stop at any time by closing this page, and you can ask for your data to be deleted by quoting your participant ID.",
    "This is a pilot study run to develop the instrument. By continuing you confirm that you have read this and agree to take part.",
  ],
  literacyTitle: "Three quick questions",
  literacyIntro: "These questions are about general financial knowledge. There is no penalty for answering “Do not know”.",
  exitTitle: "Two final questions",
  exitIntro: "In your own words. A sentence or two is plenty, and you can leave them empty.",
  exitQ1: "Was there a moment you distrusted the advice? What made you notice?",
  exitQ2: "What would you have wanted the advisor to explain that it did not?",
  debriefTitle: "Thank you. One more thing you should know",
  debriefIntro:
    "In this study some of the recommendations you saw were deliberately altered to be unsuitable for the case, in order to measure how people react to good and bad automated advice. The altered trials were:",
  debriefOutro:
    "The advisor and the recommendations are part of a research instrument, not a financial service. If you have questions about the study, please contact the researcher.",
  doneTitle: "All done",
  done: "Your responses have been recorded. Thank you for contributing to this research. Your completion code:",
};

export const LITERACY_CORRECT: Record<string, string> = { lit1: "more", lit2: "less", lit3: "false" };

export const LITERACY_QUESTIONS = [
  {
    name: "lit1",
    text: "Suppose you had 100 in a savings account and the interest rate was 2 percent per year. After 5 years, how much do you think you would have in the account if you left the money to grow?",
    options: [
      { value: "more", label: "More than 102" },
      { value: "exact", label: "Exactly 102" },
      { value: "less", label: "Less than 102" },
      { value: "dk", label: "Do not know" },
    ],
  },
  {
    name: "lit2",
    text: "Imagine that the interest rate on your savings account was 1 percent per year and inflation was 2 percent per year. After 1 year, how much would you be able to buy with the money in this account?",
    options: [
      { value: "more", label: "More than today" },
      { value: "same", label: "Exactly the same" },
      { value: "less", label: "Less than today" },
      { value: "dk", label: "Do not know" },
    ],
  },
  {
    name: "lit3",
    text: "Buying a single company's stock usually provides a safer return than a stock mutual fund.",
    options: [
      { value: "true", label: "True" },
      { value: "false", label: "False" },
      { value: "dk", label: "Do not know" },
    ],
  },
];
