/* The scoring rules (src/lib/scoring.ts), case by case. These are the rules
   the pre-registration states, so a change here is a change to the
   pre-registered analysis and must show up as a failing check first. */

import { appropriate, corrected, isLegacyAttentionTrial, relied } from "@/lib/scoring";
import { relianceTable } from "@/lib/analytics";

let failures = 0;
function ok(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`ok   ${name}`);
  else {
    failures++;
    console.log(`FAIL ${name} ${detail}`);
  }
}

const row = (over: Record<string, unknown>) => ({
  rowType: "trial",
  appVersion: "3.0.0",
  scenario: "sound",
  recommendedPortfolio: "Growth",
  soundPortfolio: "Growth",
  attentionCheck: "passed",
  ...over,
});

/* Relying on the advice. */
ok("follow relies", relied(row({ decision: "follow" })));
ok("reject does not rely", !relied(row({ decision: "reject" })));
ok("adjust does not rely", !relied(row({ decision: "adjust", adjustedTo: "Balanced" })));
ok("asking a human does not rely on a mix", !relied(row({ decision: "ask-human" })));
ok(
  "asking a human relies on a referral",
  relied(row({ decision: "ask-human", recommendedPortfolio: "Human review", soundPortfolio: "Human review" })),
);
ok(
  "following a referral relies on it",
  relied(row({ decision: "follow", recommendedPortfolio: "Human review", soundPortfolio: "Human review" })),
);

/* Appropriate reliance. */
ok("follow on sound is appropriate", appropriate(row({ decision: "follow" })) === true);
ok("reject on sound is not", appropriate(row({ decision: "reject" })) === false);
ok("follow on flawed is not", appropriate(row({ scenario: "flawed", recommendedPortfolio: "Conservative", decision: "follow" })) === false);
ok("reject on flawed is appropriate", appropriate(row({ scenario: "flawed", recommendedPortfolio: "Conservative", decision: "reject" })) === true);
ok(
  "asking a human on a sound referral is appropriate",
  appropriate(row({ decision: "ask-human", recommendedPortfolio: "Human review", soundPortfolio: "Human review" })) === true,
);
ok(
  "asking a human on flawed advice is appropriate",
  appropriate(row({ scenario: "flawed", recommendedPortfolio: "Balanced", soundPortfolio: "Human review", decision: "ask-human" })) === true,
);
ok("no scenario, no score", appropriate(row({ scenario: undefined, decision: "follow" })) === null);

/* Correcting flawed advice. */
const flawed = { scenario: "flawed", recommendedPortfolio: "Conservative", soundPortfolio: "Growth" };
ok("adjusting to the sound mix corrects", corrected(row({ ...flawed, decision: "adjust", adjustedTo: "Growth" })) === true);
ok("adjusting elsewhere does not", corrected(row({ ...flawed, decision: "adjust", adjustedTo: "Balanced" })) === false);
ok("rejecting does not correct", corrected(row({ ...flawed, decision: "reject" })) === false);
ok(
  "asking a human corrects when a referral was due",
  corrected(row({ scenario: "flawed", recommendedPortfolio: "Balanced", soundPortfolio: "Human review", decision: "ask-human" })) === true,
);
ok("sound advice has nothing to correct", corrected(row({ decision: "follow" })) === null);

/* The old pilot's attention case. */
ok("pre-3.0 attention case is recognised", isLegacyAttentionTrial({ rowType: "trial", attentionCheck: "passed" }));
ok("pre-3.0 ordinary case is kept", !isLegacyAttentionTrial({ rowType: "trial", attentionCheck: "" }));
ok("3.0 case with an attention result is kept", !isLegacyAttentionTrial(row({})));
ok("exit rows are not cases", !isLegacyAttentionTrial({ rowType: "exit", attentionCheck: "passed" }));

/* The dashboard table uses the same rules: one sound referral answered with
   "ask a human", one flawed case rejected, one old attention case (which
   asked for Reject on sound advice) left out. */
const table = relianceTable([
  row({ condition: "none", decision: "ask-human", recommendedPortfolio: "Human review", soundPortfolio: "Human review" }),
  row({ condition: "none", scenario: "flawed", recommendedPortfolio: "Conservative", decision: "reject" }),
  { rowType: "trial", condition: "none", scenario: "sound", decision: "reject", attentionCheck: "passed" },
]);
const all = table.find((r) => r.condition === "All conditions");
ok("the table leaves the old attention case out", all?.n === 2, String(all?.n));
ok("the table scores both remaining cases appropriate", all?.appropriate === "100%", all?.appropriate);

console.log(failures ? `\n${failures} FAILURES` : "\nALL SCORING CHECKS PASSED");
process.exit(failures ? 1 : 0);
