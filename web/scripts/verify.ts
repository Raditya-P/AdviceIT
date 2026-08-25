/* Port verification: the TypeScript libraries must reproduce the numbers
   verified in AdviceIT v1. Run with: npx tsx scripts/verify.ts */
import { ADVISORS, mlMeta, logitMeta, scorecard, mlProbabilities, logitProbabilities } from "../src/lib/advisor/advisors";
import { EXAMPLE_PROFILES, normalizeProfile, deriveSuitabilityLabels, applyFlawedScenario, OUTCOMES } from "../src/lib/advisor/model";
import { featureExplanation, counterfactualExplanation, contrastiveExplanation, confidenceExplanation } from "../src/lib/advisor/explanations";
import { buildPlan, completionCode } from "../src/lib/study";
import bench from "../src/data/ils_bench_cases.json";
import type { RawProfile } from "../src/lib/advisor/types";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) { failures++; console.log("FAIL", name, detail); } else console.log("ok  ", name, detail);
};

// 1. Example profiles: expected outcomes from the v1 suite
const expectMl = ["Aggressive growth", "Balanced", "Conservative", "Human review"];
EXAMPLE_PROFILES.forEach((ex, i) => {
  const r = ADVISORS.ml.recommend(ex.profile);
  check(`example ${ex.id} (ml)`, r.portfolio.name === expectMl[i], `${r.portfolio.name}`);
});
check("example escalation (logit)", ADVISORS.logit.recommend(EXAMPLE_PROFILES[3].profile).portfolio.name === "Human review");

