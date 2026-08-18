/*
  AdviceIT by Radit, model.js
  ---------------------------------------------------------------
  The "advisor". A transparent rule-and-weights suitability model.

  This is deliberately NOT a machine-learning model. Every number that
  influences the recommendation lives in the CONFIG object below, so the
  explanations produced in explanations.js are faithful by construction:
  they read the same weights the model uses, rather than approximating a
  black box after the fact.

  Plain scripts (no ES modules) are used on purpose so that index.html can
  be opened directly from the file system as well as served from GitHub
  Pages. Everything is attached to one global namespace: window.AdviceIT.
*/

window.AdviceIT = window.AdviceIT || {};

(function (ns) {
  "use strict";

  /* ============================================================
     CONFIG: every rule and weight of the model, in one place.
     ============================================================

     Risk capacity score (0 to 100)
     ------------------------------
     score = BASELINE_SCORE
           + (BASELINE.age     - age)     * WEIGHTS.agePerYear
           + (horizon - BASELINE.horizon) * WEIGHTS.horizonPerYear
           + (emergencyFund ? 0 : WEIGHTS.noEmergencyFund)
           + (incomeStable  ? 0 : WEIGHTS.variableIncome)
     then clamped to [0, 100].

     Rules and why they are defensible
     ---------------------------------
     1. Age. Younger investors have more working years to recover from
        losses, so capacity falls as age rises. Weight: 0.6 points per
        year away from the baseline age of 45. Range 18 to 80 gives
        +16.2 to -21.0.
     2. Horizon. A longer investment horizon allows more time to ride out
        volatility. Weight: 1.2 points per year away from the baseline
        horizon of 10 years. Range 1 to 40 gives -10.8 to +36.0.
        Horizon is weighted more heavily than age because it is the more
        direct measure of time-to-liquidity in suitability practice.
     3. Emergency fund. Without a cash buffer covering at least 6 months
        of expenses, an investor may be forced to sell in a downturn.
        Fixed penalty of -15 points.
     4. Income stability. Variable income makes forced selling more
        likely and reduces the ability to add to investments in bad
        years. Fixed penalty of -10 points.
     5. Financial knowledge is recorded but carries a weight of zero.
        It is a moderator variable in the study, not a model input.

     Neutral baseline profile
     ------------------------
     Age 45, horizon 10 years, emergency fund present, stable income.
     This profile scores exactly BASELINE_SCORE = 50, the middle of the
     Balanced band. Feature contributions in the feature-based
     explanation are expressed relative to this profile, so the sum of
     all contributions plus 50 equals the (unclamped) score.

     From score to portfolio
     -----------------------
     The score is mapped to one of five bands (see PORTFOLIOS, min and
     max are inclusive integers, scores are compared as real numbers
     against band lower edges). Stated risk tolerance then shifts the
     band by at most one step: Low moves one step more conservative,
     High moves one step more aggressive, Medium leaves it unchanged.
     The shift is clamped to the first and last portfolio.

     Margin
     ------
     Distance in score points from the nearest band boundary of the
     capacity band (before the tolerance shift). Maximum possible margin
     is 10 (the centre of a 20-point band). It feeds the confidence
     display.

     Suitability labels and escalation (shared vocabulary with ILS-Bench)
     --------------------------------------------------------------------
     The neural-network advisor is trained on ILS-Bench (Bonelli 2026),
     whose cases are labelled with risk tolerance, risk capacity and
     liquidity need. deriveSuitabilityLabels() maps the profile form to
     that vocabulary with three documented rules:
       tolerance  Low / Medium / High -> Low / Moderate / High. "Inconsistent"
                  is set only when a free-text narrative shows conflicting
                  risk attitudes (detected by the language model).
       capacity   emergency fund AND stable income -> High,
                  exactly one of them -> Moderate, neither -> Low.
                  (ILS-Bench defines capacity as the ability to absorb
                  losses given income, savings, debt and obligations.)
       liquidity  horizon 1 to 2 years -> Urgent, 3 to 5 -> High,
                  6 to 10 -> Moderate, 11 or more -> Low.
     The glass box also has one escalation rule, mirroring what the
     ILS-Bench expert panel did: when capacity is Low and the money is
     needed soon (liquidity Urgent or High) or tolerance is High, or when
     tolerance is Inconsistent, the outcome is "Human review" instead of
     an automated portfolio. The score is still computed and shown.
  */
  var CONFIG = {
    BASELINE_SCORE: 50,
    BASELINE: {
      age: 45,
      horizon: 10,
      emergencyFund: true,
      incomeStable: true
    },
    WEIGHTS: {
      agePerYear: 0.6,        // points gained per year YOUNGER than 45
      horizonPerYear: 1.2,    // points gained per year LONGER than 10
      noEmergencyFund: -15,   // penalty when no 6-month buffer
      variableIncome: -10     // penalty when income is variable
    },
    LIMITS: {
      age: { min: 18, max: 80 },
      horizon: { min: 1, max: 40 },
      score: { min: 0, max: 100 }
    },
    // Score band edges. Band i covers [BAND_EDGES[i], BAND_EDGES[i+1]).
    // The last band also includes 100.
    BAND_EDGES: [0, 20, 40, 60, 80, 100],
    TOLERANCE_SHIFT: { low: -1, medium: 0, high: 1 },
    // Confidence label thresholds on the margin (points).
    CONFIDENCE: { high: 7, moderate: 3 },
    // Liquidity-need bands on the horizon in years (upper bounds, inclusive).
    LIQUIDITY_BANDS: { urgentMax: 2, highMax: 5, moderateMax: 10 }
  };

  /* Five model portfolios, named as in ILS-Bench so both advisors share
     one vocabulary. Allocations are stylised and sum to 100. */
  var PORTFOLIOS = [
    {
      id: "capital-preservation",
      name: "Capital preservation",
      allocation: { equities: 15, bonds: 50, cash: 30, realAssets: 5 },
      summary: "Capital preservation first: mostly bonds and cash, a small equity sleeve."
    },
    {
      id: "conservative",
      name: "Conservative",
      allocation: { equities: 30, bonds: 50, cash: 15, realAssets: 5 },
      summary: "Modest growth with limited swings: bonds lead, equities support."
    },
    {
      id: "balanced",
      name: "Balanced",
      allocation: { equities: 50, bonds: 35, cash: 5, realAssets: 10 },
      summary: "An even mix of growth and stability, the classic middle road."
    },
    {
      id: "growth",
      name: "Growth",
      allocation: { equities: 70, bonds: 20, cash: 0, realAssets: 10 },
      summary: "Growth oriented: equities dominate, bonds cushion the ride."
    },
    {
      id: "aggressive-growth",
      name: "Aggressive growth",
      allocation: { equities: 85, bonds: 5, cash: 0, realAssets: 10 },
      summary: "Maximum long-term growth, accepting large short-term swings."
    }
  ];

  /* Sixth outcome: no automated portfolio, refer to a human adviser. */
  var HUMAN_REVIEW = {
    id: "human-review",
    name: "Human review",
    allocation: null,
    summary: "No automated portfolio. This situation should be reviewed by a human adviser before any advice is given."
  };
  var OUTCOMES = PORTFOLIOS.concat([HUMAN_REVIEW]);
  var HUMAN_REVIEW_INDEX = PORTFOLIOS.length;

  var ASSET_CLASSES = [
    { key: "equities", label: "Global equities" },
    { key: "bonds", label: "Bonds" },
    { key: "cash", label: "Cash and money market" },
    { key: "realAssets", label: "Real assets" }
  ];

  /* ------------------------------------------------------------
     Helpers
     ------------------------------------------------------------ */
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  /* Normalise a raw profile object coming from the form. */
  function normalizeProfile(raw) {
    return {
      age: clamp(Math.round(Number(raw.age)), CONFIG.LIMITS.age.min, CONFIG.LIMITS.age.max),
      horizon: clamp(Math.round(Number(raw.horizon)), CONFIG.LIMITS.horizon.min, CONFIG.LIMITS.horizon.max),
      tolerance: raw.tolerance === "low" || raw.tolerance === "high" ? raw.tolerance : "medium",
      emergencyFund: Boolean(raw.emergencyFund),
      incomeStable: Boolean(raw.incomeStable),
      toleranceInconsistent: Boolean(raw.toleranceInconsistent), // set only by narrative reading
      knowledge: raw.knowledge || "intermediate" // recorded only, weight zero
    };
  }

  /* ------------------------------------------------------------
     Suitability labels in the ILS-Bench vocabulary (see comment block).
     Used by the neural network as its inputs and by the glass box for
     its escalation rule.
     ------------------------------------------------------------ */
  var TOLERANCE_LABEL = { low: "Low", medium: "Moderate", high: "High" };

  function deriveSuitabilityLabels(profile) {
    var tolerance = profile.toleranceInconsistent ? "Inconsistent" : TOLERANCE_LABEL[profile.tolerance];
    var buffers = (profile.emergencyFund ? 1 : 0) + (profile.incomeStable ? 1 : 0);
    var capacity = buffers === 2 ? "High" : buffers === 1 ? "Moderate" : "Low";
    var lb = CONFIG.LIQUIDITY_BANDS;
    var liquidity = profile.horizon <= lb.urgentMax ? "Urgent"
      : profile.horizon <= lb.highMax ? "High"
      : profile.horizon <= lb.moderateMax ? "Moderate" : "Low";
    return {
      tolerance: tolerance,
      capacity: capacity,
      liquidity: liquidity,
      capacityReason: buffers === 2 ? "emergency fund and stable income" : buffers === 1
        ? (profile.emergencyFund ? "emergency fund but variable income" : "stable income but no emergency fund")
        : "no emergency fund and variable income",
      liquidityReason: profile.horizon + (profile.horizon === 1 ? " year" : " years") + " horizon"
    };
  }

  /* Escalation rule of the glass box. Returns a reason string or null. */
  function escalationReason(labels) {
    if (labels.tolerance === "Inconsistent") {
      return "Your description shows conflicting risk attitudes (Inconsistent risk tolerance).";
    }
    if (labels.capacity === "Low" && (labels.liquidity === "Urgent" || labels.liquidity === "High")) {
      return "Low risk capacity (" + labels.capacityReason + ") combined with money needed soon (" + labels.liquidityReason + ").";
    }
    if (labels.capacity === "Low" && labels.tolerance === "High") {
      return "Low risk capacity (" + labels.capacityReason + ") combined with a High stated risk tolerance.";
    }
    return null;
  }

  /* ------------------------------------------------------------
     Step 1: feature contributions relative to the neutral baseline.
     Each contribution is the number of score points a feature adds
     (positive) or removes (negative) compared with the baseline
     profile. Summing them and adding BASELINE_SCORE gives the raw
     (unclamped) score.
     ------------------------------------------------------------ */
  function computeContributions(profile) {
    var w = CONFIG.WEIGHTS;
    var b = CONFIG.BASELINE;
    return [
      {
        key: "age",
        label: "Age",
        valueText: profile.age + " years old",
        points: (b.age - profile.age) * w.agePerYear
      },
      {
        key: "horizon",
        label: "Investment horizon",
        valueText: profile.horizon + (profile.horizon === 1 ? " year" : " years"),
        points: (profile.horizon - b.horizon) * w.horizonPerYear
      },
      {
        key: "emergencyFund",
        label: "Emergency fund",
        valueText: profile.emergencyFund ? "6 months covered" : "no 6-month buffer",
        points: profile.emergencyFund ? 0 : w.noEmergencyFund
      },
      {
        key: "incomeStable",
        label: "Income stability",
        valueText: profile.incomeStable ? "stable income" : "variable income",
        points: profile.incomeStable ? 0 : w.variableIncome
      }
    ];
  }

  /* ------------------------------------------------------------
     Step 2: score, band, tolerance shift, margin.
     ------------------------------------------------------------ */
  function bandIndexForScore(score) {
    var edges = CONFIG.BAND_EDGES;
    for (var i = edges.length - 2; i >= 0; i--) {
      if (score >= edges[i]) return i;
    }
    return 0;
  }

  /* Distance from the score to the nearest edge of its own band. */
  function marginForScore(score, bandIndex) {
    var edges = CONFIG.BAND_EDGES;
    var lower = edges[bandIndex];
    var upper = edges[bandIndex + 1];
    var toLower = score - lower;
    var toUpper = upper - score;
    // The lowest band has no boundary below 0 and the highest none above 100,
    // so only the inner edge counts there.
    if (bandIndex === 0) return toUpper;
    if (bandIndex === edges.length - 2) return toLower;
    return Math.min(toLower, toUpper);
  }

  /* Which neighbouring band is closest (used by the confidence display). */
  function nearestNeighbourBand(score, bandIndex) {
    var edges = CONFIG.BAND_EDGES;
    var toLower = score - edges[bandIndex];
    var toUpper = edges[bandIndex + 1] - score;
    if (bandIndex === 0) return 1;
    if (bandIndex === edges.length - 2) return bandIndex - 1;
    return toLower <= toUpper ? bandIndex - 1 : bandIndex + 1;
  }

  function applyToleranceShift(bandIndex, tolerance) {
    var shift = CONFIG.TOLERANCE_SHIFT[tolerance] || 0;
    return clamp(bandIndex + shift, 0, PORTFOLIOS.length - 1);
  }

  function confidenceLabel(margin) {
    if (margin >= CONFIG.CONFIDENCE.high) return "high";
    if (margin >= CONFIG.CONFIDENCE.moderate) return "moderate";
    return "low";
  }

  /* ------------------------------------------------------------
     recommend(profile) is the single entry point. It is pure and
     deterministic: the same profile always yields the same result.
     ------------------------------------------------------------ */
  function recommend(rawProfile) {
    var profile = normalizeProfile(rawProfile);
    var contributions = computeContributions(profile);

    var rawScore = CONFIG.BASELINE_SCORE;
    for (var i = 0; i < contributions.length; i++) rawScore += contributions[i].points;
    var score = clamp(rawScore, CONFIG.LIMITS.score.min, CONFIG.LIMITS.score.max);

    var capacityBand = bandIndexForScore(score);
    var finalBand = applyToleranceShift(capacityBand, profile.tolerance);
    var margin = marginForScore(score, capacityBand);
    var neighbourCapacityBand = nearestNeighbourBand(score, capacityBand);
    // The neighbour the user would actually see also carries the tolerance shift.
    var neighbourFinalBand = applyToleranceShift(neighbourCapacityBand, profile.tolerance);

    var labels = deriveSuitabilityLabels(profile);
    var escalation = escalationReason(labels);
    var outcomeIndex = escalation ? HUMAN_REVIEW_INDEX : finalBand;

    return {
      advisor: "glass",
      profile: profile,
      labels: labels,
      contributions: contributions,
      targetLabel: "risk capacity",       // what the contributions add up to
      targetUnit: "points",
      baselineScore: CONFIG.BASELINE_SCORE,
      rawScore: round1(rawScore),
      score: round1(score),
      clamped: rawScore !== score,
      capacityBand: capacityBand,
      toleranceShift: finalBand - capacityBand,
      scorePortfolio: PORTFOLIOS[finalBand],   // what the score alone points to
      escalated: Boolean(escalation),
      escalationReason: escalation,
      portfolioIndex: outcomeIndex,
      portfolio: OUTCOMES[outcomeIndex],
      margin: round1(margin),
      confidence: confidenceLabel(margin),
      neighbourPortfolio: neighbourFinalBand === finalBand ? null : PORTFOLIOS[neighbourFinalBand],
      contribIntro: "Starting from a neutral baseline score of " + CONFIG.BASELINE_SCORE + ", each of your inputs moved the risk capacity score as follows (largest effect first):",
      contribTotal: "Baseline " + CONFIG.BASELINE_SCORE + " plus contributions = risk capacity score " + round1(score) + " out of 100."
    };
  }

  /* ------------------------------------------------------------
     Flawed advice scenario (for measuring appropriate reliance).
     Shifts the shown portfolio two steps in the WRONG direction:
     conservative-leaning profiles are pushed toward Aggressive,
     growth-leaning profiles toward Capital preservation. The sound
     recommendation is kept alongside so the log can record both.
     ------------------------------------------------------------ */
  function applyFlawedScenario(result) {
    var idx = result.portfolioIndex;
    var wrongIdx;
    if (idx === HUMAN_REVIEW_INDEX) {
      // The sound answer is "see a human". The flawed advice hands out an
      // automated portfolio anyway, two steps more aggressive than the score.
      var base = result.scorePortfolio ? PORTFOLIOS.indexOf(result.scorePortfolio) : 2;
      wrongIdx = clamp(base + 2, 0, PORTFOLIOS.length - 1);
    } else {
      wrongIdx = idx <= 2 ? idx + 2 : idx - 2;
      wrongIdx = clamp(wrongIdx, 0, PORTFOLIOS.length - 1);
    }
    var flawed = Object.assign({}, result);
    flawed.soundPortfolio = result.portfolio;
    flawed.soundPortfolioIndex = result.portfolioIndex;
    flawed.portfolio = PORTFOLIOS[wrongIdx];
    flawed.portfolioIndex = wrongIdx;
    flawed.flawed = true;
    return flawed;
  }

  /* Example profiles for live demonstration. With the glass box they give
     Aggressive growth, Balanced, Capital preservation and Human review. */
  var EXAMPLE_PROFILES = [
    {
      id: "young",
      label: "Young long-horizon investor",
      profile: { age: 26, horizon: 30, tolerance: "high", emergencyFund: true, incomeStable: true, knowledge: "beginner" }
    },
    {
      id: "midcareer",
      label: "Mid-career, no safety net",
      profile: { age: 40, horizon: 15, tolerance: "medium", emergencyFund: false, incomeStable: true, knowledge: "intermediate" }
    },
    {
      id: "retirement",
      label: "Near-retirement investor",
      profile: { age: 63, horizon: 6, tolerance: "low", emergencyFund: true, incomeStable: true, knowledge: "advanced" }
    },
    {
      id: "escalation",
      label: "Short horizon, no buffer",
      profile: { age: 34, horizon: 2, tolerance: "high", emergencyFund: false, incomeStable: false, knowledge: "beginner" }
    }
  ];

  ns.model = {
    CONFIG: CONFIG,
    PORTFOLIOS: PORTFOLIOS,
    HUMAN_REVIEW: HUMAN_REVIEW,
    OUTCOMES: OUTCOMES,
    HUMAN_REVIEW_INDEX: HUMAN_REVIEW_INDEX,
    deriveSuitabilityLabels: deriveSuitabilityLabels,
    escalationReason: escalationReason,
    ASSET_CLASSES: ASSET_CLASSES,
    EXAMPLE_PROFILES: EXAMPLE_PROFILES,
    normalizeProfile: normalizeProfile,
    computeContributions: computeContributions,
    recommend: recommend,
    applyFlawedScenario: applyFlawedScenario,
    confidenceLabel: confidenceLabel,
    round1: round1
  };
})(window.AdviceIT);
