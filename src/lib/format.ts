/* One place for how accuracy figures are written, so every page prints the
   same number with the same context. A cross-validated accuracy on a small
   synthetic benchmark is not a real-world accuracy, and the sentence should
   say so wherever the figure appears. */

export function pct1(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

/** The full, honest form: "88.8% cross-validated accuracy on 400 expert-reviewed synthetic cases". */
export function accuracyPhrase(fraction: number, cases: number, locale: "en" | "id" = "en"): string {
  return locale === "id"
    ? `akurasi validasi silang ${pct1(fraction)} pada ${cases} kasus sintetis yang ditinjau ahli`
    : `${pct1(fraction)} cross-validated accuracy on ${cases} expert-reviewed synthetic cases`;
}
