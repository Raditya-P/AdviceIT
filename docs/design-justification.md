# Design justification

Every interface and study decision in AdviceIT, with the published work that supports it.
The purpose is that no design choice in the paper rests on taste alone.

**Verification status** is recorded for each source, because an unverified citation is worse
than no citation:

- `PDF` means the full paper was read.
- `REF` means the entry was taken verbatim from the reference list of a paper we read.
- `WEB` means the title, authors, venue and year were confirmed against the publisher or arXiv.

Sources marked `REF` and `WEB` still need the DOI opened once before the paper is submitted.

## 1. Sequential flow: read the case, then ask the advisor

**Decision.** Each study trial runs in three phases. The participant reads the investor case
on its own screen, presses a button to ask the advisor, and only then sees the recommendation.
The advisor pages use the same shape: choose the explanation, describe the investor, then see
the result.

**Claim.** Separating the case from the advice makes people engage with the problem before the
answer is available, which is the mechanism that reduces uncritical acceptance.

| Source | What it supports | Status |
| --- | --- | --- |
| Buçinca, Malaya and Gajos (2021). To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-assisted Decision-making. Proc. ACM HCI 5, CSCW1. doi:10.1145/3449287 | Directly. Withholding the AI answer until the person has engaged with the task is a cognitive forcing function, and their experiments show such interventions reduce overreliance where explanations alone do not | WEB |
| Springer and Whittaker (2020). Progressive Disclosure: When, Why, and How Do Users Want Algorithmic Transparency Information? ACM TIIS 10(4), Article 29. doi:10.1145/3374218 | Staging information rather than presenting it all at once, and doing so on demand | REF (TIIS ref 74) |
| Szymanski et al. (2025). Designing and Personalising Hybrid Health Explanations for Lay Users. ACM TIIS | Names progressive disclosure as the remedy for the completeness versus conciseness trade-off they observed | PDF |

**Honest note.** Buçinca et al. also report that cognitive forcing functions are liked less than
simpler designs. Expect a cost in perceived ease, and measure it with mental demand.

## 2. The analysis screen between the profile and the recommendation

**Decision.** A short staged screen lists the four things the advisor does, then the result appears.

**Claim.** Pacing an instantaneous computation makes the process visible and sets the expectation
that a computation happened, rather than a lookup.

| Source | What it supports | Status |
| --- | --- | --- |
| Buell and Norton (2011). The Labor Illusion: How Operational Transparency Increases Perceived Value. Management Science 57(9), 1564-1579. doi:10.1287/mnsc.1110.1376 | Showing effort during a wait raises perceived value, and people can prefer a visible wait to an instant result | WEB |
| Buçinca, Malaya and Gajos (2021), as above | The slow-down intervention as a way to interrupt fast, uncritical acceptance | WEB |

**Honest note.** This cuts both ways. The labor illusion can inflate trust, which is the thing this
study measures. It is held constant across all conditions, so it does not confound the between-condition
comparison, but it must be reported as a factor affecting absolute trust levels.

## 3. The case stays on screen while the advice is judged

**Decision.** After the analysis screen the case text and its raw facts remain visible as chips.
Only facts already stated in the narrative are repeated. Derived suitability labels are never shown,
because those are explanation content and belong to the assigned condition.

**Claim.** Removing the need to hold the case in working memory isolates the explanation manipulation
from a memory manipulation.

| Source | What it supports | Status |
| --- | --- | --- |
| Springer and Whittaker (2020) | Information available on demand at the moment of the decision | REF |
| Nielsen (1997). Be succinct! Writing for the Web | Brevity and scannability of the repeated summary | REF (TIIS ref 54) |

## 4. Modality: visual, textual and hybrid

**Decision.** The Why content can be shown as bars (visual), as generated sentences (textual), or as
both (hybrid).

**Claim.** Modality is a factor in its own right, separate from what is explained, and combining
modalities can compensate for the weaknesses of each.

| Source | What it supports | Status |
| --- | --- | --- |
| Szymanski, Millecamp and Verbert (2021). Visual, Textual or Hybrid: The Effect of User Expertise on Different Explanations. IUI '21 | The original modality comparison, and expertise as a moderator | REF (TIIS ref 78) |
| Szymanski et al. (2025), ACM TIIS | Hybrid preferred over unimodal, significantly more useful, with need for cognition moderating | PDF |
| Hohman, Srinivasan and Drucker (2019). TeleGam: Combining Visualization and Verbalization for Interpretable Machine Learning. IEEE VIS | Combining visualisation with verbalisation, and user-controllable verbalisation detail | REF (TIIS ref 35) |
| Kouki, Schaffer, Pujara, O'Donovan and Getoor (2020). Generating and Understanding Personalized Explanations in Hybrid Recommender Systems. ACM TIIS 10(4) | Multiple explanation styles in one representation raise persuasiveness | REF (TIIS ref 42) |

