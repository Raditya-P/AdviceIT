/* The intent router in front of the conversational explainer.

   Questions that the instrument can answer exactly are answered from the
   computations, not by the language model. The model is left with the tail:
   phrasings and topics outside the supported set. This follows the hybrid
   prompt handling of Samimi et al. (CUI 2025), where a matcher routes
   analytical queries to backend functions and everything else to a general
   model, and it is the reason a 1.5B model in the browser cannot invent a
   Shapley value here.

   The supported set is taken from the categories of the XAI question bank in
   Liao, Gruen and Miller (CHI 2020): why, why not, what would change it, how
   confident, how does it work, what does this input mean, and why was this
   case escalated.

   Matching is lexical rather than embedding based on purpose. With eight
   intents in two languages a keyword matcher is accurate enough, it adds no
   download, and it runs on devices with no WebGPU. If routing accuracy turns
   out to be the bottleneck, this module is the only thing that has to change. */

import { ASSET_CLASSES, OUTCOMES } from "./model";
import { ASSET_ID, OUTCOME_ID, assetLabel, labelValue, outcomeName, escalationReason, inputLabel } from "./strings";
import {
  confidenceExplanation,
  contrastiveExplanation,
  counterfactualExplanation,
  featureExplanation,
} from "./explanations";
import type { AdvisorResult } from "./types";
import { ADVISORS, mlMeta, logitMeta } from "./advisors";

export type Intent = "why" | "change" | "confidence" | "whyNot" | "how" | "input" | "escalation" | "asset";

export interface IntentMatch {
  intent: Intent;
  /** The outcome, input or asset class the question was about, when it had one. */
  arg?: string;
  score: number;
}

type Lex = Record<Intent, { en: string[]; id: string[] }>;

/* Phrases are matched on a normalised, lowercased string. Multi-word phrases
   count double, since they are far less likely to appear by accident. */
const LEX: Lex = {
  why: {
    en: ["why this", "why did", "why does", "why is", "how come", "reason", "what made", "which of my", "biggest factor", "most important"],
    id: ["mengapa", "kenapa", "alasan", "faktor terbesar", "paling berpengaruh", "yang mana yang"],
  },
  change: {
    en: ["what would change", "what changes", "how do i change", "how can i change", "what if", "flip", "different advice", "change the advice", "change it", "what could i do", "improve"],
    id: ["apa yang mengubah", "bagaimana mengubah", "kalau saya", "bagaimana jika", "berubah", "ubah sarannya", "apa yang bisa saya lakukan", "memperbaiki"],
  },
  confidence: {
    en: ["how sure", "how confident", "confidence", "certain", "probability", "how likely", "how reliable"],
    id: ["seberapa yakin", "keyakinan", "pasti", "probabilitas", "seberapa mungkin", "seberapa andal"],
  },
  whyNot: {
    en: ["why not", "instead of", "rather than", "what about"],
    id: ["mengapa bukan", "kenapa bukan", "alih-alih", "bagaimana dengan"],
  },
  how: {
    en: ["how do you work", "how does it work", "how were you trained", "what data", "training data", "how accurate", "accuracy", "what model", "who made"],
    id: ["bagaimana cara kerja", "dilatih", "data pelatihan", "seberapa akurat", "akurasi", "model apa", "siapa yang membuat"],
  },
  input: {
    en: ["what does", "what is my", "what do you mean by", "define", "meaning of", "risk capacity", "risk tolerance", "liquidity"],
    id: ["apa arti", "apa maksud", "definisi", "kapasitas risiko", "toleransi risiko", "likuiditas"],
  },
  escalation: {
    en: ["human review", "why a human", "why not automate", "refer", "adviser instead", "escalate"],
    id: ["tinjauan manusia", "kenapa manusia", "mengapa manusia", "dirujuk", "eskalasi"],
  },
  asset: {
    en: ["what are equities", "what are bonds", "what is cash", "real assets", "what are shares", "money market", "what is a bond"],
    id: ["apa itu saham", "apa itu obligasi", "apa itu kas", "aset riil", "pasar uang"],
  },
};

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Find the outcome, input or asset class a question refers to, in either
 *  language, so the answer can be about the thing that was actually asked. */
