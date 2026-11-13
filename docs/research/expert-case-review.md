# Expert review of the study cases

Before the main study, two or three people with professional investment experience (a financial
planner, an adviser, a portfolio manager, a finance lecturer) confirm that, for each case, the advice the
study treats as sound suits the person described, and the advice it treats as flawed does not. The
study's primary outcome depends on this: following advice only counts as appropriate if the advice is
right.

How to run it: send each expert the part of this document up to "Researcher key", without the key.
Each case shows the two pieces of advice participants can meet for that story, in an order that does not
reveal which is which. Ask the experts to work alone and not to discuss the cases with each other.

What to do with the answers:

- A case passes when every expert picks the sound outcome, or one next to it, in question 1, rates the
  sound advice 4 or 5 and the flawed advice 1 or 2.
- A case that fails is replaced or its story adjusted, and the review is repeated for it. Any change to a
  case means a new `STUDY_DESIGN` in `src/lib/study.ts`.
- Two cases need particular attention. In **C6** the advisor's own answer is uncertain (54 percent), so
  the experts may consider Balanced as suitable as Growth. **C3**'s flaw takes two wrong facts, where the
  others take one.

The cases below are generated from `src/lib/study.ts` at version 3.0.0 (design `content5-ml-misread8`).

---

## Instructions for the expert

Thank you for helping. Below are eight short descriptions of made-up people who want to invest, written
the way study participants read them ("you are..."). For each person there are two pieces of advice, A
and B. Each is either one of five investment mixes, from Capital preservation (mostly bonds and cash) to
Aggressive growth (mostly shares), or a referral to a human adviser instead of a mix. Please judge them
as a professional would for a retail client in Indonesia, using only the information given. There are
four questions per case and it takes about 20 minutes. Your answers are used only to check the study
materials.

The five mixes, in order of risk:

| Mix | Global equities | Bonds | Cash and money market | Real assets |
| --- | --- | --- | --- | --- |
| Capital preservation | 15% | 50% | 30% | 5% |
| Conservative | 30% | 50% | 15% | 5% |
| Balanced | 50% | 35% | 5% | 10% |
| Growth | 70% | 20% | 0% | 10% |
| Aggressive growth | 85% | 5% | 0% | 10% |

### Case 1 (C1): Early career saver

You are 27, in a permanent job with a steady salary, and you have six months of expenses in a savings account. You are investing for retirement, roughly 30 years away, and you say you are comfortable with large swings in value along the way.

*Bahasa Indonesia:* Anda berusia 27 tahun, karyawan tetap dengan gaji stabil, dan punya tabungan setara biaya hidup enam bulan. Anda berinvestasi untuk masa pensiun, sekitar 30 tahun lagi, dan Anda mengaku tidak keberatan jika nilai investasi naik turun cukup tajam selama itu.

- Advice A: Aggressive growth (equities 85%, bonds 5%, cash 0%, real assets 10%)
- Advice B: Conservative (equities 30%, bonds 50%, cash 15%, real assets 5%)

| Question | Answer |
| --- | --- |
| 1. Which outcome suits this person best? (Capital preservation, Conservative, Balanced, Growth, Aggressive growth, Refer to a human adviser) | |
| 2. How suitable is Advice A for this person? (1 very unsuitable to 5 very suitable) | |
| 3. How suitable is Advice B for this person? (1 to 5) | |
| 4. Is anything in the story unclear or unrealistic? | |

### Case 2 (C2): Mid-career, no buffer

You are 40, employed with a stable income, but you do not have an emergency fund set aside. This money is for a goal about 15 years away, and you describe your attitude to risk as moderate.

*Bahasa Indonesia:* Anda berusia 40 tahun dan bekerja dengan pendapatan stabil, tetapi belum punya dana darurat. Uang ini untuk tujuan sekitar 15 tahun lagi, dan menurut Anda, sikap Anda terhadap risiko sedang-sedang saja.

- Advice A: Capital preservation (equities 15%, bonds 50%, cash 30%, real assets 5%)
- Advice B: Balanced (equities 50%, bonds 35%, cash 5%, real assets 10%)

