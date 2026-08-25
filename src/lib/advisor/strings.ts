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

/* ---------------- Display names ---------------- */
const OUTCOME_ID: Record<string, string> = {
  "Capital preservation": "Preservasi modal",
  Conservative: "Konservatif",
  Balanced: "Seimbang",
  Growth: "Pertumbuhan",
  "Aggressive growth": "Pertumbuhan agresif",
  "Human review": "Tinjauan manusia",
};
export function outcomeName(name: string) {
  return L === "id" ? (OUTCOME_ID[name] ?? name) : name;
}

const SUMMARY_ID: Record<string, string> = {
  "capital-preservation": "Menjaga modal terlebih dahulu: sebagian besar obligasi dan kas, porsi saham kecil.",
  conservative: "Pertumbuhan moderat dengan gejolak terbatas: obligasi memimpin, saham mendukung.",
  balanced: "Campuran seimbang antara pertumbuhan dan stabilitas, jalan tengah yang klasik.",
  growth: "Berorientasi pertumbuhan: saham mendominasi, obligasi meredam gejolak.",
  "aggressive-growth": "Pertumbuhan jangka panjang maksimal, menerima gejolak besar dalam jangka pendek.",
  "human-review":
    "Tidak ada portofolio otomatis. Situasi ini sebaiknya ditinjau oleh penasihat manusia sebelum saran apa pun diberikan.",
};
export function outcomeSummary(id: string, enSummary: string) {
  return L === "id" ? (SUMMARY_ID[id] ?? enSummary) : enSummary;
}

const ASSET_ID: Record<string, string> = {
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
  "Investment horizon": "Horizon investasi",
  "Risk tolerance": "Toleransi risiko",
  "Emergency fund": "Dana darurat",
  "Income stability": "Stabilitas pendapatan",
  "Debt and obligations": "Utang dan kewajiban",
  "Near-term need": "Kebutuhan jangka pendek",
  "Risk capacity": "Kapasitas risiko",
  "Liquidity need": "Kebutuhan likuiditas",
};
export function inputLabel(en: string) {
  return L === "id" ? (INPUT_LABEL_ID[en] ?? en) : en;
}

export const V = {
  yearsOld: (age: number) => pick(`${age} years old`, `berusia ${age} tahun`),
  years: (n: number) => (L === "id" ? `${n} tahun` : `${n} ${n === 1 ? "year" : "years"}`),
  toleranceText: (t: string, inconsistent: boolean) => {
    const name = { low: pick("Low", "Rendah"), medium: pick("Medium", "Sedang"), high: pick("High", "Tinggi") }[t] ?? t;
    return pick(`${name} tolerance${inconsistent ? ", read as Inconsistent" : ""}`, `toleransi ${name.toLowerCase()}${inconsistent ? ", terbaca Tidak konsisten" : ""}`);
  },
  fund: (has: boolean) => pick(has ? "6 months covered" : "no 6-month buffer", has ? "dana 6 bulan tersedia" : "tanpa dana penyangga 6 bulan"),
  income: (stable: boolean) => pick(stable ? "stable income" : "variable income", stable ? "pendapatan stabil" : "pendapatan tidak tetap"),
  debt: (has: boolean) => pick(has ? "significant debt or obligations" : "no significant debt", has ? "utang atau kewajiban besar" : "tanpa utang besar"),
  need: (has: boolean) => pick(has ? "money may be needed soon" : "no near-term need", has ? "dana mungkin segera dibutuhkan" : "tidak ada kebutuhan jangka pendek"),
};