function findArg(text: string, intent: Intent, locale: "en" | "id"): string | undefined {
  /* Match the English canonical name and the Indonesian display name
     explicitly, rather than whichever one the strings module currently holds,
     so routing does not depend on module state. */
  if (intent === "whyNot") {
    for (const o of OUTCOMES) {
      const names = [o.name, OUTCOME_ID[o.name] ?? o.name, outcomeName(o.name)];
      if (names.some((n) => text.includes(normalise(n)))) return o.name;
    }
    return undefined;
  }
  if (intent === "asset") {
    for (const ac of ASSET_CLASSES) {
      const names = [ac.label, ASSET_ID[ac.label] ?? ac.label, assetLabel(ac.label)];
      if (names.some((n) => text.includes(normalise(n)))) return ac.key;
    }
    return undefined;
  }
  if (intent === "input") {
    const keys = ["tolerance", "capacity", "liquidity"];
    const words: Record<string, string[]> = {
      tolerance: ["tolerance", "toleransi"],
      capacity: ["capacity", "kapasitas"],
      liquidity: ["liquidity", "likuiditas"],
    };
    for (const k of keys) if (words[k].some((w) => text.includes(w))) return k;
    for (const key of ["age", "horizon", "emergencyFund", "incomeStable", "debtObligations", "nearTermNeed"]) {
      if (text.includes(normalise(inputLabel(key)))) return key;
    }
    return undefined;
  }
  void locale;
  return undefined;
}

