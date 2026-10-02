/* Locale-aware strings for everything the advisors GENERATE: outcome names,
   input labels and value texts, the feature, counterfactual, contrastive
   and confidence sentences, escalation reasons and reconciliation lines.

   The English templates reproduce the verified v1 sentences byte for byte,
   so the verification suite (which re-parses counterfactual sentences) and
   the logged values stay unchanged. Logs always store the English
   canonical values; translation happens in what is displayed. */

let L: "en" | "id" = "en";
export function setStringsLocale(locale: "en" | "id") {
  L = locale;
}
export function stringsLocale() {
  return L;
}

const pick = <T,>(en: T, id: T): T => (L === "id" ? id : en);

/* Indonesian writes decimals with a comma (4,2): a point there separates
   thousands, so "4.2 poin" reads wrong. English output is untouched. */
export const num = (n: number | string) => (L === "id" ? String(n).replace(".", ",") : String(n));

/* ---------------- Display names ---------------- */
export const OUTCOME_ID: Record<string, string> = {
  "Capital preservation": "Perlindungan modal",
  Conservative: "Konservatif",
  Balanced: "Seimbang",
  Growth: "Pertumbuhan",
  "Aggressive growth": "Pertumbuhan agresif",
  "Human review": "Tinjauan penasihat manusia",
};
export function outcomeName(name: string) {
  return L === "id" ? (OUTCOME_ID[name] ?? name) : name;
}

const SUMMARY_ID: Record<string, string> = {
  "capital-preservation": "Utamakan keamanan modal: sebagian besar obligasi dan kas, dengan sedikit saham.",
  conservative: "Tumbuh perlahan dengan naik turun yang terbatas: obligasi sebagai andalan, saham sebagai pelengkap.",
  balanced: "Seimbang antara pertumbuhan dan kestabilan, jalan tengah yang paling umum.",
  growth: "Mengejar pertumbuhan: saham sebagai andalan, obligasi meredam naik turunnya.",
  "aggressive-growth": "Pertumbuhan jangka panjang setinggi mungkin, dengan naik turun yang besar dalam jangka pendek.",
  "human-review":
    "Tidak ada portofolio otomatis. Situasi ini sebaiknya ditinjau penasihat manusia sebelum ada saran apa pun.",
};
export function outcomeSummary(id: string, enSummary: string) {
  return L === "id" ? (SUMMARY_ID[id] ?? enSummary) : enSummary;
}

export const ASSET_ID: Record<string, string> = {
  "Global equities": "Saham global",
  Bonds: "Obligasi",
  "Cash and money market": "Kas dan pasar uang",
  "Real assets": "Aset riil",
};
export function assetLabel(en: string) {
  return L === "id" ? (ASSET_ID[en] ?? en) : en;
}

const LABEL_VALUE_ID: Record<string, string> = {
  Low: "Rendah",
  Moderate: "Sedang",
  High: "Tinggi",
  Urgent: "Mendesak",
  Inconsistent: "Tidak konsisten",
};
export function labelValue(en: string) {
  return L === "id" ? (LABEL_VALUE_ID[en] ?? en) : en;
}

/* ---------------- Input labels and value texts ---------------- */
const INPUT_LABEL_ID: Record<string, string> = {
  Age: "Usia",
  "Investment horizon": "Jangka waktu investasi",
  "Risk tolerance": "Toleransi risiko",
  "Emergency fund": "Dana darurat",
  "Income stability": "Kestabilan pendapatan",
  "Debt and obligations": "Utang dan kewajiban",
  "Near-term need": "Kebutuhan dalam waktu dekat",
  "Risk capacity": "Kemampuan menanggung risiko",
  "Liquidity need": "Kebutuhan dana cepat",
};
export function inputLabel(en: string) {
  return L === "id" ? (INPUT_LABEL_ID[en] ?? en) : en;
}

export const V = {
  yearsOld: (age: number) => pick(`${age} years old`, `${age} tahun`),
  years: (n: number) => (L === "id" ? `${n} tahun` : `${n} ${n === 1 ? "year" : "years"}`),
  toleranceText: (t: string, inconsistent: boolean) => {
    const name = { low: pick("Low", "Rendah"), medium: pick("Medium", "Sedang"), high: pick("High", "Tinggi") }[t] ?? t;
    return pick(`${name} tolerance${inconsistent ? ", read as Inconsistent" : ""}`, `${name.toLowerCase()}${inconsistent ? ", tetapi dinilai tidak konsisten" : ""}`);
  },
  fund: (has: boolean) => pick(has ? "6 months covered" : "no 6-month buffer", has ? "cukup untuk 6 bulan" : "tidak cukup untuk 6 bulan"),
  income: (stable: boolean) => pick(stable ? "stable income" : "variable income", stable ? "stabil" : "tidak tetap"),
  debt: (has: boolean) => pick(has ? "significant debt or obligations" : "no significant debt", has ? "ada utang atau kewajiban besar" : "tidak ada utang besar"),
  need: (has: boolean) => pick(has ? "money may be needed soon" : "no near-term need", has ? "mungkin segera dibutuhkan" : "tidak ada"),
};