| Question | Answer |
| --- | --- |
| 1. Which outcome suits this person best? (Capital preservation, Conservative, Balanced, Growth, Aggressive growth, Refer to a human adviser) | |
| 2. How suitable is Advice A for this person? (1 very unsuitable to 5 very suitable) | |
| 3. How suitable is Advice B for this person? (1 to 5) | |
| 4. Is anything in the story unclear or unrealistic? | |

### Case 3 (C3): Approaching retirement

You are 61, still working with a stable income, with a solid cash reserve. You expect to start drawing on this money in about 6 years, and you prefer to avoid large losses even if that means lower returns.

*Bahasa Indonesia:* Anda berusia 61 tahun, masih bekerja dengan pendapatan stabil, dan punya cadangan uang tunai yang cukup besar. Anda berencana mulai memakai uang ini sekitar 6 tahun lagi, dan Anda lebih memilih menghindari kerugian besar meskipun hasilnya jadi lebih kecil.

- Advice A: Conservative (equities 30%, bonds 50%, cash 15%, real assets 5%)
- Advice B: Growth (equities 70%, bonds 20%, cash 0%, real assets 10%)

| Question | Answer |
| --- | --- |
| 1. Which outcome suits this person best? (Capital preservation, Conservative, Balanced, Growth, Aggressive growth, Refer to a human adviser) | |
| 2. How suitable is Advice A for this person? (1 very unsuitable to 5 very suitable) | |
| 3. How suitable is Advice B for this person? (1 to 5) | |
| 4. Is anything in the story unclear or unrealistic? | |

### Case 4 (C4): Freelancer saving for a house

You are 34, self-employed with an income that varies a lot from month to month, and you have no cash set aside for emergencies. You are saving this money for a house deposit you plan to pay in about 2 years, and you are comfortable with moderate ups and downs along the way.

*Bahasa Indonesia:* Anda berusia 34 tahun, bekerja lepas dengan pendapatan yang bisa jauh berbeda dari bulan ke bulan, dan belum punya simpanan untuk keadaan darurat. Uang ini Anda tabung untuk uang muka rumah yang rencananya dibayar sekitar 2 tahun lagi, dan Anda bisa menerima naik turun nilai investasi yang sedang-sedang saja.

- Advice A: Growth (equities 70%, bonds 20%, cash 0%, real assets 10%)
- Advice B: Human review (no mix: refer to a human adviser)

| Question | Answer |
| --- | --- |
| 1. Which outcome suits this person best? (Capital preservation, Conservative, Balanced, Growth, Aggressive growth, Refer to a human adviser) | |
| 2. How suitable is Advice A for this person? (1 very unsuitable to 5 very suitable) | |
| 3. How suitable is Advice B for this person? (1 to 5) | |
| 4. Is anything in the story unclear or unrealistic? | |

### Case 5 (C5): Steady mid-life investor

You are 48, with a stable job and a comfortable emergency fund. This money is for a goal about 12 years away, and you describe yourself as moderately comfortable with risk.

*Bahasa Indonesia:* Anda berusia 48 tahun, punya pekerjaan tetap dan dana darurat yang cukup. Uang ini untuk tujuan sekitar 12 tahun lagi, dan Anda merasa cukup nyaman dengan risiko.

- Advice A: Growth (equities 70%, bonds 20%, cash 0%, real assets 10%)
- Advice B: Conservative (equities 30%, bonds 50%, cash 15%, real assets 5%)

| Question | Answer |
| --- | --- |
| 1. Which outcome suits this person best? (Capital preservation, Conservative, Balanced, Growth, Aggressive growth, Refer to a human adviser) | |
| 2. How suitable is Advice A for this person? (1 very unsuitable to 5 very suitable) | |
| 3. How suitable is Advice B for this person? (1 to 5) | |
| 4. Is anything in the story unclear or unrealistic? | |

### Case 6 (C6): Young, variable income

You are 30, working on short contracts so your income is irregular, but you keep six months of expenses in cash. You are investing for about 20 years and would accept moderate ups and downs.

*Bahasa Indonesia:* Anda berusia 30 tahun dan bekerja dengan kontrak jangka pendek, jadi pendapatan Anda tidak tetap. Meski begitu, Anda menyimpan uang tunai setara biaya hidup enam bulan. Anda berinvestasi untuk sekitar 20 tahun dan bisa menerima naik turun nilai investasi yang sedang-sedang saja.