## 5. Feature importance design and its known misreading

**Decision.** Contribution bars are labelled as contributions to this recommendation, with the input
value shown next to each label rather than as the bar's magnitude.

**Claim.** Lay users systematically misread feature importance bars as a summary of their inputs.

| Source | What it supports | Status |
| --- | --- | --- |
| Szymanski et al. (2025), ACM TIIS | 10 of 11 think-aloud participants misread the bars this way, which motivated their redesign | PDF |
| Bhattacharya, Stumpf, Gosak, Stiglic and Verbert (2024). EXMOS: Explanatory Model Steering Through Multifaceted Explanations and Data Configurations. CHI '24 | Presenting feature contributions to non-AI experts | REF (CUI ref 8) |

## 6. Counterfactual content

| Source | What it supports | Status |
| --- | --- | --- |
| Wachter, Mittelstadt and Russell (2018). Counterfactual Explanations without Opening the Black Box | The counterfactual explanation form itself | PDF (in PAPERS) |
| Szymanski et al. (2025), ACM TIIS | Lay user reception of explanation content that contradicts expectation | PDF |

## 7. Confidence content

| Source | What it supports | Status |
| --- | --- | --- |
| Zhang, Liao and Bellamy (2020). Effect of Confidence and Explanation on Accuracy and Trust Calibration in AI-Assisted Decision Making. FAT* '20. doi:10.1145/3351095.3372852 | Confidence scores can calibrate trust, and calibration alone does not improve joint outcomes. This is the reason the confidence condition exists and the reason its effect is not assumed positive | WEB |
| Guo, Pleiss, Sun and Weinberger (2017). On Calibration of Modern Neural Networks | Temperature scaling, which is why the displayed probabilities are calibrated rather than raw | PDF (in PAPERS) |

## 8. Interactive what-if

| Source | What it supports | Status |
| --- | --- | --- |
| Millecamp, Htun, Conati and Verbert (2020). What's in a User? Towards Personalising Transparency for Music Recommender Interfaces. UMAP '20 | Interactive control over explanation and its dependence on personal characteristics | WEB |
| Amershi, Cakmak, Knox and Kulesza (2014). Power to the People: The Role of Humans in Interactive Machine Learning | Interactive inspection of model behaviour by end users | PDF (in PAPERS) |
| Bhattacharya, Stumpf and Verbert (2025). Importance of User Control in Data-Centric Steering for Healthcare Experts. AIES '25 | User control as a design requirement rather than an extra | WEB |

## 9. Adaptive to literacy

| Source | What it supports | Status |
| --- | --- | --- |
| Millecamp, Htun, Conati and Verbert (2019). To Explain or Not to Explain: The Effects of Personal Characteristics When Explaining Music Recommendations. IUI '19 | Personal characteristics change whether an explanation helps at all | REF (TIIS ref 50) |
| Szymanski et al. (2025), ACM TIIS | Need for cognition moderates the benefit of richer explanations. Users with high need for cognition rated hybrid explanations lower | PDF |
| Lusardi and Mitchell, the Big Three financial literacy questions | The literacy instrument that drives the adaptation | Needs a direct citation, see gaps |

## 10. Conversational delivery, intent routing and grounding

**Decision.** Core questions are answered from the verified computation. Anything outside the supported
set goes to the language model with context. The model never originates a number.

| Source | What it supports | Status |
| --- | --- | --- |
| Samimi, Bhattacharya, Gosak, Stiglic and Verbert (2025). Visual-Conversational Interface for Evidence-Based Explanation of Diabetes Risk Prediction. CUI '25 | The hybrid prompt handling architecture, evidence grounding from a pre-verified knowledge base, and feature range analysis | PDF |
| Slack, Krishna, Lakkaraju and Singh (2023). Explaining machine learning models with interactive natural language conversations using TalkToModel. Nature Machine Intelligence | The parse-to-backend-operation approach the routing extends | REF (CUI refs) |
| Liao, Gruen and Miller (2020). Questioning the AI: Informing Design Practices for Explainable AI User Experiences. CHI '20 | The XAI question bank, which is where the supported intent set comes from rather than from our guesses | REF (CUI ref 32) |
| Zhang, De Croon, Szymanski and Verbert (2026). CAPTURE: A Visual-Conversational Dashboard for Supporting User-Driven Explanations in a Job-Candidate Matching Algorithm. UMAP '26 | Visual and conversational explanation combined, from the same group | WEB |
| Nourani et al. (2020). Don't explain without verifying veracity | Why a fluent but unfaithful explanation is a hazard | REF (TIIS ref 56) |