/* ---------------- Feature explanation ---------------- */
export const FX = {
  targetProbability: (name: string) => pick(`the probability of ${name}`, `peluang ${outcomeName(name)}`),
  targetEvidence: (name: string) => pick(`the evidence for ${name}`, `skor ${outcomeName(name)}`),
  unitPct: () => pick("percentage points", "poin persentase"),
  unitLogOdds: () => pick("log-odds points", "poin log-odds"),
  sentenceChanged: (label: string, valueText: string, up: boolean, points: string, target: string) =>
    pick(
      `${label} (${valueText}) ${up ? "increased" : "reduced"} ${target} by ${points}.`,
      `${label} (${valueText}) ${up ? "menaikkan" : "menurunkan"} ${target} sebesar ${points}.`,
    ),
  sentenceUnchanged: (label: string, valueText: string, target: string) =>
    pick(
      `${label} (${valueText}) did not change ${target} relative to the baseline.`,
      `${label} (${valueText}) tidak mengubah ${target} dibandingkan profil acuan.`,
    ),
  points: (v: number) => {
    const n = Math.round(Math.abs(v) * 10) / 10;
    return pick(`${n} ${n === 1 ? "point" : "points"}`, `${num(n)} poin`);
  },
  methodShapley: (target: string) =>
    pick(
      `These are Shapley values of ${target}: the average effect of each input across all orders of adding inputs, computed post hoc by re-running the network 128 times against the baseline profile. They describe the network's behaviour, not readable rules.`,
      `Angka ini adalah nilai Shapley untuk ${target}: pengaruh rata-rata setiap faktor, dihitung setelah keputusan dibuat dengan menjalankan ulang jaringan 128 kali terhadap profil acuan. Angka ini menggambarkan perilaku jaringan, bukan aturan yang bisa dibaca.`,
    ),
  methodWeights: () =>
    pick(
      "These contributions are read directly from the scorecard's weights: weight of the recommended outcome times the input, minus the same for the baseline profile. They are exact, not estimated, and they add up to the change in evidence.",
      "Kontribusi ini dibaca langsung dari bobot tabel poin: bobot hasil yang direkomendasikan dikalikan nilai faktornya, dikurangi hal yang sama untuk profil acuan. Angkanya pasti, bukan perkiraan, dan jumlahnya sama dengan perubahan skornya.",
    ),
  toleranceNote: () =>
    pick(
      "Risk tolerance is an input to this model, so it appears above as its own contribution.",
      "Toleransi risiko adalah salah satu faktor dalam model ini, jadi pengaruhnya ditampilkan tersendiri di atas.",
    ),
  introMl: (name: string) =>
    pick(
      `Compared with a neutral baseline profile, each of your inputs moved the probability of ${name} as follows (largest effect first, in percentage points):`,
      `Dibandingkan dengan profil acuan yang netral, setiap faktor dalam profil Anda menggeser peluang ${outcomeName(name)} seperti berikut (pengaruh terbesar lebih dulu, dalam poin persentase):`,
    ),
  totalMl: (base: number, full: number, name: string) =>
    pick(
      `Baseline profile ${base} percent plus contributions = ${full} percent probability of ${name} for your profile.`,
      `Profil acuan ${num(base)} persen, ditambah semua kontribusi, menjadi peluang ${num(full)} persen untuk ${outcomeName(name)} pada profil Anda.`,
    ),
  introLogit: (name: string) =>
    pick(
      `Compared with a neutral baseline profile, each input moved the evidence for ${name} as follows (largest effect first, in log-odds points, read directly from the model's weights):`,
      `Dibandingkan dengan profil acuan yang netral, setiap faktor menggeser skor ${outcomeName(name)} seperti berikut (pengaruh terbesar lebih dulu, dalam poin log-odds, dibaca langsung dari bobot model):`,
    ),
  totalLogit: (base: number, full: number, name: string, pct: number) =>
    pick(
      `Baseline evidence ${base} plus contributions = ${full} log-odds points for ${name}, which the model turns into a ${pct} percent probability.`,
      `Skor acuan ${num(base)}, ditambah semua kontribusi, menjadi ${num(full)} poin log-odds untuk ${outcomeName(name)}. Model mengubahnya menjadi peluang ${num(pct)} persen.`,
    ),
};

