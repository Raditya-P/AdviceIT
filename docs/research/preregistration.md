# Pre-registration (draft)

Draft for OSF Registries, following the OSF Preregistration template. Instrument version 3.0.0,
design `content5-ml-misread8`. Square brackets mark what is fixed only after the pilot and the expert
review; the draft is registered, with those filled in, before the main study starts.

## Title

Explanations and appropriate reliance on AI investment advice: does what an explanation shows help lay
investors set aside flawed advice?

## Hypotheses

The unit of analysis is a participant's decision on one case. *Reliance* means the participant went
with the advice shown (definition below). *Discrimination* is reliance on sound advice minus reliance
on flawed advice.

- **H1.** The explanation condition moderates the effect of the scenario (sound or flawed advice) on
  reliance: the condition by scenario interaction is not zero.
- **H2.** Compared with No explanation, each of Why, What would change it and All three yields greater
  discrimination, mainly through lower reliance on flawed advice. Rationale: these explanations show the
  facts the advisor used, so the wrong fact behind flawed advice is visible.
- **H3.** Compared with No explanation, How sure does not yield greater discrimination. Rationale:
  flawed advice built on a wrong fact is given with the same high confidence as sound advice, so the
  confidence display carries no cue. This is tested as an equivalence claim only in the exploratory
  part; in the confirmatory part H3 is supported if the How sure contrast is not significant and its
  estimate is smaller than the smallest H2 estimate.

## Design plan

- **Study type:** experiment, online, one session.
- **Blinding:** participants are not told which condition they are in or that some advice is flawed;
  the consent says that some details are explained at the end. The researcher does not interact with
  participants.
- **Design:** one between-participants factor, explanation condition, five levels: none (control),
  feature ("Why"), counterfactual ("What would change it"), confidence ("How sure"), hybrid ("All
  three"). Within participants: eight cases, four with sound and four with flawed advice. All
  participants see the same AI advisor (a neural network), with explanations shown as static panels.
- **Assignment:** at consent, each participant is placed in the condition with the fewest participants
  who have finished or are probably still taking part (started in the last two hours), ties broken at
  random (balanced assignment; the rule is in
  `src/lib/sql.ts`). The order of the eight cases and which four are flawed are drawn at random from a
  seed based on the participant ID (`buildPlan` in `src/lib/study.ts`).
- **Flawed advice:** for each case, a fixed set of one or two wrong facts is given to the advisor in
  place of the real ones (`CASES[].misread` in `src/lib/study.ts`). Each makes the advice at least two
  mixes away from the sound advice, or a mix where a referral to a human was due; four flaws make the
  advice riskier and four more cautious. [Confirmed by the expert review on (date).]

## Sampling plan

- **Existing data:** the main study collects new data only. Answers from the pilot (all rows with
  `studyPhase` "pilot", and all rows from before version 3.0.0) are not analysed for the hypotheses.
  The pilot's descriptive figures inform the sample size below.
- **Collection:** an open link shared through university mailing lists, student and alumni groups and
  social media, in Indonesia and English. [Compensation.] Adults aged 18 or older.
- **Sample size:** [N] valid participants per condition, [5N] in total.
- **Rationale:** simulation with `scripts/power-sim.ts`, using the pilot's reliance on sound and on
  flawed advice in the control ([x] and [y]), its spread between participants and between cases, and
  a smallest effect of interest of [d] percentage points lower reliance on flawed advice. N gives at
  least 80 percent power for each H2 comparison under Holm correction across the four comparisons.
  For orientation, under assumed values (0.80 and 0.55, participant sd 1.0, case sd 0.5 on the logit
  scale), the simulation gives about 140 per condition for a 15-point effect, 80 for 20 points and 50 for
  25 points.
- **Stopping rule:** collection stops when every condition has at least N valid participants, checked
  weekly on the dashboard with the exclusions below applied. Because balanced assignment keeps the
  conditions level, the conditions finish within a few participants of each other; all valid sessions
  completed by the stopping date are analysed.

## Variables

**Manipulated:** explanation condition (five levels); scenario (sound or flawed) within participants.

**Measured, per case:**

- `decision`: follow, adjust (with the mix chosen), reject, or ask a human adviser.
- `trustRating`, `understanding`, `decisionConfidence`, `mentalDemand`: 1 to 7.
- `reason`: optional free text. `caseReadMs`, `decisionTimeMs`: times.

**Measured, once:** financial literacy (three questions, scored 0 to 3); need for cognition (six items,
1 to 5, items 3 and 4 reversed, mean); ease of satisfaction (three items, mean); explanation perception
(five items, not asked in the control); two attention statements; two open questions.

**Indices** (defined in `src/lib/scoring.ts` and checked by `scripts/scoring-smoke.ts`):

- **Relied** (per case): the decision is Follow, or it is Ask a human adviser and the advice shown was
  itself a referral to a human adviser.
- **Appropriate** (per case, primary outcome): relied on sound advice, or did not rely on flawed advice.
- **Corrected** (per flawed case, secondary): adjusted to the sound mix, or asked a human adviser when
  the sound outcome was a referral.
- **Discrimination** (per participant, for description and for the planning simulation): share of
  sound cases relied on minus share of flawed cases relied on.

## Analysis plan

**Confirmatory model (H1 to H3).** A mixed-effects logistic regression of reliance:

```
relied ~ condition * scenario + (1 + scenario | participant) + (1 | case)
```

with treatment coding (No explanation and sound advice as reference), fitted with lme4 `glmer`
(bobyqa optimiser). If the random slope does not converge, it is dropped first, then the case
intercept; the model actually fitted is reported.

- **H1:** likelihood-ratio test of the model against the same model without the interaction terms,
  alpha .05.
- **H2 and H3:** the four interaction coefficients (each condition by flawed scenario against No
  explanation), with Holm correction across the four, alpha .05 family-wise. H2 is supported for a
  condition if its coefficient is negative and significant (less reliance on flawed advice relative to
  sound, compared with the control). Results are also reported as differences in predicted
  probabilities with 95 percent confidence intervals (emmeans).

**Secondary analyses**, reported with estimates and confidence intervals, without correction and
labelled as such: the same model with *appropriate* as the outcome; corrected decisions on flawed cases
by condition; trust, understanding, confidence and mental demand (linear mixed models, condition by
scenario); explanation perception by condition.

**Exploratory analyses:** moderation of the condition by scenario effect by financial literacy and by
need for cognition; the effect of the language of the session; decision time; whether flaws that make
advice riskier are caught as often as flaws that make it more cautious; thematic analysis of the written
reasons and open questions (Clarke and Braun, 2017), joined with the quantitative results by condition.

**Exclusions**, applied in this order and reported with counts:

1. Researcher test sessions (`assignmentMethod` "url").
2. Repeat sessions: a session started in a browser that had already completed one (`repeatOf` not
   empty).
3. Participants who fail either attention statement (`attentionCheck` "failed").
4. Participants whose median decision time across the eight cases is under [s] seconds, the cut-off set
   from the pilot's distribution of decision times before the main study starts.

The confirmatory analysis is repeated without exclusions 3 and 4 as a robustness check.

**Missing data:** only completed sessions (an exit row) count as participants. Incomplete sessions are
not imputed; dropout per condition is reported from the assignment records, and a difference in dropout
between conditions is discussed as a threat to the comparison.

## Other

The instrument, the analysis scripts and the data (after publication) are public at
https://github.com/Raditya-P/AdviceIT. Ethics approval: [committee, reference].
