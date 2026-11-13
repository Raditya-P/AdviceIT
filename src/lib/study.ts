/* The study flow definition, ported from AdviceIT v1 study.js and extended
   for the public site: seeded reproducible trial plans, random assignment
   of explanation condition and advisor (both logged), an attention check,
   consent and debrief texts, an exit questionnaire, and a verifiable
   completion code. */

import type { Misread } from "./advisor/flaw";
import type { RawProfile } from "./advisor/types";

/* misread: the wrong facts the advisor is given when this case comes up as
   flawed advice (src/lib/advisor/flaw.ts). Each one is fixed in advance, so
   every participant meets the same flaw for the same case, and each makes
   the AI advisor's advice clearly unsuitable: at least two mixes away from
   the sound one, or a mix where the person should be referred. Half the
   flaws make the advice riskier than it should be, half more cautious. */
export interface StudyCase {
  id: string;
  label: string;
  profile: RawProfile;
  text: string;
  misread: Misread;
}

export const CASES: StudyCase[] = [
  {
    id: "C1",
    label: "Early career saver",
    profile: { age: 27, horizon: 30, tolerance: "high", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
    text: "You are 27, in a permanent job with a steady salary, and you have six months of expenses in a savings account. You are investing for retirement, roughly 30 years away, and you say you are comfortable with large swings in value along the way.",
    misread: { tolerance: "low" },
  },
  {
    id: "C2",
    label: "Mid-career, no buffer",
    profile: { age: 40, horizon: 15, tolerance: "medium", emergencyFund: false, incomeStable: true, knowledge: "intermediate" },
    text: "You are 40, employed with a stable income, but you do not have an emergency fund set aside. This money is for a goal about 15 years away, and you describe your attitude to risk as moderate.",
    misread: { horizon: 5 },
  },
  {
    id: "C3",
    label: "Approaching retirement",
    profile: { age: 61, horizon: 6, tolerance: "low", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
    text: "You are 61, still working with a stable income, with a solid cash reserve. You expect to start drawing on this money in about 6 years, and you prefer to avoid large losses even if that means lower returns.",
    misread: { horizon: 16, tolerance: "medium" },
  },
  {
    id: "C4",
    label: "Freelancer saving for a house",
    profile: { age: 34, horizon: 2, tolerance: "medium", emergencyFund: false, incomeStable: false, knowledge: "intermediate" },
    text: "You are 34, self-employed with an income that varies a lot from month to month, and you have no cash set aside for emergencies. You are saving this money for a house deposit you plan to pay in about 2 years, and you are comfortable with moderate ups and downs along the way.",
    misread: { horizon: 20 },
  },
  {
    id: "C5",
    label: "Steady mid-life investor",
    profile: { age: 48, horizon: 12, tolerance: "medium", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
    text: "You are 48, with a stable job and a comfortable emergency fund. This money is for a goal about 12 years away, and you describe yourself as moderately comfortable with risk.",
    misread: { tolerance: "low" },
  },
  {
    id: "C6",
    label: "Young, variable income",
    profile: { age: 30, horizon: 20, tolerance: "medium", emergencyFund: true, incomeStable: false, knowledge: "intermediate" },
    text: "You are 30, working on short contracts so your income is irregular, but you keep six months of expenses in cash. You are investing for about 20 years and would accept moderate ups and downs.",
    misread: { horizon: 5 },
  },
  {
    id: "C7",
    label: "Cautious saver, long horizon",
    profile: { age: 36, horizon: 25, tolerance: "low", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
    text: "You are 36, in a secure job with a full emergency fund. You are investing for about 25 years, but you say you would find any noticeable loss stressful and prefer a cautious approach.",
    misread: { tolerance: "high" },
  },
  {
    id: "C8",
    label: "Late starter",
    profile: { age: 55, horizon: 10, tolerance: "high", emergencyFund: false, incomeStable: true, debtObligations: true, knowledge: "intermediate" },
    text: "You are 55, employed with a stable income, without an emergency fund and still repaying a sizeable loan. You want to catch up on retirement savings over the next 10 years and say you are willing to take substantial risk to do so.",
    misread: { tolerance: "medium" },
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
  misread: Misread;
}

/* Every case once, in an order seeded by the participant ID, half of them
   flawed. The attention checks are statements in the questionnaires
   (ATTENTION_ITEMS), not a case, so all eight cases are scored. */
export function buildPlan(participantId: string, n = STUDY_CASES): Trial[] {
  const count = Math.max(2, Math.min(12, n));
  const rand = mulberry32(hashString(String(participantId || "anon")));
  const cases = shuffle(CASES, rand);
  const picked: StudyCase[] = [];
  for (let i = 0; i < count; i++) picked.push(cases[i % cases.length]);
  let scenarios: ("sound" | "flawed")[] = [];
  for (let k = 0; k < count; k++) scenarios.push(k < Math.ceil(count / 2) ? "sound" : "flawed");
  scenarios = shuffle(scenarios, rand);
  return picked.map((c, idx) => ({
    index: idx,
    profileId: c.id,
    label: c.label,
    text: c.text,
    profile: c.profile,
    scenario: scenarios[idx],
    misread: c.misread,
  }));
}

/* ---------------- The design in force ----------------
   From 3.0.0 the study is the content arm of the earlier design: five
   explanation contents, all shown as static panels, with one advisor. The
   delivery conditions (interactive, adaptive, conversational) and the
   advisor comparison are left for later studies, which keeps the sample
   each comparison needs within reach. Every row carries STUDY_DESIGN and
   STUDY_PHASE, so data from different designs and phases never mix. */
export const ASSIGNABLE_CONDITIONS = ["none", "feature", "counterfactual", "confidence", "hybrid"] as const;
export type Condition = (typeof ASSIGNABLE_CONDITIONS)[number];

/** The AI (neural network) advisor, for every participant. */
export const STUDY_ADVISOR = "ml" as const;
/** Cases per session: all eight, four sound and four flawed. */
export const STUDY_CASES = 8;
/** Names this design in the data. Change it whenever the cases, the flaws,
 *  the conditions or the measures change. */
export const STUDY_DESIGN = "content5-ml-misread8";

/* The ethics approval. While it is null the study runs as a pilot: the
   consent says so, and every row is logged with studyPhase "pilot". Fill it
   in when the committee has approved the protocol, and the next deployment
   collects the main study under the approved consent. */
export const ETHICS_APPROVAL: { committee: string; reference: string } | null = null;
export const STUDY_PHASE: "pilot" | "main" = ETHICS_APPROVAL ? "main" : "pilot";

/* The lecturer who supervises the study, named in the consent once known. */
export const SUPERVISOR: { name: string; email: string } | null = null;

export function randomParticipantId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "P-";
  for (let i = 0; i < 6; i++) id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  return id;
}

export function randomCondition(): Condition {
  return ASSIGNABLE_CONDITIONS[Math.floor(Math.random() * ASSIGNABLE_CONDITIONS.length)];
}

/* Verifiable completion code: derived from the participant ID, so the
   researcher can check a claimed code against the ID. */
export function completionCode(participantId: string) {
  const h = hashString("adviceit:" + participantId);
  return "AIT-" + h.toString(36).toUpperCase().slice(0, 6);
}

/* Who participants write to with questions or a deletion request. The
   consent, the debrief and the privacy page all read it from here. */
export const CONTACT = { name: "Raditya Pratama", email: "radityapratama2077@gmail.com" };

/* The consent is short headed blocks rather than a wall of text, for
   participants who do not read long pages online. The same blocks are in
   docs/research/consent-and-debrief.md for the ethics submission; change
   both together. "Some details are explained at the end" covers the flawed
   advice without giving it away, and the debrief then names it. */
export const TEXTS = {
  consentTitle: "Before you start",
  consentIntro:
    "This is a research study about how people use investment advice from an automated advisor. It is run by the Department of Information Systems, Institut Teknologi Sepuluh Nopember (ITS), Surabaya, and takes about 15 to 20 minutes.",
  consent: [
    {
      heading: "What you will do",
      text: "You will read eight short stories about made-up investors. For each one, an automated advisor recommends how to invest, and you say whether you would follow the advice and how much you trust it. Before the stories there are three questions about money and some short statements about how you think. After them there are a few ratings and two questions you may leave empty.",
    },
    {
      heading: "Good to know",
      text: "Nothing here is real financial advice and no real money is involved. Please answer as if you were the person in each story. Some details of the study are explained at the end.",
    },
    {
      heading: "Who can take part",
      text: "Anyone aged 18 or older. Taking part is voluntary, and you can stop at any time by closing this page, without giving a reason.",
    },
    {
      heading: "Your data",
      text: "We do not ask for your name, email or any account. Your answers are stored under a random participant ID, together with the advice you saw, so they cannot be traced back to you. If you stop part way, your progress is kept in this browser for up to a week so you can continue, and it is deleted when you finish.",
    },
    {
      heading: "How the answers are used",
      text: "The anonymous answers are analysed for research papers and may be shared in a public research data archive, so that other researchers can check the results. Until the data are published, you can have your answers deleted by sending your participant ID to the researcher.",
    },
  ],
  pilotNote:
    "This is a trial run (pilot) to test the study before the main data collection. Answers from the trial run are used to improve the study and are not reported as research results.",
  approvalNote: "This study was approved by {committee} (reference {reference}).",
  agree: "I am 18 or older, I have read the information above, and I agree to take part.",
  literacyTitle: "Three quick questions",
  literacyIntro: "These questions are about general financial knowledge. There is no penalty for answering “Do not know”.",
  exitTitle: "Two final questions",
  exitIntro: "In your own words. A sentence or two is plenty, and you can leave them empty.",
  exitQ1: "Was there a moment you distrusted the advice? What made you notice?",
  exitQ2: "What would you have wanted the advisor to explain that it did not?",
  debriefTitle: "Thank you. One more thing you should know",
  debriefIntro:
    "In some of the stories, the advisor was given one or two wrong facts about the person on purpose, so its advice did not suit them. We did this to see how people react to good and bad advice from an automated advisor. In these stories, the advice was based on a wrong fact:",
  debriefOutro:
    "Real automated advisors can make the same kind of mistake when information is entered or read wrongly, so it is always worth checking that advice fits your own situation. The advisor here is part of a research study, not a financial service. If, now that you know this, you would rather your answers were not used, send the participant ID on the next screen to the researcher and they will be deleted.",
  doneTitle: "All done",
  done: "Your responses have been recorded. Thank you for contributing to this research. Your completion code:",
};

/* ---------------- Bahasa Indonesia variants ----------------
   Same study, same logged values (ids, option values, labels in the data
   stay English canonical). Only what the participant reads is translated. */

export const CASES_ID: Record<string, { label: string; text: string }> = {
  C1: {
    label: "Penabung di awal karier",
    text: "Anda berusia 27 tahun, karyawan tetap dengan gaji stabil, dan punya tabungan setara biaya hidup enam bulan. Anda berinvestasi untuk masa pensiun, sekitar 30 tahun lagi, dan Anda mengaku tidak keberatan jika nilai investasi naik turun cukup tajam selama itu.",
  },
  C2: {
    label: "Pertengahan karier, tanpa dana darurat",
    text: "Anda berusia 40 tahun dan bekerja dengan pendapatan stabil, tetapi belum punya dana darurat. Uang ini untuk tujuan sekitar 15 tahun lagi, dan menurut Anda, sikap Anda terhadap risiko sedang-sedang saja.",
  },
  C3: {
    label: "Menjelang pensiun",
    text: "Anda berusia 61 tahun, masih bekerja dengan pendapatan stabil, dan punya cadangan uang tunai yang cukup besar. Anda berencana mulai memakai uang ini sekitar 6 tahun lagi, dan Anda lebih memilih menghindari kerugian besar meskipun hasilnya jadi lebih kecil.",
  },
  C4: {
    label: "Pekerja lepas yang menabung untuk rumah",
    text: "Anda berusia 34 tahun, bekerja lepas dengan pendapatan yang bisa jauh berbeda dari bulan ke bulan, dan belum punya simpanan untuk keadaan darurat. Uang ini Anda tabung untuk uang muka rumah yang rencananya dibayar sekitar 2 tahun lagi, dan Anda bisa menerima naik turun nilai investasi yang sedang-sedang saja.",
  },
  C5: {
    label: "Investor paruh baya yang mapan",
    text: "Anda berusia 48 tahun, punya pekerjaan tetap dan dana darurat yang cukup. Uang ini untuk tujuan sekitar 12 tahun lagi, dan Anda merasa cukup nyaman dengan risiko.",
  },
  C6: {
    label: "Muda, pendapatan tidak tetap",
    text: "Anda berusia 30 tahun dan bekerja dengan kontrak jangka pendek, jadi pendapatan Anda tidak tetap. Meski begitu, Anda menyimpan uang tunai setara biaya hidup enam bulan. Anda berinvestasi untuk sekitar 20 tahun dan bisa menerima naik turun nilai investasi yang sedang-sedang saja.",
  },
  C7: {
    label: "Penabung yang berhati-hati, jangka panjang",
    text: "Anda berusia 36 tahun, dengan pekerjaan yang aman dan dana darurat yang lengkap. Anda berinvestasi untuk sekitar 25 tahun, tetapi Anda mengaku akan merasa stres melihat kerugian yang cukup terasa, dan lebih memilih cara yang hati-hati.",
  },
  C8: {
    label: "Terlambat mulai berinvestasi",
    text: "Anda berusia 55 tahun dan bekerja dengan pendapatan stabil, tetapi tidak punya dana darurat dan masih mencicil pinjaman yang cukup besar. Anda ingin mengejar ketertinggalan tabungan pensiun dalam 10 tahun ke depan dan mengaku bersedia mengambil risiko besar untuk itu.",
  },
};

export function caseDisplay(trial: { profileId: string; label: string; text: string }, locale: "en" | "id") {
  if (locale === "id" && CASES_ID[trial.profileId]) return CASES_ID[trial.profileId];
  return { label: trial.label, text: trial.text };
}

/* The debrief names what the advisor was told wrongly in each flawed case,
   in plain words, so the participant learns what kind of mistake it was. */
const TOL_EN: Record<string, string> = { low: "low", medium: "medium", high: "high" };
const TOL_ID: Record<string, string> = { low: "rendah", medium: "sedang", high: "tinggi" };

export function misreadSentence(misread: Misread, profile: RawProfile, locale: "en" | "id"): string {
  const parts: string[] = [];
  const id = locale === "id";
  if (misread.horizon !== undefined) {
    parts.push(
      id
        ? `jangka waktu ${misread.horizon} tahun, padahal ${profile.horizon} tahun`
        : `a time frame of ${misread.horizon} years instead of ${profile.horizon}`,
    );
  }
  if (misread.tolerance !== undefined) {
    const was = profile.tolerance ?? "medium";
    parts.push(
      id
        ? `sikap terhadap risiko ${TOL_ID[misread.tolerance]}, padahal ${TOL_ID[was]}`
        : `a ${TOL_EN[misread.tolerance]} attitude to risk instead of ${TOL_EN[was]}`,
    );
  }
  if (misread.emergencyFund !== undefined) {
    parts.push(
      misread.emergencyFund
        ? id ? "punya dana darurat, padahal tidak" : "an emergency fund the person does not have"
        : id ? "tidak punya dana darurat, padahal punya" : "no emergency fund, although the person has one",
    );
  }
  if (misread.incomeStable !== undefined) {
    parts.push(
      misread.incomeStable
        ? id ? "pendapatan stabil, padahal tidak tetap" : "a stable income, although it varies"
        : id ? "pendapatan tidak tetap, padahal stabil" : "an income that varies, although it is stable",
    );
  }
  if (misread.nearTermNeed !== undefined) {
    parts.push(
      misread.nearTermNeed
        ? id ? "butuh uangnya dalam waktu dekat, padahal tidak" : "a need for the money soon, which the person does not have"
        : id ? "tidak butuh uangnya dalam waktu dekat, padahal butuh" : "no need for the money soon, although there is one",
    );
  }
  if (misread.debtObligations !== undefined) {
    parts.push(
      misread.debtObligations
        ? id ? "punya utang besar, padahal tidak" : "large debts the person does not have"
        : id ? "tidak punya utang besar, padahal punya" : "no large debts, although the person has them",
    );
  }
  const list = parts.join(id ? ", dan " : ", and ");
  return id ? `Penasihat diberi tahu: ${list}.` : `The advisor was told ${list}.`;
}

const TEXTS_ID: typeof TEXTS = {
  consentTitle: "Sebelum Anda mulai",
  consentIntro:
    "Ini adalah penelitian tentang cara orang menggunakan saran investasi dari penasihat otomatis. Penelitian ini dijalankan oleh Departemen Sistem Informasi, Institut Teknologi Sepuluh Nopember (ITS), Surabaya, dan membutuhkan waktu sekitar 15 sampai 20 menit.",
  consent: [
    {
      heading: "Apa yang akan Anda lakukan",
      text: "Anda akan membaca delapan cerita singkat tentang investor rekaan. Untuk setiap cerita, penasihat otomatis menyarankan cara berinvestasi, lalu Anda menjawab apakah Anda akan mengikuti saran itu dan seberapa besar Anda memercayainya. Sebelum cerita, ada tiga pertanyaan tentang keuangan dan beberapa pernyataan singkat tentang cara Anda berpikir. Setelahnya, ada beberapa penilaian dan dua pertanyaan yang boleh dikosongkan.",
    },
    {
      heading: "Perlu Anda ketahui",
      text: "Tidak ada saran keuangan sungguhan di sini, dan tidak ada uang sungguhan yang dipakai. Jawablah seolah-olah Anda adalah orang dalam setiap cerita. Beberapa hal tentang penelitian ini akan dijelaskan di bagian akhir.",
    },
    {
      heading: "Siapa yang boleh ikut",
      text: "Siapa saja yang berusia 18 tahun ke atas. Keikutsertaan ini sukarela, dan Anda bisa berhenti kapan saja dengan menutup halaman ini, tanpa perlu memberi alasan.",
    },
    {
      heading: "Data Anda",
      text: "Kami tidak meminta nama, email, atau akun apa pun. Jawaban Anda disimpan dengan ID peserta acak, bersama saran yang Anda lihat, sehingga tidak bisa dilacak kembali ke Anda. Jika Anda berhenti di tengah jalan, jawaban Anda disimpan di browser ini paling lama satu minggu supaya Anda bisa melanjutkannya, dan dihapus begitu Anda selesai.",
    },
    {
      heading: "Penggunaan jawaban",
      text: "Jawaban yang anonim ini dianalisis untuk makalah penelitian dan dapat dibagikan di arsip data penelitian terbuka, agar peneliti lain bisa memeriksa hasilnya. Sebelum data itu diterbitkan, Anda bisa meminta jawaban Anda dihapus dengan mengirimkan ID peserta Anda kepada peneliti.",
    },
  ],
  pilotNote:
    "Ini adalah uji coba (pilot) untuk menguji penelitian sebelum pengumpulan data utama. Jawaban dari uji coba dipakai untuk memperbaiki penelitian dan tidak dilaporkan sebagai hasil penelitian.",
  approvalNote: "Penelitian ini telah disetujui oleh {committee} (nomor {reference}).",
  agree: "Saya berusia 18 tahun ke atas, sudah membaca informasi di atas, dan bersedia ikut serta.",
  literacyTitle: "Tiga pertanyaan singkat",
  literacyIntro: "Pertanyaan berikut menyangkut pengetahuan keuangan umum. Tidak apa-apa jika Anda menjawab “Tidak tahu”.",
  exitTitle: "Dua pertanyaan terakhir",
  exitIntro: "Jawab dengan kata-kata Anda sendiri. Satu atau dua kalimat sudah cukup, dan Anda boleh mengosongkannya.",
  exitQ1: "Apakah ada saat Anda tidak percaya pada sarannya? Apa yang membuat Anda menyadarinya?",
  exitQ2: "Apa yang Anda harap dijelaskan oleh penasihat, tetapi ternyata tidak?",
  debriefTitle: "Terima kasih. Satu hal lagi yang perlu Anda ketahui",
  debriefIntro:
    "Di beberapa cerita, penasihat sengaja diberi satu atau dua fakta yang salah tentang orang tersebut, sehingga sarannya tidak cocok untuknya. Kami melakukan ini untuk melihat bagaimana orang menanggapi saran yang baik dan yang buruk dari penasihat otomatis. Di cerita-cerita berikut, saran diberikan berdasarkan fakta yang salah:",
  debriefOutro:
    "Penasihat otomatis sungguhan juga bisa membuat kesalahan seperti ini jika informasi dimasukkan atau dibaca dengan salah, jadi selalu periksa apakah saran yang Anda terima cocok dengan keadaan Anda sendiri. Penasihat di sini adalah bagian dari penelitian, bukan layanan keuangan. Jika setelah mengetahui hal ini Anda tidak ingin jawaban Anda dipakai, kirimkan ID peserta yang tertera di layar berikutnya kepada peneliti, dan jawaban Anda akan dihapus.",
  doneTitle: "Selesai",
  done: "Jawaban Anda sudah tersimpan. Terima kasih telah berkontribusi dalam penelitian ini. Kode penyelesaian Anda:",
};

export function textsFor(locale: "en" | "id") {
  return locale === "id" ? TEXTS_ID : TEXTS;
}

const LITERACY_QUESTIONS_ID: typeof LITERACY_QUESTIONS = [
  {
    name: "lit1",
    text: "Misalkan Anda punya uang 100 di rekening tabungan dengan bunga 2 persen per tahun. Jika uang itu tidak diambil, kira-kira berapa saldo rekening setelah 5 tahun?",
    options: [
      { value: "more", label: "Lebih dari 102" },
      { value: "exact", label: "Tepat 102" },
      { value: "less", label: "Kurang dari 102" },
      { value: "dk", label: "Tidak tahu" },
    ],
  },
  {
    name: "lit2",
    text: "Bayangkan bunga rekening tabungan Anda 1 persen per tahun dan inflasi 2 persen per tahun. Setelah 1 tahun, seberapa banyak yang bisa Anda beli dengan uang di rekening ini?",
    options: [
      { value: "more", label: "Lebih banyak dari hari ini" },
      { value: "same", label: "Sama persis" },
      { value: "less", label: "Lebih sedikit dari hari ini" },
      { value: "dk", label: "Tidak tahu" },
    ],
  },
  {
    name: "lit3",
    text: "Membeli saham satu perusahaan biasanya memberi imbal hasil yang lebih aman daripada reksa dana saham.",
    options: [
      { value: "true", label: "Benar" },
      { value: "false", label: "Salah" },
      { value: "dk", label: "Tidak tahu" },
    ],
  },
];

export function literacyFor(locale: "en" | "id") {
  return locale === "id" ? LITERACY_QUESTIONS_ID : LITERACY_QUESTIONS;
}

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

/* ---------------------------------------------------------------------------
   Personal characteristics and explanation perception.

   Need for cognition: the six-item version, Lins de Holanda Coelho, Hanel and
   Wolf (2020), Assessment 27(8). Items 3 and 4 are reverse scored. The English
   wording is transcribed from Table 2 of Szymanski et al. (TIIS 2025), which
   used the same instrument, so our scores are directly comparable to theirs.

   Ease-of-satisfaction: three items from Kouki et al. (2020) as adapted by
   Szymanski et al., with "health recommendations" replaced by "investment
   recommendations" for this domain.

   Explanation perception: five constructs (trust, transparency,
   persuasiveness, usefulness, satisfaction) which Szymanski et al. adapt from
   Tsai and Brusilovsky (2019) and Van Der Laan et al. (1997). Those two papers
   do not print their items inside the TIIS article, so the wordings below are
   ours and MUST be checked against the source scales before data collection.
   --------------------------------------------------------------------------- */

export interface LikertItem {
  name: string;
  en: string;
  id: string;
  reverse?: boolean;
}

export const LIKERT_LABELS = {
  en: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  id: ["Sangat tidak setuju", "Tidak setuju", "Netral", "Setuju", "Sangat setuju"],
};

/* Attention checks: instructed-response statements (Meade and Craig 2012),
   one among the statements before the cases and one on the last page,
   which every condition sees. `expected` is the point on the 1 to 5 scale
   the statement asks for. They replace the attention case of the pilot,
   which asked for Reject on a scored case and so contaminated its data. */
export const ATTENTION_ITEMS: (LikertItem & { expected: number })[] = [
  {
    name: "attn1",
    en: "To show that you are reading carefully, please choose “Disagree” for this statement.",
    id: "Untuk menunjukkan bahwa Anda membaca dengan teliti, pilih “Tidak setuju” untuk pernyataan ini.",
    expected: 2,
  },
  {
    name: "attn2",
    en: "To show that you are still reading carefully, please choose “Strongly agree” for this statement.",
    id: "Untuk menunjukkan bahwa Anda masih membaca dengan teliti, pilih “Sangat setuju” untuk pernyataan ini.",
    expected: 5,
  },
];

export function attentionResult(name: "attn1" | "attn2", answer: number | undefined): "passed" | "failed" | "" {
  if (answer === undefined) return "";
  const item = ATTENTION_ITEMS.find((it) => it.name === name)!;
  return answer === item.expected ? "passed" : "failed";
}

export const NFC_ITEMS: LikertItem[] = [
  {
    name: "nfc1",
    en: "I would prefer complex to simple problems.",
    id: "Saya lebih menyukai masalah yang rumit daripada yang sederhana.",
  },
  {
    name: "nfc2",
    en: "I like to have the responsibility of handling a situation that requires a lot of thinking.",
    id: "Saya suka diberi tanggung jawab untuk menangani situasi yang membutuhkan banyak pemikiran.",
  },
  {
    name: "nfc3",
    en: "Thinking is not my idea of fun.",
    id: "Berpikir bukanlah hal yang menyenangkan bagi saya.",
    reverse: true,
  },
  {
    name: "nfc4",
    en: "I would rather do something that requires little thought than something that is sure to challenge my thinking abilities.",
    id: "Saya lebih suka melakukan sesuatu yang hanya butuh sedikit pemikiran daripada sesuatu yang pasti menantang kemampuan berpikir saya.",
    reverse: true,
  },
  {
    name: "nfc5",
    en: "I really enjoy a task that involves coming up with new solutions to problems.",
    id: "Saya sangat menikmati tugas yang melibatkan pencarian solusi baru untuk suatu masalah.",
  },
  {
    name: "nfc6",
    en: "I would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought.",
    id: "Saya lebih menyukai tugas yang bersifat intelektual, sulit, dan penting daripada tugas yang cukup penting tetapi tidak menuntut banyak pemikiran.",
  },
];

export const EOS_ITEMS: LikertItem[] = [
  {
    name: "eos1",
    en: "I think I will trust the investment recommendations given in this task.",
    id: "Saya rasa saya akan memercayai rekomendasi investasi yang diberikan dalam tugas ini.",
  },
  {
    name: "eos2",
    en: "I think I will be satisfied with the investment recommendations given in this task.",
    id: "Saya rasa saya akan puas dengan rekomendasi investasi yang diberikan dalam tugas ini.",
  },
  {
    name: "eos3",
    en: "I think the investment recommendations in this task will be accurate.",
    id: "Saya rasa rekomendasi investasi dalam tugas ini akan akurat.",
  },
];

export const PERCEPTION_ITEMS: LikertItem[] = [
  {
    name: "percTrust",
    en: "The explanations made me trust the advisor's recommendations.",
    id: "Penjelasan tersebut membuat saya memercayai rekomendasi penasihat.",
  },
  {
    name: "percTransparency",
    en: "The explanations helped me understand how the advisor reached its recommendations.",
    id: "Penjelasan tersebut membantu saya memahami cara penasihat menghasilkan rekomendasinya.",
  },
  {
    name: "percPersuasiveness",
    en: "The explanations made the recommendations more convincing.",
    id: "Penjelasan tersebut membuat rekomendasinya terasa lebih meyakinkan.",
  },
  {
    name: "percUsefulness",
    en: "The explanations were useful when I decided what to do.",
    id: "Penjelasan tersebut berguna saat saya memutuskan apa yang harus dilakukan.",
  },
  {
    name: "percSatisfaction",
    en: "I am satisfied with the explanations I was shown.",
    id: "Saya puas dengan penjelasan yang ditampilkan kepada saya.",
  },
];

/** Mean score on a 1 to 5 scale, reverse items flipped. Empty when nothing
 *  has been answered, so partial sessions do not produce a fake score. */
export function scaleScore(items: LikertItem[], answers: Record<string, number>): number | "" {
  const vals = items
    .filter((it) => answers[it.name])
    .map((it) => (it.reverse ? 6 - answers[it.name] : answers[it.name]));
  if (!vals.length) return "";
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
}

export function itemsFor(items: LikertItem[], locale: "en" | "id") {
  return items.map((it) => ({ ...it, text: locale === "id" ? it.id : it.en }));
}
