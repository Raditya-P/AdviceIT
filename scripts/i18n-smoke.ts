/* i18n smoke test: EN output must be byte-identical to the stored canonical
   strings, ID output must exist, differ from EN, and contain no English
   leftovers for the common sentence shapes. */
import { mlRecommend, logitRecommend } from "@/lib/advisor/advisors";
import {
  featureExplanation,
  counterfactualExplanation,
  contrastiveExplanation,
  confidenceExplanation,
} from "@/lib/advisor/explanations";
import { setStringsLocale, outcomeName, escalationReason } from "@/lib/advisor/strings";

let failures = 0;
const ok = (cond: boolean, label: string, extra = "") => {
  if (!cond) failures++;
  console.log(`${cond ? "ok  " : "FAIL"} ${label}${cond ? "" : " " + extra}`);
};

const profiles = [
  { age: 35, horizon: 15, tolerance: "medium" as const, emergencyFund: true, incomeStable: true, debtObligations: false, nearTermNeed: false },
  { age: 27, horizon: 30, tolerance: "high" as const, emergencyFund: true, incomeStable: true, debtObligations: false, nearTermNeed: false },
  { age: 34, horizon: 2, tolerance: "high" as const, emergencyFund: false, incomeStable: false, debtObligations: false, nearTermNeed: true },
  { age: 61, horizon: 6, tolerance: "low" as const, emergencyFund: true, incomeStable: true, debtObligations: false, nearTermNeed: false },
  { age: 55, horizon: 10, tolerance: "high" as const, emergencyFund: false, incomeStable: true, debtObligations: true, nearTermNeed: false },
];

for (const advisorFn of [mlRecommend, logitRecommend]) {
  for (const p of profiles) {
    const r = advisorFn(p);
    setStringsLocale("en");
    const fxEn = featureExplanation(r);
    const cfEn = counterfactualExplanation(r);
    const cxEn = confidenceExplanation(r);
    // EN must reproduce the stored canonical texts exactly
    ok(fxEn.targetLabel === r.targetLabel, `${r.advisor} EN targetLabel canonical`, `${fxEn.targetLabel} vs ${r.targetLabel}`);
    for (const it of fxEn.items) {
      const stored = r.contributions.find((c) => c.key === it.key)!;
      ok(it.label === stored.label && it.valueText === stored.valueText, `${r.advisor} EN item ${it.key} canonical`, `${it.label}|${it.valueText} vs ${stored.label}|${stored.valueText}`);
    }
    if (r.escalated) {
      const gen = escalationReason(r.advisor, r.labels.tolerance, r.labels.capacity, r.labels.liquidity);
      ok(gen === r.escalationReason, `${r.advisor} EN escalation canonical`, `${gen} VS ${r.escalationReason}`);
    }
    setStringsLocale("id");
    const fxId = featureExplanation(r);
    const cfId = counterfactualExplanation(r);
    const cxId = confidenceExplanation(r);
    ok(fxId.items.length === fxEn.items.length, `${r.advisor} ID same item count`);
    ok(fxId.items.every((it) => !/increased|reduced|did not change/.test(it.sentence)), `${r.advisor} ID feature sentences translated`, fxId.items.map((i) => i.sentence).join(" | "));
    ok(!/If your|the advice would change/.test(cfId.sentences.join(" ")), `${r.advisor} ID cf sentences translated`, cfId.sentences.join(" | "));
    ok(cfId.intro !== cfEn.intro, `${r.advisor} ID cf intro differs`);
    ok(/persen|probabilitas|Keyakinan|yakin/i.test(cxId.labelText + cxId.sentence), `${r.advisor} ID confidence translated`, cxId.sentence);
    // points identical across locales
    ok(fxId.items.every((it, i) => it.points === fxEn.items[i].points), `${r.advisor} points identical EN/ID`);
    ok(cxId.percent === cxEn.percent, `${r.advisor} confidence percent identical`);
    // contrastive in ID
    const target = r.portfolio.name === "Balanced" ? "Growth" : "Balanced";
    const ctId = contrastiveExplanation(r, target);
    ok(!/The advice would be|No single change/.test(ctId.sentence), `${r.advisor} ID contrastive translated`, ctId.sentence);
    setStringsLocale("en");
    const ctEn = contrastiveExplanation(r, target);
    ok(ctEn.found === ctId.found, `${r.advisor} contrastive found flag identical`);
  }
}

setStringsLocale("id");
ok(outcomeName("Human review") === "Tinjauan manusia", "ID outcome name");
setStringsLocale("en");
ok(outcomeName("Human review") === "Human review", "EN outcome name");

console.log(failures ? `\n${failures} FAILURES` : "\nALL I18N CHECKS PASSED");
process.exit(failures ? 1 : 0);