/* ---------------- Counterfactual and contrastive ---------------- */
export const CF = {
  intro: (current: string) =>
    pick(
      `The recommendation is ${current}. The smallest single changes that would alter it:`,
      `Rekomendasinya: ${outcomeName(current)}. Perubahan terkecil pada satu faktor yang akan mengubahnya:`,
    ),
  none: (current: string) =>
    pick(
      `No single change to one input would alter this recommendation. It would take changes to more than one input to move away from ${current}.`,
      `Tidak ada satu perubahan pun pada satu faktor yang akan mengubah rekomendasi ini. Perlu perubahan pada lebih dari satu faktor agar hasilnya bukan lagi ${outcomeName(current)}.`,
    ),
  numeric: (label: "age" | "horizon", value: number, old: number, outcome: string) => {
    if (L === "id") {
      const lab = label === "age" ? "usia" : "jangka waktu investasi";
      return `Jika ${lab} Anda ${value} tahun, bukan ${old}, sarannya akan menjadi ${outcomeName(outcome)}.`;
    }
    const unit = label === "age" ? "years old" : "years";
    return `If your ${label} were ${value} ${unit} instead of ${old}, the advice would change to ${outcome}.`;
  },
  tolerance: (to: string, from: string, outcome: string) =>
    pick(
      `If your risk tolerance were ${to} instead of ${from}, the advice would change to ${outcome}.`,
      `Jika toleransi risiko Anda ${labelValue(to === "Medium" ? "Moderate" : to).toLowerCase()}, bukan ${labelValue(from === "Medium" ? "Moderate" : from).toLowerCase()}, sarannya akan menjadi ${outcomeName(outcome)}.`,
    ),
  fund: (had: boolean, outcome: string) =>
    pick(
      had
        ? `If you did not have a 6-month emergency fund, the advice would change to ${outcome}.`
        : `If you had a 6-month emergency fund, the advice would change to ${outcome}.`,
      had
        ? `Jika Anda tidak punya dana darurat untuk 6 bulan, sarannya akan menjadi ${outcomeName(outcome)}.`
        : `Jika Anda punya dana darurat untuk 6 bulan, sarannya akan menjadi ${outcomeName(outcome)}.`,
    ),
  income: (wasStable: boolean, outcome: string) =>
    pick(
      wasStable
        ? `If your income were variable instead of stable, the advice would change to ${outcome}.`
        : `If your income were stable instead of variable, the advice would change to ${outcome}.`,
      wasStable
        ? `Jika pendapatan Anda tidak tetap, sarannya akan menjadi ${outcomeName(outcome)}.`
        : `Jika pendapatan Anda stabil, sarannya akan menjadi ${outcomeName(outcome)}.`,
    ),
  debt: (had: boolean, outcome: string) =>
    pick(
      had
        ? `If you did not have significant debt or obligations, the advice would change to ${outcome}.`
        : `If you had significant debt or obligations, the advice would change to ${outcome}.`,
      had
        ? `Jika Anda tidak punya utang atau kewajiban besar, sarannya akan menjadi ${outcomeName(outcome)}.`
        : `Jika Anda punya utang atau kewajiban besar, sarannya akan menjadi ${outcomeName(outcome)}.`,
    ),
  need: (had: boolean, outcome: string) =>
    pick(
      had
        ? `If you did not expect to need this money in the near term, the advice would change to ${outcome}.`
        : `If you expected to need this money in the near term, the advice would change to ${outcome}.`,
      had
        ? `Jika dana ini tidak akan Anda butuhkan dalam waktu dekat, sarannya akan menjadi ${outcomeName(outcome)}.`
        : `Jika dana ini mungkin Anda butuhkan dalam waktu dekat, sarannya akan menjadi ${outcomeName(outcome)}.`,
    ),
  rerunNote: (isNetwork: boolean) =>
    pick(
      `Each statement was produced by re-running the same ${isNetwork ? "network" : "model"} with only that input changed.`,
      `Setiap kalimat di atas didapat dengan menjalankan ulang ${isNetwork ? "jaringan" : "model"} yang sama, dengan hanya satu faktor yang diubah.`,
    ),
};