/* ---------------- Feature explanation ---------------- */
export const FX = {
  targetProbability: (name: string) => pick(`the probability of ${name}`, `probabilitas ${outcomeName(name)}`),
  targetEvidence: (name: string) => pick(`the evidence for ${name}`, `bukti untuk ${outcomeName(name)}`),
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
    return pick(`${n} ${n === 1 ? "point" : "points"}`, `${n} poin`);
  },
  methodShapley: (target: string) =>
    pick(
      `These are Shapley values of ${target}: the average effect of each input across all orders of adding inputs, computed post hoc by re-running the network 128 times against the baseline profile. They describe the network's behaviour, not readable rules.`,
      `Ini adalah nilai Shapley dari ${target}: efek rata-rata setiap input pada semua urutan penambahan input, dihitung setelah keputusan dengan menjalankan ulang jaringan 128 kali terhadap profil acuan. Angka ini menggambarkan perilaku jaringan, bukan aturan yang dapat dibaca.`,
    ),
  methodWeights: () =>
    pick(
      "These contributions are read directly from the scorecard's weights: weight of the recommended outcome times the input, minus the same for the baseline profile. They are exact, not estimated, and they add up to the change in evidence.",
      "Kontribusi ini dibaca langsung dari bobot scorecard: bobot hasil yang direkomendasikan dikali input, dikurangi nilai yang sama untuk profil acuan. Angka ini eksak, bukan estimasi, dan jumlahnya sama dengan perubahan bukti.",
    ),
  toleranceNote: () =>
    pick(
      "Risk tolerance is an input to this model, so it appears above as its own contribution.",
      "Toleransi risiko adalah input model ini, sehingga muncul di atas sebagai kontribusi tersendiri.",
    ),
  introMl: (name: string) =>
    pick(
      `Compared with a neutral baseline profile, each of your inputs moved the probability of ${name} as follows (largest effect first, in percentage points):`,
      `Dibandingkan profil acuan yang netral, setiap input Anda menggeser probabilitas ${outcomeName(name)} sebagai berikut (efek terbesar lebih dulu, dalam poin persentase):`,
    ),
  totalMl: (base: number, full: number, name: string) =>
    pick(
      `Baseline profile ${base} percent plus contributions = ${full} percent probability of ${name} for your profile.`,
      `Profil acuan ${base} persen ditambah kontribusi = probabilitas ${full} persen untuk ${outcomeName(name)} pada profil Anda.`,
    ),
  introLogit: (name: string) =>
    pick(
      `Compared with a neutral baseline profile, each input moved the evidence for ${name} as follows (largest effect first, in log-odds points, read directly from the model's weights):`,
      `Dibandingkan profil acuan yang netral, setiap input menggeser bukti untuk ${outcomeName(name)} sebagai berikut (efek terbesar lebih dulu, dalam poin log-odds, dibaca langsung dari bobot model):`,
    ),
  totalLogit: (base: number, full: number, name: string, pct: number) =>
    pick(
      `Baseline evidence ${base} plus contributions = ${full} log-odds points for ${name}, which the model turns into a ${pct} percent probability.`,
      `Bukti acuan ${base} ditambah kontribusi = ${full} poin log-odds untuk ${outcomeName(name)}, yang oleh model diubah menjadi probabilitas ${pct} persen.`,
    ),
};

