# Back-translation of the Indonesian items

The questionnaire items were written or adapted in English and translated into Bahasa Indonesia by the
research team. Before the main study, the Indonesian version of every item is checked by back-
translation, the usual procedure for adapting a measure to another language (Beaton, Bombardier,
Guillemin and Ferraz, 2000, Spine 25(24):3186-3191).

## Procedure

1. **Translators.** Two bilingual people who have not seen the English items and are not on the
   research team. One with a finance or psychology background, one without, so that wording only
   specialists understand is caught.
2. **Back-translation.** Each translator, working alone, translates the Indonesian column below back
   into English and writes it in their own copy of the "Back-translation" column.
3. **Comparison.** A member of the research team compares each back-translation with the English
   original and marks the items whose meaning has shifted: a different strength ("often" against
   "sometimes"), a different object, a lost negation (watch the reverse-scored items nfc3 and nfc4),
   or a technical term read differently.
4. **Revision.** For each marked item the team writes a new Indonesian wording, and the two translators
   agree it carries the English meaning. Record the reason in the "Notes" column.
5. **Check.** The revised items go into the think-aloud sessions (five per language), where
   participants say in their own words what each item asks.

Before translating need for cognition anew, search for a published, validated Indonesian version of the
six-item scale (Lins de Holanda Coelho, Hanel and Wolf, 2020). If one exists, use its wording and cite
it instead.

The per-case questions (trust, understanding, confidence in the decision, mental demand, the four
decisions) and the two open questions are in `src/components/study/study-flow.tsx` and
`src/lib/study.ts` (`TEXTS_ID`); give them the same treatment. When an item changes, change it in
`src/lib/study.ts` and change `STUDY_DESIGN`.

## Items

Generated from `src/lib/study.ts` at version 3.0.0. lit1 to lit3 are the financial literacy questions,
nfc1 to nfc6 need for cognition, eos1 to eos3 ease of satisfaction, perc* the ratings of the
explanations, attn1 and attn2 the attention checks. The agreement scale is: Sangat tidak setuju, Tidak
setuju, Netral, Setuju, Sangat setuju.

| Code | English | Bahasa Indonesia (current) | Back-translation | Notes |
| --- | --- | --- | --- | --- |
| lit1 | Suppose you had 100 in a savings account and the interest rate was 2 percent per year. After 5 years, how much do you think you would have in the account if you left the money to grow? Options: More than 102; Exactly 102; Less than 102; Do not know | Misalkan Anda punya uang 100 di rekening tabungan dengan bunga 2 persen per tahun. Jika uang itu tidak diambil, kira-kira berapa saldo rekening setelah 5 tahun? Pilihan: Lebih dari 102; Tepat 102; Kurang dari 102; Tidak tahu | | |
| lit2 | Imagine that the interest rate on your savings account was 1 percent per year and inflation was 2 percent per year. After 1 year, how much would you be able to buy with the money in this account? Options: More than today; Exactly the same; Less than today; Do not know | Bayangkan bunga rekening tabungan Anda 1 persen per tahun dan inflasi 2 persen per tahun. Setelah 1 tahun, seberapa banyak yang bisa Anda beli dengan uang di rekening ini? Pilihan: Lebih banyak dari hari ini; Sama persis; Lebih sedikit dari hari ini; Tidak tahu | | |
| lit3 | Buying a single company's stock usually provides a safer return than a stock mutual fund. Options: True; False; Do not know | Membeli saham satu perusahaan biasanya memberi imbal hasil yang lebih aman daripada reksa dana saham. Pilihan: Benar; Salah; Tidak tahu | | |
| nfc1 | I would prefer complex to simple problems. | Saya lebih menyukai masalah yang rumit daripada yang sederhana. | | |
| nfc2 | I like to have the responsibility of handling a situation that requires a lot of thinking. | Saya suka diberi tanggung jawab untuk menangani situasi yang membutuhkan banyak pemikiran. | | |
| nfc3 (reverse) | Thinking is not my idea of fun. | Berpikir bukanlah hal yang menyenangkan bagi saya. | | |
| nfc4 (reverse) | I would rather do something that requires little thought than something that is sure to challenge my thinking abilities. | Saya lebih suka melakukan sesuatu yang hanya butuh sedikit pemikiran daripada sesuatu yang pasti menantang kemampuan berpikir saya. | | |
| nfc5 | I really enjoy a task that involves coming up with new solutions to problems. | Saya sangat menikmati tugas yang melibatkan pencarian solusi baru untuk suatu masalah. | | |
| nfc6 | I would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought. | Saya lebih menyukai tugas yang bersifat intelektual, sulit, dan penting daripada tugas yang cukup penting tetapi tidak menuntut banyak pemikiran. | | |
| eos1 | I think I will trust the investment recommendations given in this task. | Saya rasa saya akan memercayai rekomendasi investasi yang diberikan dalam tugas ini. | | |
| eos2 | I think I will be satisfied with the investment recommendations given in this task. | Saya rasa saya akan puas dengan rekomendasi investasi yang diberikan dalam tugas ini. | | |
| eos3 | I think the investment recommendations in this task will be accurate. | Saya rasa rekomendasi investasi dalam tugas ini akan akurat. | | |
| percTrust | The explanations made me trust the advisor's recommendations. | Penjelasan tersebut membuat saya memercayai rekomendasi penasihat. | | |
| percTransparency | The explanations helped me understand how the advisor reached its recommendations. | Penjelasan tersebut membantu saya memahami cara penasihat menghasilkan rekomendasinya. | | |
| percPersuasiveness | The explanations made the recommendations more convincing. | Penjelasan tersebut membuat rekomendasinya terasa lebih meyakinkan. | | |
| percUsefulness | The explanations were useful when I decided what to do. | Penjelasan tersebut berguna saat saya memutuskan apa yang harus dilakukan. | | |
| percSatisfaction | I am satisfied with the explanations I was shown. | Saya puas dengan penjelasan yang ditampilkan kepada saya. | | |
| attn1 | To show that you are reading carefully, please choose “Disagree” for this statement. | Untuk menunjukkan bahwa Anda membaca dengan teliti, pilih “Tidak setuju” untuk pernyataan ini. | | |
| attn2 | To show that you are still reading carefully, please choose “Strongly agree” for this statement. | Untuk menunjukkan bahwa Anda masih membaca dengan teliti, pilih “Sangat setuju” untuk pernyataan ini. | | |
