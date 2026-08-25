# AdviceIT by Radit: study design

Standalone version of the Study design panel in the app. Version 1.0.0, no data collected yet.

## Research question

Does explanation style (none, feature-based, counterfactual, confidence) affect appropriate reliance on AI investment advice, and does financial literacy moderate the effect?

## Design

Between-subjects on explanation condition, defined by two parts: content (why, what would change it, how sure, in any combination or none) and delivery (static, interactive what-if, adaptive to literacy, conversational). Eight named presets cover the common combinations. Advisor type (neural network or interpretable rule-based advisor, both learned from the same expert data) is a second between-subjects factor that manipulates explanation fidelity with the origin of the rules held constant. A study picks a subset, for example the four single-content presets and the hybrid, by two advisors. Each participant completes sound and flawed advice trials. Financial literacy is a measured moderator (self-rated for now, to be replaced by a short validated literacy scale before the pilot). A within-subjects design with counterbalanced condition order is a viable alternative if recruitment is limited.

## Variables

Independent variables: explanation content, explanation delivery, advisor type.

Dependent variables:

- Appropriate reliance: follow rate on sound advice, override rate on flawed advice. Both advisors can answer Human review instead of a portfolio, so reliance on "see a human" advice is measured too.
- Trust ratings, 1 to 7.
- Decision time, milliseconds from recommendation shown to submit.
- When the participant adjusts: the chosen portfolio and the number of steps from the shown one.
- Deferral: Human review outcomes by the advisor, and "Ask a human adviser" decisions by the participant.

Secondary: perceived understanding, decision confidence, mental demand (one NASA-TLX style item), free-text reasons, and in the interactive condition what-if moves and "why not" questions.

## How appropriate reliance is measured

The Scenario control switches between sound advice (the model as is) and flawed advice (the recommendation shifted two portfolios in the wrong direction). Appropriate reliance means following sound advice and overriding flawed advice. Each logged row records the scenario, the shown portfolio and the sound portfolio, so both rates can be computed per condition. Over-reliance is following flawed advice. Under-reliance is rejecting sound advice.

## Procedure sketch

1. Consent and briefing: hypothetical scenario, no real financial advice.
2. Financial literacy measure.
3. Participant opens their personal link with `flow=study` (condition and advisor assigned in the URL, hidden in the interface). With `serve.py` running on the researcher's laptop, responses are collected there automatically.
4. Consent screen, then the three literacy questions.
5. Six fixed hypothetical cases, half sound and half flawed, in an order seeded by the participant ID, with one attention check. For each case the participant sees the recommendation and, depending on condition, an explanation, then rates trust, chooses follow, adjust (and to what), reject or ask a human, and answers the optional secondary questions.
6. Short interview: why did you follow or override?
7. Debrief, including disclosure of the flawed trials (built into the flow), then analysis on the Analytics page and beyond.

## Analysis sketch

ANOVA or mixed-effects models across explanation conditions and advisor type with financial literacy as a covariate, separately for sound and flawed trials. Of particular interest: the interaction between explanation style and advisor type, since post-hoc explanations of the network may be less faithful than the exact explanations of the rule-based advisor. Trust ratings and decision time as additional outcomes. Interviews coded thematically for reasons to follow or override.

## Ethics note

A real study needs ethics approval, informed consent, hypothetical scenarios only, and no real financial advice. Flawed advice trials require debriefing.

## Provenance

AdviceIT extends my systematic literature review of trust and algorithm aversion in the choice between human and AI financial advisors (SSRAAI 2026). The review described the problem of miscalibrated trust. AdviceIT by Radit is a first step toward the design-side answer.

## Limitations, plainly

The neural network is trained on ILS-Bench, 400 expert-validated but synthetic narratives, not real client records. LLM explanations and narrative reading depend on the participant's browser and GPU. No participant data collected yet. Stylised portfolios. Self-rated knowledge as a stand-in for a validated literacy measure.