/* ---------------- Counterfactual and contrastive ---------------- */
export const CF = {
  intro: (current: string) =>
    pick(
      `The recommendation is ${current}. The smallest single changes that would alter it:`,
      `Rekomendasinya adalah ${outcomeName(current)}. Perubahan tunggal terkecil yang akan mengubahnya:`,
    ),
  none: (current: string) =>
    pick(
      `No single change to one input would alter this recommendation. It would take changes to more than one input to move away from ${current}.`,
      `Tidak ada perubahan tunggal pada satu input yang akan mengubah rekomendasi ini. Dibutuhkan perubahan pada lebih dari satu input untuk beranjak dari ${outcomeName(current)}.`,
    ),
  numeric: (label: "age" | "horizon", value: number, old: number, outcome: string) => {
    if (L === "id") {
      const lab = label === "age" ? "usia" : "horizon";
      const unit = label === "age" ? "tahun" : "tahun";
      return `Jika ${lab} Anda ${value} ${unit} alih-alih ${old}, sarannya berubah menjadi ${outcomeName(outcome)}.`;
    }
    const unit = label === "age" ? "years old" : "years";
    return `If your ${label} were ${value} ${unit} instead of ${old}, the advice would change to ${outcome}.`;
  },
  tolerance: (to: string, from: string, outcome: string) =>
    pick(
      `If your risk tolerance were ${to} instead of ${from}, the advice would change to ${outcome}.`,
      `Jika toleransi risiko Anda ${labelValue(to === "Medium" ? "Moderate" : to)} alih-alih ${labelValue(from === "Medium" ? "Moderate" : from)}, sarannya berubah menjadi ${outcomeName(outcome)}.`,
    ),
  fund: (had: boolean, outcome: string) =>
    pick(
      had
        ? `If you did not have a 6-month emergency fund, the advice would change to ${outcome}.`
        : `If you had a 6-month emergency fund, the advice would change to ${outcome}.`,
      had
        ? `Jika Anda tidak memiliki dana darurat 6 bulan, sarannya berubah menjadi ${outcomeName(outcome)}.`
        : `Jika Anda memiliki dana darurat 6 bulan, sarannya berubah menjadi ${outcomeName(outcome)}.`,
    ),
  income: (wasStable: boolean, outcome: string) =>
    pick(
      wasStable
        ? `If your income were variable instead of stable, the advice would change to ${outcome}.`
        : `If your income were stable instead of variable, the advice would change to ${outcome}.`,
      wasStable
        ? `Jika pendapatan Anda tidak tetap alih-alih stabil, sarannya berubah menjadi ${outcomeName(outcome)}.`
        : `Jika pendapatan Anda stabil alih-alih tidak tetap, sarannya berubah menjadi ${outcomeName(outcome)}.`,
    ),
  debt: (had: boolean, outcome: string) =>
    pick(
      had
        ? `If you did not have significant debt or obligations, the advice would change to ${outcome}.`
        : `If you had significant debt or obligations, the advice would change to ${outcome}.`,
      had
        ? `Jika Anda tidak memiliki utang atau kewajiban besar, sarannya berubah menjadi ${outcomeName(outcome)}.`
        : `Jika Anda memiliki utang atau kewajiban besar, sarannya berubah menjadi ${outcomeName(outcome)}.`,
    ),
  need: (had: boolean, outcome: string) =>
    pick(
      had
        ? `If you did not expect to need this money in the near term, the advice would change to ${outcome}.`
        : `If you expected to need this money in the near term, the advice would change to ${outcome}.`,
      had
        ? `Jika Anda tidak memperkirakan butuh dana ini dalam waktu dekat, sarannya berubah menjadi ${outcomeName(outcome)}.`
        : `Jika Anda memperkirakan butuh dana ini dalam waktu dekat, sarannya berubah menjadi ${outcomeName(outcome)}.`,
    ),
  rerunNote: (isNetwork: boolean) =>
    pick(
      `Each statement was produced by re-running the same ${isNetwork ? "network" : "model"} with only that input changed.`,
      `Setiap pernyataan dihasilkan dengan menjalankan ulang ${isNetwork ? "jaringan" : "model"} yang sama dengan hanya input itu yang diubah.`,
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
      const subj = who === "logit" ? "Model" : "Jaringan";
      const n = outcomeName(name);
      const nb = neighbour ? outcomeName(neighbour) : null;
      if (label === "low")
        return `${subj} memberi ${n} probabilitas hanya ${pTop} persen${nb ? `, dengan ${nb} menyusul dekat di ${pSecond} persen` : ""}. Perubahan kecil pada profil Anda dapat menggesernya.`;
      if (label === "moderate")
        return `${subj} memberi ${n} probabilitas ${pTop} persen${nb ? `, berbanding ${pSecond} persen untuk ${nb}` : ""}. Perubahan sedang pada profil Anda dapat menggesernya.`;
      return `${subj} memberi ${n} probabilitas ${pTop} persen${nb ? `, jauh di atas ${nb} yang ${pSecond} persen` : ""}. Dibutuhkan perubahan besar pada profil Anda untuk menggesernya.`;
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
      `Probabilitas terkalibrasi ${pTop} persen, unggul ${margin} poin atas hasil berikutnya.`,
    ),
};

/* ---------------- Escalation ---------------- */
export function escalationReason(who: "ml" | "logit", tolerance: string, capacity: string, liquidity: string) {
  if (L === "id") {
    const subj =
      who === "ml"
        ? "Jaringan, yang dilatih pada keputusan para ahli,"
        : "Model interpretable, yang dilatih pada keputusan para ahli,";
    return `${subj} menilai profil ini (toleransi ${labelValue(tolerance)}, kapasitas ${labelValue(capacity)}, kebutuhan likuiditas ${labelValue(liquidity)}) sebaiknya ditangani penasihat manusia.`;
  }
  const subj =
    who === "ml" ? "The network, trained on expert decisions," : "The interpretable model, fitted on expert decisions,";
  return `${subj} judges this profile (${tolerance} tolerance, ${capacity} capacity, ${liquidity} liquidity need) as one that should go to a human adviser.`;
}

