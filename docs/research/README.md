# Research documents

Working documents for the AdviceIT main study, from ethics approval to pre-registration. They
describe version 3.0.0 of the instrument (design `content5-ml-misread8`). Where a document repeats
something the code defines (the consent text, the cases, the questionnaire items, the scoring
rules), the code is the source and the document says which file to check.

| Document | What it is for |
| --- | --- |
| [protocol.md](protocol.md) | The study protocol for the ethics committee: aims, procedure, deception and debrief, risks, data handling. |
| [consent-and-debrief.md](consent-and-debrief.md) | The participant-facing texts in English and Bahasa Indonesia: recruitment message, consent, debrief. |
| [expert-case-review.md](expert-case-review.md) | A form for two or three financial experts to confirm that the sound advice suits each case and the flawed advice does not. |
| [translation.md](translation.md) | The procedure and worksheet for back-translating the Indonesian questionnaire items. |
| [preregistration.md](preregistration.md) | The draft pre-registration: hypotheses, design, sample size, scoring, analysis, exclusions. |

The sample size is planned with `scripts/power-sim.ts`; the pre-registration explains how.

## Status

Step 1, ethics:

- [ ] An ITS lecturer agrees to supervise and co-author. Add their name to `SUPERVISOR` in
      `src/lib/study.ts` and to the protocol.
- [ ] Decide on compensation (section 11 of the protocol) and add it to the consent.
- [ ] Submit the protocol and the consent and debrief texts to the ethics committee (KEP ITS, through
      the lecturer).
- [ ] When approved, put the committee and the reference in `ETHICS_APPROVAL` in `src/lib/study.ts`.
      From the next deployment every new session is logged as the main study, and the consent shows
      the approval in place of the pilot note.

Step 2, instrument:

- [ ] Expert review of the eight cases. Replace or adjust any case the experts do not agree on, then
      change `STUDY_DESIGN` in `src/lib/study.ts`.
- [ ] Back-translation of the Indonesian items, and any wording changes it calls for.
- [ ] Five think-aloud sessions per language on the finished version.
- [ ] Run the pilot until there are about 30 complete sessions, and read the reliance figures off
      the researcher dashboard.

Step 3, pre-registration:

- [ ] Re-run `scripts/power-sim.ts` with the pilot's figures and fix the sample size.
- [ ] Fix the speed cut-off for exclusions from the pilot's completion times.
- [ ] Fill the remaining blanks in `preregistration.md` and register it on OSF before the main study
      starts.
