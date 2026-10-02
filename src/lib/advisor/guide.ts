/* Plain-language background for the recommended outcome: what each asset
   class actually is, concrete examples of how people hold it, and what a
   given portfolio is trying to do. Descriptive only, no projected returns
   and no numbers that the models did not produce. */

import type { Locale } from "@/lib/locale";

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
    what: "Bukti kepemilikan sebagian atas perusahaan di berbagai negara. Nilainya mengikuti laba perusahaan dan harapan investor, jadi bisa naik turun cukup besar dari tahun ke tahun.",
    examples: "Biasanya dibeli dalam bentuk satu reksa dana indeks yang mencakup ribuan perusahaan di pasar negara maju dan berkembang, bukan hanya beberapa saham satu per satu.",
    role: "Bagian yang paling mendorong pertumbuhan, sekaligus bagian yang paling dalam turunnya saat tahun sedang buruk.",
  },
  {
    key: "bonds",
    name: "Obligasi",
    what: "Surat utang dari pemerintah atau perusahaan. Penerbitnya membayar bunga secara rutin dan mengembalikan pokok pinjaman saat jatuh tempo.",
    examples: "Reksa dana obligasi pemerintah, reksa dana obligasi perusahaan yang peringkatnya baik, atau satu reksa dana yang berisi keduanya.",
    role: "Memberi penghasilan yang lebih stabil dan meredam guncangan saat saham turun. Harganya tetap bisa berubah, terutama karena perubahan suku bunga.",
  },
  {
    key: "cash",
    name: "Kas dan pasar uang",
    what: "Uang yang disimpan di tabungan, deposito, atau instrumen jangka sangat pendek, yang nilainya hampir tidak berubah.",
    examples: "Rekening tabungan, deposito berjangka, reksa dana pasar uang, atau surat utang negara jangka pendek.",
    role: "Bagian yang bisa Anda ambil dengan cepat tanpa harus menjual aset lain di saat yang buruk. Kekurangannya, inflasi pelan-pelan mengurangi daya belinya.",
  },
  {
    key: "realAssets",
    name: "Aset riil",
    what: "Hak atas benda fisik, bukan atas laba perusahaan atau perjanjian pinjaman.",
    examples: "Reksa dana properti yang tercatat di bursa (REIT atau DIRE), dana infrastruktur, atau sedikit komoditas seperti emas.",
    role: "Penyeimbang. Pergerakannya sering tidak searah dengan saham dan obligasi, jadi naik turunnya portofolio sedikit lebih halus.",
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
    goal: "Tujuannya menjaga modal tetap utuh, dengan konsekuensi pertumbuhannya lambat.",
    expect: "Sebagian besar dana ditaruh di obligasi dan kas, jadi nilainya jarang bergerak jauh. Dalam jangka panjang, hasilnya mungkin hanya sedikit di atas inflasi. Itulah harga yang dibayar untuk kestabilan ini.",
  },
  conservative: {
    goal: "Tujuannya pertumbuhan secukupnya, dengan naik turun yang cukup kecil sehingga Anda tetap tenang.",
    expect: "Porsi terbesar ada di obligasi, sementara porsi saham yang lebih kecil menjadi sumber pertumbuhannya. Penurunan di tahun yang buruk biasanya ringan, tetapi kenaikan di tahun yang baik juga tidak setinggi portofolio yang banyak sahamnya.",
  },
  balanced: {
    goal: "Tujuannya jalan tengah: pertumbuhan yang berarti dari saham, dengan obligasi yang menjaga portofolio tetap stabil.",
    expect: "Sekitar separuh dana mengikuti pasar saham. Penurunan di tahun yang buruk akan terasa, tetapi sebagian diredam oleh sisa portofolio.",
  },
  growth: {
    goal: "Tujuannya pertumbuhan jangka panjang, dengan menerima bahwa nilainya akan naik turun selama perjalanan.",
    expect: "Sebagian besar dana ada di saham, jadi nilainya bisa turun tajam di tahun yang buruk lalu pulih di tahun-tahun berikutnya. Cocok untuk uang yang tidak akan dipakai dalam waktu dekat.",
  },
  "aggressive-growth": {
    goal: "Tujuannya pertumbuhan jangka panjang setinggi mungkin, dalam batas yang masih wajar.",
    expect: "Hampir semua dana mengikuti pasar saham, jadi penurunan tajam memang bagian dari perjalanannya. Pilihan ini hanya masuk akal jika tidak ada yang memaksa Anda menjual saat harga sedang jatuh.",
  },
  "human-review": {
    goal: "Hasil ini bukan portofolio. Penasihat menyerahkan kasus ini kepada penasihat manusia.",
    expect: "Ada hal dalam situasi ini, misalnya jangka waktu yang pendek, dana cadangan yang tipis, atau informasi yang saling bertentangan, sehingga terlalu berisiko untuk memberi alokasi secara otomatis.",
  },
};

export function outcomeGuide(portfolioId: string, locale: Locale) {
  const table = locale === "id" ? OUTCOME_ID : OUTCOME_EN;
  return table[portfolioId] ?? table.balanced;
}
