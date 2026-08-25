/* Plain-language background for the recommended outcome: what each asset
   class actually is, concrete examples of how people hold it, and what a
   given portfolio is trying to do. Descriptive only, no projected returns
   and no numbers that the models did not produce. */

import type { Locale } from "@/lib/i18n";

export interface AssetNote {
  key: "equities" | "bonds" | "cash" | "realAssets";
  name: string;
  what: string;
  examples: string;
  role: string;
}

const EN: AssetNote[] = [
  {
    key: "equities",
    name: "Global equities",
    what: "Part ownership of companies around the world. Their value follows company profits and investor expectations, so it moves a lot from year to year.",
    examples: "Usually held as one broad index fund covering thousands of listed companies across developed and emerging markets, rather than a handful of individual shares.",
    role: "The growth engine of the mix, and the part that falls hardest in a bad year.",
  },
  {
    key: "bonds",
    name: "Bonds",
    what: "Loans to governments or companies that pay interest on a fixed schedule and return the principal at the end of the term.",
    examples: "Government bond funds, investment-grade corporate bond funds, or a single aggregate bond fund that holds both.",
    role: "Steadier income that cushions equity falls. Prices still move, mostly with interest rates.",
  },
  {
    key: "cash",
    name: "Cash and money market",
    what: "Money kept in deposits or in very short-term instruments, where the value barely moves.",
    examples: "A savings account, a term deposit, a money market fund, or short-term treasury bills.",
    role: "The part you can reach quickly without selling anything at a bad moment. Its cost is that inflation slowly erodes what it buys.",
  },
  {
    key: "realAssets",
    name: "Real assets",
    what: "Claims on physical things rather than on company earnings or a loan contract.",
    examples: "Listed property funds (REITs), infrastructure funds, or a small commodity holding such as gold.",
    role: "A diversifier. It often moves out of step with shares and bonds, which smooths the ride a little.",
  },
];

const ID: AssetNote[] = [
  {
    key: "equities",
    name: "Saham global",
    what: "Kepemilikan sebagian atas perusahaan di berbagai negara. Nilainya mengikuti laba perusahaan dan ekspektasi investor, sehingga naik turunnya besar dari tahun ke tahun.",
    examples: "Biasanya dipegang sebagai satu reksa dana indeks luas yang mencakup ribuan perusahaan tercatat di pasar maju dan berkembang, bukan beberapa saham individual.",
    role: "Mesin pertumbuhan dalam campuran ini, sekaligus bagian yang paling dalam jatuhnya pada tahun yang buruk.",
  },
  {
    key: "bonds",
    name: "Obligasi",
    what: "Pinjaman kepada pemerintah atau perusahaan yang membayar bunga sesuai jadwal tetap dan mengembalikan pokoknya di akhir tenor.",
    examples: "Reksa dana obligasi pemerintah, reksa dana obligasi korporasi berperingkat baik, atau satu dana agregat yang memegang keduanya.",
    role: "Pendapatan yang lebih stabil dan bantalan saat saham turun. Harganya tetap bergerak, terutama mengikuti suku bunga.",
  },
  {
    key: "cash",
    name: "Kas dan pasar uang",
    what: "Uang yang disimpan dalam bentuk simpanan atau instrumen berjangka sangat pendek, yang nilainya nyaris tidak bergerak.",
    examples: "Rekening tabungan, deposito berjangka, reksa dana pasar uang, atau surat utang negara jangka pendek.",
    role: "Bagian yang bisa Anda ambil cepat tanpa harus menjual apa pun di saat yang buruk. Biayanya, inflasi perlahan menggerus daya belinya.",
  },
  {
    key: "realAssets",
    name: "Aset riil",
    what: "Klaim atas benda fisik, bukan atas laba perusahaan atau kontrak pinjaman.",
    examples: "Dana properti tercatat (REIT), dana infrastruktur, atau porsi kecil komoditas seperti emas.",
    role: "Penyeimbang. Pergerakannya kerap tidak seiring dengan saham dan obligasi, sehingga perjalanannya sedikit lebih halus.",
  },
];

export function assetNotes(locale: Locale): AssetNote[] {
  return locale === "id" ? ID : EN;
}