/* ---------------- Confidence ---------------- */
export const CX = {
  labelText: (label: "high" | "moderate" | "low") =>
    pick(
      { high: "High confidence", moderate: "Moderate confidence", low: "Low confidence" }[label],
      { high: "Keyakinan tinggi", moderate: "Keyakinan sedang", low: "Keyakinan rendah" }[label],
    ),
  sentence: (who: "ml" | "logit", label: "high" | "moderate" | "low", name: string, pTop: number, neighbour: string | null, pSecond: number | null) => {
    if (L === "id") {
      const subj = who === "logit" ? "Model" : "Jaringan saraf";
      const n = outcomeName(name);
      const nb = neighbour ? outcomeName(neighbour) : null;
      const top = num(pTop);
      const second = pSecond === null ? "" : num(pSecond);
      if (label === "low")
        return `${subj} hanya memberi peluang ${top} persen untuk ${n}${nb ? `, dengan ${nb} tidak jauh di belakang (${second} persen)` : ""}. Perubahan kecil pada profil Anda bisa mengubahnya.`;
      if (label === "moderate")
        return `${subj} memberi peluang ${top} persen untuk ${n}${nb ? `, dibandingkan ${second} persen untuk ${nb}` : ""}. Perubahan yang tidak terlalu besar pada profil Anda bisa mengubahnya.`;
      return `${subj} memberi peluang ${top} persen untuk ${n}${nb ? `, jauh di atas ${nb} (${second} persen)` : ""}. Perlu perubahan besar pada profil Anda untuk mengubahnya.`;
    }
    const subj = who === "logit" ? "The model" : "The network";
    if (label === "low")
      return `${subj} gives ${name} only ${pTop} percent probability${neighbour ? `, with ${neighbour} close behind at ${pSecond} percent` : ""}. Small changes in your profile could shift it.`;
    if (label === "moderate")
      return `${subj} gives ${name} ${pTop} percent probability${neighbour ? `, against ${pSecond} percent for ${neighbour}` : ""}. Moderate changes in your profile could shift it.`;
    return `${subj} gives ${name} ${pTop} percent probability${neighbour ? `, well ahead of ${neighbour} at ${pSecond} percent` : ""}. It would take a substantial change in your profile to move it.`;
  },
  detail: (pTop: number, margin: number) =>
    pick(
      `${pTop} percent calibrated probability, ${margin} points ahead of the next outcome.`,
      `Peluang terkalibrasi ${num(pTop)} persen, ${num(margin)} poin di atas hasil berikutnya.`,
    ),
};

/* ---------------- Escalation ---------------- */
export function escalationReason(who: "ml" | "logit", tolerance: string, capacity: string, liquidity: string) {
  if (L === "id") {
    const subj =
      who === "ml"
        ? "Jaringan saraf, yang dilatih dari keputusan para ahli,"
        : "Model transparan, yang dibuat dari keputusan para ahli,";
    const low = (v: string) => labelValue(v).toLowerCase();
    return `${subj} menilai profil ini (toleransi risiko ${low(tolerance)}, kemampuan menanggung risiko ${low(capacity)}, kebutuhan dana cepat ${low(liquidity)}) sebaiknya ditangani penasihat manusia.`;
  }
  const subj =
    who === "ml" ? "The network, trained on expert decisions," : "The interpretable model, fitted on expert decisions,";
  return `${subj} judges this profile (${tolerance} tolerance, ${capacity} capacity, ${liquidity} liquidity need) as one that should go to a human adviser.`;
}

export function labelReasonText(en: string) {
  if (L === "en") return en;
  const map: [string, string][] = [
    ["emergency fund, stable income, no significant debt", "ada dana darurat, pendapatan stabil, tanpa utang besar"],
    ["no emergency fund", "tanpa dana darurat"],
    ["variable income", "pendapatan tidak tetap"],
    ["significant debt or obligations", "utang atau kewajiban besar"],
    ["the money may be needed in the near term", "dana mungkin dibutuhkan dalam waktu dekat"],
    [" and ", " dan "],
  ];
  let out = en;
  for (const [a, b] of map) out = out.split(a).join(b);
  /* "15 years horizon" reads the other way round in Indonesian. */
  return out.replace(/(\d+) years? horizon/, "jangka waktu $1 tahun");
}

