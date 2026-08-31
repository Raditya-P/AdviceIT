/* Routing accuracy for the conversational condition.

   A labelled set of questions in both languages, plus out-of-scope questions
   that must fall through to the language model. The accuracy this prints is a
   number the paper reports, so the set should grow whenever a real participant
   asks something the router mishandles. */

import { matchIntent, answerFor, type Intent } from "@/lib/advisor/intents";
import { mlRecommend } from "@/lib/advisor/advisors";
import { setStringsLocale } from "@/lib/advisor/strings";

type Case = { q: string; want: Intent | null; locale: "en" | "id" };

const CASES: Case[] = [
  // why
  { q: "Why this recommendation?", want: "why", locale: "en" },
  { q: "Why did you suggest that?", want: "why", locale: "en" },
  { q: "Which of my answers mattered most?", want: "why", locale: "en" },
  { q: "What made you pick this one?", want: "why", locale: "en" },
  { q: "Mengapa rekomendasi ini?", want: "why", locale: "id" },
  { q: "Apa alasan saran ini?", want: "why", locale: "id" },
  // change
  { q: "What would change the advice?", want: "change", locale: "en" },
  { q: "How can I change it?", want: "change", locale: "en" },
  { q: "What could I do to improve this?", want: "change", locale: "en" },
  { q: "Apa yang mengubah sarannya?", want: "change", locale: "id" },
  { q: "Apa yang bisa saya lakukan?", want: "change", locale: "id" },
  // confidence
  { q: "How sure are you?", want: "confidence", locale: "en" },
  { q: "What is the probability of that outcome?", want: "confidence", locale: "en" },
  { q: "Seberapa yakin Anda?", want: "confidence", locale: "id" },
  // why not
  { q: "Why not Growth?", want: "whyNot", locale: "en" },
  { q: "Why not Aggressive growth instead?", want: "whyNot", locale: "en" },
  { q: "Mengapa bukan Pertumbuhan?", want: "whyNot", locale: "id" },
  // how the model works
  { q: "How does it work?", want: "how", locale: "en" },
  { q: "What data were you trained on?", want: "how", locale: "en" },
  { q: "How accurate are you?", want: "how", locale: "en" },
  { q: "Bagaimana cara kerja Anda?", want: "how", locale: "id" },
  { q: "Seberapa akurat model ini?", want: "how", locale: "id" },
  // input meaning
  { q: "What does risk capacity mean?", want: "input", locale: "en" },
  { q: "What is my risk tolerance?", want: "input", locale: "en" },
  { q: "Apa arti kapasitas risiko?", want: "input", locale: "id" },
  // out of scope, must fall through to the model
  { q: "Should I buy bitcoin?", want: null, locale: "en" },
  { q: "What do you think of the market this year?", want: null, locale: "en" },
  { q: "Who is the president?", want: null, locale: "en" },
  { q: "Apakah saya harus membeli emas sekarang?", want: null, locale: "id" },
];

const profile = {
  age: 35,
  horizon: 15,
  tolerance: "medium" as const,
  emergencyFund: true,
  incomeStable: true,
  debtObligations: false,
  nearTermNeed: false,
  knowledge: "intermediate",
};
const result = mlRecommend(profile);

let hits = 0;
let failures = 0;
for (const c of CASES) {
  setStringsLocale(c.locale);
  const m = matchIntent(c.q, c.locale, result.escalated);
  const got = m ? m.intent : null;
  const ok = got === c.want;
  if (ok) hits++;
  else {
    failures++;
    console.log(`FAIL  [${c.locale}] "${c.q}" -> ${got ?? "null"} (wanted ${c.want ?? "null"})`);
  }
}

/* Every routable intent must also produce a non-empty answer, in the language
   the question was asked in. */
for (const c of CASES.filter((x) => x.want)) {
  setStringsLocale(c.locale);
  const m = matchIntent(c.q, c.locale, result.escalated);
  if (!m) continue;
  const a = answerFor(m, result, c.locale);
  if (!a || a.length < 10) {
    failures++;
    console.log(`FAIL  empty answer for ${m.intent} from "${c.q}"`);
  }
}

const pct = Math.round((hits / CASES.length) * 1000) / 10;
console.log(`\nrouting accuracy: ${hits}/${CASES.length} (${pct} percent)`);
console.log(failures ? `${failures} FAILURES` : "ALL INTENT CHECKS PASSED");
process.exit(failures ? 1 : 0);