const OUTCOME_EN: Record<string, { goal: string; expect: string }> = {
  "capital-preservation": {
    goal: "The aim is to keep the amount intact and accept slow growth in return.",
    expect: "Most of the money sits in bonds and cash, so the value moves little. Over long periods it may barely stay ahead of inflation, which is the price of that steadiness.",
  },
  conservative: {
    goal: "The aim is modest growth with swings small enough to sit through.",
    expect: "Bonds lead and a smaller equity sleeve does the growing. Bad years are usually mild, and good years are more muted than a share-heavy mix.",
  },
  balanced: {
    goal: "The aim is a middle road: real growth from shares, with bonds holding the mix steady.",
    expect: "Roughly half the money follows the stock market. Falls in a bad year are noticeable but partly absorbed by the rest of the mix.",
  },
  growth: {
    goal: "The aim is long-term growth, accepting that the value will swing on the way there.",
    expect: "Shares dominate, so the value can drop sharply in a bad year and recover over the years that follow. It suits money that will not be needed soon.",
  },
  "aggressive-growth": {
    goal: "The aim is the highest long-term growth the mix can reasonably pursue.",
    expect: "Almost everything follows the stock market, so severe falls are part of the plan. It only makes sense when nothing would force a sale during one.",
  },
  "human-review": {
    goal: "The aim here is not a portfolio at all. The advisor is handing the case to a person.",
    expect: "Something in the situation, such as a short horizon, thin reserves or conflicting signals, makes an automated allocation unsafe to give.",
  },
};

const OUTCOME_ID: Record<string, { goal: string; expect: string }> = {
  "capital-preservation": {
    goal: "Tujuannya menjaga nilai pokok tetap utuh dan sebagai gantinya menerima pertumbuhan yang lambat.",
    expect: "Sebagian besar dana berada di obligasi dan kas, sehingga nilainya sedikit bergerak. Dalam jangka panjang mungkin hanya sedikit melampaui inflasi, dan itulah harga dari kestabilan tersebut.",
  },
  conservative: {
    goal: "Tujuannya pertumbuhan sedang dengan gejolak yang cukup kecil untuk dijalani dengan tenang.",
    expect: "Obligasi mendominasi dan porsi saham yang lebih kecil menjadi penggeraknya. Tahun buruk biasanya ringan, dan tahun baik lebih landai dibanding campuran yang berat saham.",
  },
  balanced: {
    goal: "Tujuannya jalan tengah: pertumbuhan nyata dari saham, dengan obligasi menjaga kestabilan campuran.",
    expect: "Sekitar separuh dana mengikuti pasar saham. Penurunan pada tahun buruk terasa, tetapi sebagian diredam oleh sisa campurannya.",
  },
  growth: {
    goal: "Tujuannya pertumbuhan jangka panjang, dengan menerima bahwa nilainya akan bergejolak di sepanjang jalan.",
    expect: "Saham mendominasi, sehingga nilainya bisa turun tajam pada tahun buruk dan pulih pada tahun-tahun berikutnya. Cocok untuk uang yang tidak akan dibutuhkan dalam waktu dekat.",
  },
  "aggressive-growth": {
    goal: "Tujuannya pertumbuhan jangka panjang setinggi yang wajar dikejar oleh campuran ini.",
    expect: "Hampir seluruhnya mengikuti pasar saham, sehingga penurunan tajam adalah bagian dari rencana. Ini hanya masuk akal bila tidak ada hal yang memaksa Anda menjual saat penurunan terjadi.",
  },
  "human-review": {
    goal: "Di sini tujuannya bukan sebuah portofolio. Penasihat menyerahkan kasus ini kepada seorang manusia.",
    expect: "Ada hal dalam situasi ini, misalnya horizon yang pendek, cadangan yang tipis, atau sinyal yang saling bertentangan, yang membuat alokasi otomatis tidak aman untuk diberikan.",
  },
};

export function outcomeGuide(portfolioId: string, locale: Locale) {
  const table = locale === "id" ? OUTCOME_ID : OUTCOME_EN;
  return table[portfolioId] ?? table.balanced;
}