## 11. Actionable recommendations derived from counterfactuals

| Source | What it supports | Status |
| --- | --- | --- |
| Bhattacharya, Ooge, Stiglic and Verbert (2023). Directive Explanations for Monitoring the Risk of Diabetes Onset: Introducing Directive Data-Centric Explanations. IUI '23 | The exact concept: explanations that tell the user what to do, not only why | REF (CUI refs) |
| Samimi et al. (2025), CUI '25 | Filtering immutable features, feasibility badges, breaking large changes into achievable steps | PDF |
| Singh, Miller, Sonenberg, Velloso, Vetere, Howe and Dourish (2024). An Actionability Assessment Tool for Explainable AI | Measuring actionability rather than asserting it | REF (CUI ref 57) |

## 12. Progressive disclosure of detail

**Decision.** The outcome guide, the scorecard and the extra questions are collapsed by default.

| Source | What it supports | Status |
| --- | --- | --- |
| Springer and Whittaker (2020) | The core citation for disclosure on demand | REF |
| Szymanski et al. (2025), ACM TIIS | Recommends progressive disclosure and text chunking as the remedy for hybrid overload | PDF |

## 13. Sound versus flawed advice, and appropriate reliance

| Source | What it supports | Status |
| --- | --- | --- |
| Schemmer, Kühl, Benz, Bartos and Satzger (2023). Appropriate Reliance on AI Advice: Conceptualization and the Effect of Explanations. IUI '23. doi:10.1145/3581641.3584066 | The two-dimensional Appropriateness of Reliance measurement concept, which our primary outcome should be defined against | WEB |
| Buçinca, Malaya and Gajos (2021) | Overreliance as the failure mode, and that explanations alone do not fix it | WEB |
| Dietvorst, Simmons and Massey. Algorithm Aversion, and Overcoming Algorithm Aversion | The opposite failure, rejection of sound algorithmic advice | PDF (in PAPERS) |

## 14. Perception measures

| Source | What it supports | Status |
| --- | --- | --- |
| Hoffman, Mueller, Klein and Litman (2018). Metrics for Explainable AI: Challenges and Prospects | Explanation satisfaction, understandability and trust items | REF (CUI ref 22) |
| Tsai and Brusilovsky (2019). Evaluating Visual Explanations for Similarity-Based Recommendations. UMAP '19 | Perception measures for visual explanations | REF (TIIS ref 84) |
| Van Der Laan, Heino and De Waard (1997). A simple procedure for the assessment of acceptance of advanced transport telematics | The acceptance scale Szymanski adapted | REF (TIIS ref 85) |
| Wijekoon et al. (2024). XEQ Scale for Evaluating XAI Experience Quality | The scale for the conversational condition specifically | REF (CUI ref 67) |
| Balog and Radlinski (2020). Measuring Recommendation Explanation Quality. SIGIR '20 | Explanation quality has conflicting goals, so single-item quality measures mislead | REF (TIIS ref 6) |

## 15. Personal characteristics

| Source | What it supports | Status |
| --- | --- | --- |
| Lins de Holanda Coelho, Hanel and Wolf (2020). The Very Efficient Assessment of Need for Cognition: Developing a Six-Item Version. Assessment 27(8) | The exact NFC-6 instrument Szymanski used | REF (TIIS ref 21) |
| Kouki et al. (2020) | The ease-of-satisfaction items | REF (TIIS ref 42) |
| Millecamp et al. (2019, 2020) | Why personal characteristics belong in the model at all | REF, WEB |

## 16. Qualitative method

| Source | What it supports | Status |
| --- | --- | --- |
| Clarke and Braun (2017). Thematic analysis. Journal of Positive Psychology 12(3) | The analysis method | REF (CUI ref 12) |
| Fereday and Muir-Cochrane (2006). Demonstrating rigor using thematic analysis: a hybrid approach of inductive and deductive coding and theme development. IJQM 5(1) | The hybrid deductive and inductive coding procedure, with D, I and D-I tagging | REF (CUI refs) |

## 17. Deliberately unsupported, and gaps to close

These are decisions we have not yet grounded. Either find a source or mark them as design choices
in the paper.

- **The Big Three literacy questions.** Cite Lusardi and Mitchell directly. Not yet verified here.
- **The four-way decision (follow, adjust, reject, ask a human).** The deferral option needs a source,
  or it is our contribution and should be argued as such.
- **Escalation to human review as an outcome the model can produce.** We have found no prior study of
  how people react to an AI that declines to advise. If that holds after a proper search, it is the
  strongest novelty in the instrument.
- **The bilingual design.** No source yet for language as a moderator of algorithm aversion.
- **Asset class explanations in the outcome guide.** Currently plain financial description, no citation.