export function matchIntent(question: string, locale: "en" | "id", escalated: boolean): IntentMatch | null {
  const text = normalise(question);
  if (text.length < 3) return null;
  let best: IntentMatch | null = null;
  for (const key of Object.keys(LEX) as Intent[]) {
    if (key === "escalation" && !escalated) continue;
    let score = 0;
    for (const phrase of [...LEX[key].en, ...LEX[key].id]) {
      if (text.includes(phrase)) score += phrase.includes(" ") ? 2 : 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { intent: key, score, arg: findArg(text, key, locale) };
  }
  /* "Why not X" beats a bare "why" whenever an outcome was named. */
  if (best && best.intent === "why") {
    const target = findArg(text, "whyNot", locale);
    const negated = text.includes("why not") || text.includes("mengapa bukan") || text.includes("kenapa bukan");
    if (target && negated) return { intent: "whyNot", arg: target, score: best.score + 1 };
  }
  return best;
}

/* ------------------------------- answers ------------------------------- */

const pick = (locale: "en" | "id", en: string, id: string) => (locale === "id" ? id : en);

export function answerFor(
  match: IntentMatch,
  result: AdvisorResult,
  locale: "en" | "id",
): string | null {
  const outcome = outcomeName(result.portfolio.name);
  switch (match.intent) {
    case "why": {
      const fx = featureExplanation(result);
      const items = fx.items.filter((it) => it.points !== 0).slice(0, 3);
      if (!items.length) return null;
      return (
        pick(locale, `Here is what drove ${outcome}, in order of size.`, `Berikut yang mendorong ${outcome}, berurutan menurut besarnya.`) +
        "\n\n" +
        items.map((it) => "- " + it.sentence).join("\n") +
        "\n\n" +
        fx.methodNote
      );
    }
    case "change": {
      const cf = counterfactualExplanation(result);
      if (!cf.sentences.length) return cf.intro;
      return cf.intro + "\n\n" + cf.sentences.map((x) => "- " + x).join("\n");
    }
    case "confidence": {
      const cx = confidenceExplanation(result);
      const bars = cx.probabilities
        .map((p, i) => ({ name: outcomeName(OUTCOMES[i].name), pct: Math.round(p * 100) }))
        .filter((x) => x.pct >= 1)
        .sort((a, b) => b.pct - a.pct)
        .map((x) => `- ${x.name}: ${x.pct}%`)
        .join("\n");
      return `${cx.labelText}. ${cx.sentence}\n\n${bars}`;
    }
    case "whyNot": {
      if (!match.arg) return null;
      if (match.arg === result.portfolio.name) {
        return pick(
          locale,
          `${outcome} is the recommendation, so there is nothing to contrast it with. Ask about a different outcome.`,
          `${outcome} justru rekomendasinya, jadi tidak ada yang dibandingkan. Tanyakan hasil yang lain.`,
        );
      }
      return contrastiveExplanation(result, match.arg).sentence;
    }
    case "how": {
      const meta = result.advisor === "ml" ? mlMeta : logitMeta;
      const cv = Math.round((meta.cvAccuracy as number) * 100);
      const name = result.advisor === "ml" ? ADVISORS.ml.name : ADVISORS.logit.name;
      return pick(
        locale,
        `I am the ${name.toLowerCase()}. I was trained on ILS-Bench, ${mlMeta.cases} investor cases whose labels were agreed by a panel of four financial experts, and I score ${cv} percent in cross-validation on six outcomes including Human review. The Training data page shows the dataset, the results and every case.`,
        `Saya adalah ${name.toLowerCase()}. Saya dilatih pada ILS-Bench, ${mlMeta.cases} kasus investor yang labelnya disepakati panel empat ahli keuangan, dan akurasi validasi silang saya ${cv} persen pada enam hasil termasuk Tinjauan manusia. Halaman Data pelatihan menampilkan datasetnya, hasilnya, dan setiap kasus.`,
      );
    }
    case "input": {
      const L = result.labels;
      if (match.arg === "tolerance" || !match.arg) {
        return pick(
          locale,
          `Risk tolerance is how much movement in value you say you can live with. Yours reads as ${labelValue(L.tolerance)}.`,
          `Toleransi risiko adalah seberapa besar naik turun nilai yang Anda nyatakan sanggup Anda jalani. Milik Anda terbaca ${labelValue(L.tolerance)}.`,
        );
      }
      if (match.arg === "capacity") {
        return pick(
          locale,
          `Risk capacity is how much loss your situation could absorb before you would be forced to sell. It counts an emergency fund, income stability and debt. Yours reads as ${labelValue(L.capacity)}, because of ${L.capacityReason}.`,
          `Kapasitas risiko adalah seberapa besar kerugian yang bisa ditanggung situasi Anda sebelum Anda terpaksa menjual. Ini menghitung dana darurat, stabilitas pendapatan, dan utang. Milik Anda terbaca ${labelValue(L.capacity)}, karena ${L.capacityReason}.`,
        );
      }
      if (match.arg === "liquidity") {
        return pick(
          locale,
          `Liquidity need is how soon the money may be needed. Yours reads as ${labelValue(L.liquidity)}, from ${L.liquidityReason}.`,
          `Kebutuhan likuiditas adalah seberapa cepat uangnya mungkin dibutuhkan. Milik Anda terbaca ${labelValue(L.liquidity)}, dari ${L.liquidityReason}.`,
        );
      }
      return null;
    }
    case "escalation": {
      if (!result.escalated) return null;
      return escalationReason(result.advisor, result.labels.tolerance, result.labels.capacity, result.labels.liquidity);
    }
    case "asset":
      /* Answered by the outcome guide on the page, not here, so that the
         chat never becomes a second source of financial description. */
      return null;
    default:
      return null;
  }
}

/** Questions offered as chips, so people can see what is answerable exactly.
 *  Wording follows the XAI question bank categories. */
export function suggestedQuestions(result: AdvisorResult, locale: "en" | "id"): string[] {
  const qs = [
    pick(locale, "Why this recommendation?", "Mengapa rekomendasi ini?"),
    pick(locale, "What would change it?", "Apa yang akan mengubahnya?"),
    pick(locale, "How sure are you?", "Seberapa yakin Anda?"),
    pick(locale, "What does risk capacity mean?", "Apa arti kapasitas risiko?"),
  ];
  if (result.escalated) qs.push(pick(locale, "Why human review?", "Mengapa tinjauan manusia?"));
  else {
    const other = OUTCOMES.find((o) => o.name !== result.portfolio.name && o.allocation);
    if (other) qs.push(pick(locale, `Why not ${outcomeName(other.name)}?`, `Mengapa bukan ${outcomeName(other.name)}?`));
  }
  return qs;
}