/* ---------------- Interpretable-advisor value texts ---------------- */
const STATED_ID: Record<string, string> = { low: "rendah", medium: "sedang", high: "tinggi" };
/* The ILS-Bench label each stated answer maps to, to spot when they agree. */
const STATED_EN: Record<string, string> = { low: "low", medium: "moderate", high: "high" };
/* In Indonesian the value and its reason share one parenthesis, so a
   sentence reads "Kebutuhan dana cepat (rendah, jangka waktu 15 tahun)"
   rather than nesting a second pair of brackets. */
export const LT = {
  tolValue: (labelTol: string, inconsistent: boolean, stated: string) =>
    L === "id"
      ? labelValue(labelTol).toLowerCase() +
        (inconsistent ? ", disimpulkan dari deskripsi" : labelTol.toLowerCase() === (STATED_EN[stated] ?? stated) ? ", sesuai pernyataan" : `, dinyatakan ${STATED_ID[stated] ?? stated}`)
      : labelTol + (inconsistent ? " (read from the description)" : ` (stated ${stated})`),
  capValue: (cap: string, reason: string) =>
    L === "id" ? `${labelValue(cap).toLowerCase()}, ${labelReasonText(reason)}` : `${labelValue(cap)} (${labelReasonText(reason)})`,
  liqValue: (liq: string, reason: string) =>
    L === "id" ? `${labelValue(liq).toLowerCase()}, ${labelReasonText(reason)}` : `${labelValue(liq)} (${labelReasonText(reason)})`,
};

/* ---------------- Contrastive ---------------- */
export const CT = {
  already: (current: string) =>
    pick(`${current} is already the recommendation.`, `${outcomeName(current)} sudah menjadi rekomendasinya.`),
  numericText: (label: "age" | "horizon", v: number, old: number) => {
    if (L === "id") return `${label === "age" ? "usia" : "jangka waktu investasi"} Anda ${v} tahun, bukan ${old}`;
    return `your ${label} were ${v} ${label === "age" ? "years old" : "years"} instead of ${old}`;
  },
  tolText: (to: string, from: string) =>
    pick(
      `your risk tolerance were ${to} instead of ${from}`,
      `toleransi risiko Anda ${labelValue(to === "Medium" ? "Moderate" : to).toLowerCase()}, bukan ${labelValue(from === "Medium" ? "Moderate" : from).toLowerCase()}`,
    ),
  fundText: (had: boolean) =>
    pick(
      had ? "you had no 6-month emergency fund" : "you had a 6-month emergency fund",
      had ? "Anda tidak punya dana darurat untuk 6 bulan" : "Anda punya dana darurat untuk 6 bulan",
    ),
  incomeText: (wasStable: boolean) =>
    pick(
      wasStable ? "your income were variable" : "your income were stable",
      wasStable ? "pendapatan Anda tidak tetap" : "pendapatan Anda stabil",
    ),
  debtText: (had: boolean) =>
    pick(
      had ? "you had no significant debt" : "you had significant debt or obligations",
      had ? "Anda tidak punya utang besar" : "Anda punya utang atau kewajiban besar",
    ),
  needText: (had: boolean) =>
    pick(
      had ? "you did not need the money in the near term" : "you might need the money in the near term",
      had ? "dana itu tidak Anda butuhkan dalam waktu dekat" : "dana itu mungkin Anda butuhkan dalam waktu dekat",
    ),
  single: (target: string, a: string, b?: string) =>
    pick(
      `The advice would be ${target} if ${a}.` + (b ? ` Also if ${b}.` : ""),
      `Sarannya akan menjadi ${outcomeName(target)} jika ${a}.` + (b ? ` Bisa juga jika ${b}.` : ""),
    ),
  pair: (target: string, a: string, b: string) =>
    pick(
      `No single change would give ${target}. It would take two changes, for example if ${a} and ${b}.`,
      `Tidak ada satu perubahan pun yang menghasilkan ${outcomeName(target)}. Perlu dua perubahan, misalnya jika ${a} dan ${b}.`,
    ),
  notFound: (target: string) =>
    pick(
      `No single change, and no pair of changes to tolerance, emergency fund, income, debt or near-term need, would give ${target} for a profile like yours. The inputs that keep you away from it are the ones with the largest contributions.`,
      `Untuk profil seperti milik Anda, tidak ada satu atau dua perubahan pada toleransi risiko, dana darurat, pendapatan, utang, atau kebutuhan dalam waktu dekat yang menghasilkan ${outcomeName(target)}. Yang paling menjauhkan Anda dari hasil itu adalah faktor dengan kontribusi terbesar.`,
    ),
};