- Advice A: Capital preservation (equities 15%, bonds 50%, cash 30%, real assets 5%)
- Advice B: Growth (equities 70%, bonds 20%, cash 0%, real assets 10%)

| Question | Answer |
| --- | --- |
| 1. Which outcome suits this person best? (Capital preservation, Conservative, Balanced, Growth, Aggressive growth, Refer to a human adviser) | |
| 2. How suitable is Advice A for this person? (1 very unsuitable to 5 very suitable) | |
| 3. How suitable is Advice B for this person? (1 to 5) | |
| 4. Is anything in the story unclear or unrealistic? | |

### Case 7 (C7): Cautious saver, long horizon

You are 36, in a secure job with a full emergency fund. You are investing for about 25 years, but you say you would find any noticeable loss stressful and prefer a cautious approach.

*Bahasa Indonesia:* Anda berusia 36 tahun, dengan pekerjaan yang aman dan dana darurat yang lengkap. Anda berinvestasi untuk sekitar 25 tahun, tetapi Anda mengaku akan merasa stres melihat kerugian yang cukup terasa, dan lebih memilih cara yang hati-hati.

- Advice A: Conservative (equities 30%, bonds 50%, cash 15%, real assets 5%)
- Advice B: Aggressive growth (equities 85%, bonds 5%, cash 0%, real assets 10%)

| Question | Answer |
| --- | --- |
| 1. Which outcome suits this person best? (Capital preservation, Conservative, Balanced, Growth, Aggressive growth, Refer to a human adviser) | |
| 2. How suitable is Advice A for this person? (1 very unsuitable to 5 very suitable) | |
| 3. How suitable is Advice B for this person? (1 to 5) | |
| 4. Is anything in the story unclear or unrealistic? | |

### Case 8 (C8): Late starter

You are 55, employed with a stable income, without an emergency fund and still repaying a sizeable loan. You want to catch up on retirement savings over the next 10 years and say you are willing to take substantial risk to do so.

*Bahasa Indonesia:* Anda berusia 55 tahun dan bekerja dengan pendapatan stabil, tetapi tidak punya dana darurat dan masih mencicil pinjaman yang cukup besar. Anda ingin mengejar ketertinggalan tabungan pensiun dalam 10 tahun ke depan dan mengaku bersedia mengambil risiko besar untuk itu.

- Advice A: Balanced (equities 50%, bonds 35%, cash 5%, real assets 10%)
- Advice B: Human review (no mix: refer to a human adviser)

| Question | Answer |
| --- | --- |
| 1. Which outcome suits this person best? (Capital preservation, Conservative, Balanced, Growth, Aggressive growth, Refer to a human adviser) | |
| 2. How suitable is Advice A for this person? (1 very unsuitable to 5 very suitable) | |
| 3. How suitable is Advice B for this person? (1 to 5) | |
| 4. Is anything in the story unclear or unrealistic? | |

---

## Researcher key (remove before sending)

The sound advice is the AI advisor's answer on the facts in the story; the flawed advice is its answer when it is given the wrong facts listed. "Sure" is the advisor's calibrated probability for that advice.

| Case | Advice on the real facts | Wrong facts given | Flawed advice | Slot of the flawed advice |
| --- | --- | --- | --- | --- |
| C1 | Aggressive growth (94% sure) | a low attitude to risk instead of high. | Conservative (81% sure) | B |
| C2 | Balanced (71% sure) | a time frame of 5 years instead of 15. | Capital preservation (79% sure) | A |
| C3 | Conservative (95% sure) | a time frame of 16 years instead of 6, and a medium attitude to risk instead of low. | Growth (96% sure) | B |
| C4 | Human review (100% sure) | a time frame of 20 years instead of 2. | Growth (81% sure) | A |
| C5 | Growth (96% sure) | a low attitude to risk instead of medium. | Conservative (97% sure) | B |
| C6 | Growth (54% sure) | a time frame of 5 years instead of 20. | Capital preservation (79% sure) | A |
| C7 | Conservative (92% sure) | a high attitude to risk instead of low. | Aggressive growth (93% sure) | B |
| C8 | Human review (100% sure) | a medium attitude to risk instead of high. | Balanced (89% sure) | A |