// 2. Training accuracy on all 400 cases from consensus labels must match Python meta
const AGE_PATTERNS = [/\bI am (\d{2})\b/, /\b(\d{2})-year-old/, /\bI'm (\d{2})\b/, /\baged (\d{2})\b/, /\bage (\d{2})\b/, /\bat (\d{2})\b/, /\b(\d{2}) years old/];
function ageOf(text: string) { for (const p of AGE_PATTERNS) { const m = text.match(p); if (m) return parseInt(m[1], 10); } return null; }
// direct label evaluation requires bypassing form rules: emulate via profile that produces the labels? Instead evaluate through label-consistent profiles is complex; use featureVector path indirectly:
// simplest: reuse mlProbabilities on a profile whose derived labels equal the case labels is not general. So test differently: reconstruct via weights like v1 harness.
import weights from "../src/data/ml_weights.json";
const Wt = weights as any;
const oh = (v: string, o: string[]) => o.map((k) => (k === v ? 1 : 0));
function fwd(x: number[]) { let a = x; for (const L of Wt.layers) { const o: number[] = []; for (let j = 0; j < L.b.length; j++) { let s = L.b[j]; for (let k = 0; k < a.length; k++) s += a[k] * L.W[k][j]; o[j] = L.activation === "relu" ? Math.max(0, s) : s; } a = o; } return a; }
function lfwd(x: number[]) { const o: number[] = []; for (let j = 0; j < Wt.logit.b.length; j++) { let s = Wt.logit.b[j]; for (let k = 0; k < x.length; k++) s += x[k] * Wt.logit.W[k][j]; o[j] = s; } return o; }
const argmax = (a: number[]) => a.indexOf(Math.max(...a));
let okMl = 0, okLg = 0;
for (const c of (bench as any).cases) {
  const age = ageOf(c.narrative)!;
  const x = [...oh(c.tolerance, Wt.featureLayout.tolerance), ...oh(c.capacity, Wt.featureLayout.capacity), ...oh(c.liquidity, Wt.featureLayout.liquidity), (age - Wt.featureLayout.age.mean) / Wt.featureLayout.age.std];
  if (Wt.classes[argmax(fwd(x))] === c.portfolio) okMl++;
  if (Wt.classes[argmax(lfwd(x))] === c.portfolio) okLg++;
}
check("ml train accuracy reproduced", Math.abs(okMl / 400 - (mlMeta as any).trainAccuracy) < 0.005, `${okMl / 400} vs ${(mlMeta as any).trainAccuracy}`);
check("logit train accuracy reproduced", Math.abs(okLg / 400 - (logitMeta as any).trainAccuracy) < 0.005, `${okLg / 400} vs ${(logitMeta as any).trainAccuracy}`);

// 3. Shapley efficiency + counterfactual truth + contrastive on a grid
let effBad = 0, cfBad = 0, N = 0;
for (const age of [25, 45, 65]) for (const h of [2, 8, 20]) for (const t of ["low", "high"] as const)
for (const ef of [true, false]) for (const inc of [true, false]) for (const debt of [true, false]) {
  const p: RawProfile = { age, horizon: h, tolerance: t, emergencyFund: ef, incomeStable: inc, debtObligations: debt, nearTermNeed: false };
  N++;
  for (const adv of ["ml", "logit"] as const) {
    const r = ADVISORS[adv].recommend(p);
    const sum = r.contributions.reduce((s, c) => s + c.points, 0);
    if (Math.abs(r.baselineScore + sum - r.rawScore) > 0.3) effBad++;
    const cf = counterfactualExplanation(r);
    for (let i = 0; i < cf.sentences.length; i++) {
      const s = cf.sentences[i];
      const q: any = { ...p };
      let m: RegExpMatchArray | null;
      if ((m = s.match(/If your age were (\d+)/))) q.age = +m[1];
      else if ((m = s.match(/If your horizon were (\d+)/))) q.horizon = +m[1];
      else if ((m = s.match(/risk tolerance were (\w+)/))) q.tolerance = m[1].toLowerCase();
      else if (/did not have a 6-month/.test(s)) q.emergencyFund = false;
      else if (/had a 6-month/.test(s)) q.emergencyFund = true;
      else if (/income were variable/.test(s)) q.incomeStable = false;
      else if (/income were stable/.test(s)) q.incomeStable = true;
      else if (/did not have significant debt/.test(s)) q.debtObligations = false;
      else if (/had significant debt/.test(s)) q.debtObligations = true;
      else if (/did not expect to need this money/.test(s)) q.nearTermNeed = false;
      else if (/expected to need this money/.test(s)) q.nearTermNeed = true;
      const target = s.match(/change to (.+)\.$/)![1];
      if (ADVISORS[adv].recommend(q).portfolio.name !== target) cfBad++;
    }
  }
}
check("shapley efficiency", effBad === 0, `grid ${N}, failures ${effBad}`);
check("counterfactual truth", cfBad === 0, `failures ${cfBad}`);
const r0 = ADVISORS.ml.recommend({ age: 40, horizon: 15, tolerance: "medium", emergencyFund: false, incomeStable: true });
for (const t of ["Growth", "Human review", "Capital preservation"]) {
  const c = contrastiveExplanation(r0, t);
  check(`contrastive ${t}`, typeof c.sentence === "string" && c.sentence.length > 10, c.sentence.slice(0, 60));
}

// 4. Flawed scenario: HR -> automated portfolio, others two steps wrong
const hr = ADVISORS.ml.recommend(EXAMPLE_PROFILES[3].profile);
const fl = applyFlawedScenario(hr);
check("flawed HR gives a portfolio", fl.portfolio.allocation !== null && fl.soundPortfolio.name === "Human review", fl.portfolio.name);

// 5. Study plan seeding + completion code stability
const p1 = buildPlan("P42", 6).map((t) => t.profileId + t.scenario[0]).join(",");
const p2 = buildPlan("P42", 6).map((t) => t.profileId + t.scenario[0]).join(",");
const p3 = buildPlan("P43", 6).map((t) => t.profileId + t.scenario[0]).join(",");
check("plan reproducible", p1 === p2 && p1 !== p3, p1);
check("plan balanced", buildPlan("P42", 6).filter((t) => t.scenario === "sound").length === 3);
check("completion code stable", completionCode("P42") === completionCode("P42") && completionCode("P42") !== completionCode("P43"), completionCode("P42"));

// 6. Scorecard reconstructs logit decisions
const sc = scorecard();
check("scorecard shape", sc.groups.length === 5 && sc.outcomes.length === 6);
const prof = normalizeProfile({ age: 34, horizon: 2, tolerance: "high", emergencyFund: false, incomeStable: false });
const labels = deriveSuitabilityLabels(prof);
const rowFor = (g: string, r: string) => sc.groups.find((x) => x.label === g)!.rows.find((x) => x.label === r)!.points;
const tol = rowFor("Risk tolerance", labels.tolerance), cap = rowFor("Risk capacity", labels.capacity), liq = rowFor("Liquidity need", labels.liquidity);
const agePts = sc.groups.find((g) => g.label === "Age")!.rows[0].points.map((v) => (v * (prof.age - 51)) / 10);
const bias = sc.groups.find((g) => g.label === "Starting points")!.rows[0].points;
const rebuilt = bias.map((b, j) => tol[j] + cap[j] + liq[j] + agePts[j] + b);
check("scorecard winner matches model", OUTCOMES[argmax(rebuilt)].name === ADVISORS.logit.recommend(prof).portfolio.name, OUTCOMES[argmax(rebuilt)].name);

// 7. Probabilities are calibrated distributions
check("ml probs sum to 1", Math.abs(mlProbabilities(prof).reduce((a, b) => a + b, 0) - 1) < 1e-9);
check("logit probs sum to 1", Math.abs(logitProbabilities(prof).reduce((a, b) => a + b, 0) - 1) < 1e-9);
const fx = featureExplanation(r0), cx = confidenceExplanation(r0);
check("feature explanation renders", fx.items.length === 7 && fx.methodNote.includes("Shapley"));
check("confidence explanation renders", cx.probabilities.length === 6);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