export function labelReasonText(en: string) {
  if (L === "en") return en;
  const map: [string, string][] = [
    ["emergency fund, stable income, no significant debt", "dana darurat ada, pendapatan stabil, tanpa utang besar"],
    ["no emergency fund", "tanpa dana darurat"],
    ["variable income", "pendapatan tidak tetap"],
    ["significant debt or obligations", "utang atau kewajiban besar"],
    ["the money may be needed in the near term", "dana mungkin dibutuhkan dalam waktu dekat"],
    [" and ", " dan "],
    ["years horizon", "tahun horizon"],
    ["year horizon", "tahun horizon"],
  ];
  let out = en;
  for (const [a, b] of map) out = out.split(a).join(b);
  return out;
}

/* ---------------- Interpretable-advisor value texts ---------------- */
const STATED_ID: Record<string, string> = { low: "rendah", medium: "sedang", high: "tinggi" };
export const LT = {
  tolValue: (labelTol: string, inconsistent: boolean, stated: string) =>
    L === "id"
      ? labelValue(labelTol) + (inconsistent ? " (dibaca dari deskripsi)" : ` (dinyatakan ${STATED_ID[stated] ?? stated})`)
      : labelTol + (inconsistent ? " (read from the description)" : ` (stated ${stated})`),
  capValue: (cap: string, reason: string) => `${labelValue(cap)} (${labelReasonText(reason)})`,
  liqValue: (liq: string, reason: string) => `${labelValue(liq)} (${labelReasonText(reason)})`,
};

/* ---------------- Contrastive ---------------- */
export const CT = {
  already: (current: string) =>
    pick(`${current} is already the recommendation.`, `${outcomeName(current)} sudah menjadi rekomendasi.`),
  numericText: (label: "age" | "horizon", v: number, old: number) => {
    if (L === "id") return `${label === "age" ? "usia" : "horizon"} Anda ${v} tahun alih-alih ${old}`;
    return `your ${label} were ${v} ${label === "age" ? "years old" : "years"} instead of ${old}`;
  },
  tolText: (to: string, from: string) =>
    pick(
      `your risk tolerance were ${to} instead of ${from}`,
      `toleransi risiko Anda ${labelValue(to === "Medium" ? "Moderate" : to).toLowerCase()} alih-alih ${labelValue(from === "Medium" ? "Moderate" : from).toLowerCase()}`,
    ),
  fundText: (had: boolean) =>
    pick(
      had ? "you had no 6-month emergency fund" : "you had a 6-month emergency fund",
      had ? "Anda tidak punya dana darurat 6 bulan" : "Anda punya dana darurat 6 bulan",
    ),
  incomeText: (wasStable: boolean) =>
    pick(
      wasStable ? "your income were variable" : "your income were stable",
      wasStable ? "pendapatan Anda tidak tetap" : "pendapatan Anda stabil",
    ),
  debtText: (had: boolean) =>
    pick(
      had ? "you had no significant debt" : "you had significant debt or obligations",
      had ? "Anda tanpa utang besar" : "Anda punya utang atau kewajiban besar",
    ),
  needText: (had: boolean) =>
    pick(
      had ? "you did not need the money in the near term" : "you might need the money in the near term",
      had ? "Anda tidak membutuhkan dana itu dalam waktu dekat" : "Anda mungkin membutuhkan dana itu dalam waktu dekat",
    ),
  single: (target: string, a: string, b?: string) =>
    pick(
      `The advice would be ${target} if ${a}.` + (b ? ` Also if ${b}.` : ""),
      `Sarannya menjadi ${outcomeName(target)} jika ${a}.` + (b ? ` Juga jika ${b}.` : ""),
    ),
  pair: (target: string, a: string, b: string) =>
    pick(
      `No single change would give ${target}. It would take two changes, for example if ${a} and ${b}.`,
      `Tidak ada perubahan tunggal yang menghasilkan ${outcomeName(target)}. Dibutuhkan dua perubahan, misalnya jika ${a} dan ${b}.`,
    ),
  notFound: (target: string) =>
    pick(
      `No single change, and no pair of changes to tolerance, emergency fund, income, debt or near-term need, would give ${target} for a profile like yours. The inputs that keep you away from it are the ones with the largest contributions.`,
      `Tidak ada perubahan tunggal, dan tidak ada pasangan perubahan pada toleransi, dana darurat, pendapatan, utang, atau kebutuhan jangka pendek, yang menghasilkan ${outcomeName(target)} untuk profil seperti milik Anda. Input yang menjauhkan Anda darinya adalah input dengan kontribusi terbesar.`,
    ),
};
