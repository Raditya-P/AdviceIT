/*
  AdviceIT by Radit, explanations.js
  ---------------------------------------------------------------
  Builds the content of the three explanation conditions from a model
  result. Nothing here is hard-coded text about a specific profile:
  every sentence is derived from the numbers the model actually used.

    - featureExplanation:      signed contributions relative to baseline
    - counterfactualExplanation: smallest single-input change that flips
                                 the portfolio, found by re-running the model
    - confidenceExplanation:   label and sentence derived from the margin
*/

window.AdviceIT = window.AdviceIT || {};

(function (ns) {
  "use strict";

  var model = ns.model;

  /* The advisor that produced a result. Falls back to the glass box. */
  function advisorFor(result) {
    var id = result.advisor || "glass";
    return (ns.advisors && ns.advisors[id]) || { recommend: model.recommend };
  }

  function fmtPoints(points) {
    var v = model.round1(Math.abs(points));
    return v + (v === 1 ? " point" : " points");
  }

  /* ------------------------------------------------------------
     1. Feature-based explanation
     Returns items sorted by absolute contribution, each with a
     ready-made sentence, plus a total that reconciles to the score.
     ------------------------------------------------------------ */
  function featureExplanation(result) {
    var scoreWord = result.targetLabel || "risk capacity";
    var items = result.contributions.map(function (c) {
      var direction = c.points > 0 ? "increased" : c.points < 0 ? "reduced" : "did not change";
      var sentence;
      if (c.points === 0) {
        sentence = c.label + " (" + c.valueText + ") did not change " + scoreWord + " relative to the baseline.";
      } else {
        sentence = c.label + " (" + c.valueText + ") " + direction + " risk capacity by " + fmtPoints(c.points) + ".";
      }
      return {
        key: c.key,
        label: c.label,
        valueText: c.valueText,
        points: model.round1(c.points),
        sentence: sentence
      };
    });
    items.sort(function (a, b) { return Math.abs(b.points) - Math.abs(a.points); });

    var maxAbs = items.reduce(function (m, it) { return Math.max(m, Math.abs(it.points)); }, 0);

    var toleranceNote = "";
    if (result.advisor === "ml" || result.advisor === "logit") {
      toleranceNote = "Risk tolerance is an input to this model, so it appears above as its own contribution.";
    } else if (result.escalated) {
      toleranceNote = "The score points to " + result.scorePortfolio.name + ", but the escalation rule overrode it: " + result.escalationReason;
    } else if (result.toleranceShift > 0) {
      toleranceNote = "Your stated High risk tolerance moved the final choice one step more aggressive.";
    } else if (result.toleranceShift < 0) {
      toleranceNote = "Your stated Low risk tolerance moved the final choice one step more conservative.";
    } else if (result.profile.tolerance === "medium") {
      toleranceNote = "Your stated Medium risk tolerance left the capacity-based choice unchanged.";
    } else {
      toleranceNote = "Your stated risk tolerance could not move the choice further because it is already at the end of the range.";
    }

    var clampNote = result.clamped
      ? "The raw total (" + result.rawScore + ") was outside 0 to 100 and was clamped to " + result.score + "."
      : "";

    var methodNote;
    if (result.advisor === "ml") {
      methodNote = "These are Shapley values of " + result.targetLabel + ": the average effect of each input across all orders of adding inputs, computed post hoc by re-running the network 32 times against the baseline profile. They describe the network's behaviour, not readable rules.";
    } else if (result.advisor === "logit") {
      methodNote = "These contributions are read directly from the coefficients of the logistic regression: coefficient of the recommended outcome times the input, minus the same for the baseline profile. They are exact, not estimated, and they add up to the change in evidence.";
    } else {
      methodNote = "These contributions are read directly from the model's weights. They are exact, not estimated.";
    }

    return {
      baselineScore: result.baselineScore !== undefined ? result.baselineScore : model.CONFIG.BASELINE_SCORE,
      targetLabel: scoreWord,
      targetUnit: result.targetUnit || "points",
      methodNote: methodNote,
      items: items,
      maxAbs: maxAbs,
      score: result.score,
      rawScore: result.rawScore,
      toleranceNote: toleranceNote,
      clampNote: clampNote
    };
  }

  /* ------------------------------------------------------------
     2. Counterfactual explanation
     For each input, search its plausible range for the smallest change
     that yields a different portfolio, by literally calling
     model.recommend on the modified profile. Numeric inputs are scanned
     outward from the current value one unit at a time. Categorical
     inputs are flipped. If nothing flips the portfolio, say so.
     ------------------------------------------------------------ */
  function counterfactualExplanation(result) {
    var p = result.profile;
    var current = result.portfolio.name;
    var findings = [];
    var advisor = advisorFor(result);

    function withChange(key, value) {
      var copy = Object.assign({}, p);
      copy[key] = value;
      return advisor.recommend(copy);
    }

    // Numeric inputs: age and horizon.
    var numeric = [
      { key: "age", label: "age", unit: "years old", limits: model.CONFIG.LIMITS.age },
      { key: "horizon", label: "horizon", unit: "years", limits: model.CONFIG.LIMITS.horizon }
    ];
    numeric.forEach(function (n) {
      var range = n.limits.max - n.limits.min;
      var best = null;
      for (var delta = 1; delta <= range; delta++) {
        var candidates = [p[n.key] + delta, p[n.key] - delta];
        for (var i = 0; i < candidates.length; i++) {
          var v = candidates[i];
          if (v < n.limits.min || v > n.limits.max) continue;
          var r = withChange(n.key, v);
          if (r.portfolio.name !== current) {
            best = { value: v, delta: delta, portfolio: r.portfolio.name };
            break;
          }
        }
        if (best) break;
      }
      if (best) {
        findings.push({
          key: n.key,
          relativeSize: best.delta / range,
          change: { input: n.label, from: String(p[n.key]), to: best.value + " " + n.unit, outcome: best.portfolio },
          sentence: "If your " + n.label + " were " + best.value + " " + n.unit + " instead of " + p[n.key] + ", the advice would change to " + best.portfolio + "."
        });
      }
    });

    // Categorical inputs.
    var tolOrder = ["low", "medium", "high"];
    var tolLabel = { low: "Low", medium: "Medium", high: "High" };
    tolOrder.forEach(function (t) {
      if (t === p.tolerance) return;
      var r = withChange("tolerance", t);
      if (r.portfolio.name !== current) {
        var steps = Math.abs(tolOrder.indexOf(t) - tolOrder.indexOf(p.tolerance));
        findings.push({
          key: "tolerance:" + t,
          relativeSize: 0.5 * steps,
          change: { input: "risk tolerance", from: tolLabel[p.tolerance], to: tolLabel[t], outcome: r.portfolio.name },
          sentence: "If your risk tolerance were " + tolLabel[t] + " instead of " + tolLabel[p.tolerance] + ", the advice would change to " + r.portfolio.name + "."
        });
      }
    });

    var rFund = withChange("emergencyFund", !p.emergencyFund);
    if (rFund.portfolio.name !== current) {
      findings.push({
        key: "emergencyFund",
        relativeSize: 0.5,
        change: { input: "emergency fund", from: p.emergencyFund ? "yes" : "no", to: p.emergencyFund ? "no" : "yes", outcome: rFund.portfolio.name },
        sentence: p.emergencyFund
          ? "If you did not have a 6-month emergency fund, the advice would change to " + rFund.portfolio.name + "."
          : "If you had a 6-month emergency fund, the advice would change to " + rFund.portfolio.name + "."
      });
    }

    var rIncome = withChange("incomeStable", !p.incomeStable);
    if (rIncome.portfolio.name !== current) {
      findings.push({
        key: "incomeStable",
        relativeSize: 0.5,
        change: { input: "income", from: p.incomeStable ? "stable" : "variable", to: p.incomeStable ? "variable" : "stable", outcome: rIncome.portfolio.name },
        sentence: p.incomeStable
          ? "If your income were variable instead of stable, the advice would change to " + rIncome.portfolio.name + "."
          : "If your income were stable instead of variable, the advice would change to " + rIncome.portfolio.name + "."
      });
    }

    // Smallest changes first. Keep at most three sentences.
    findings.sort(function (a, b) { return a.relativeSize - b.relativeSize; });
    var shown = findings.slice(0, 3);

    var intro;
    if (shown.length === 0) {
      intro = "No single change to one input would alter this recommendation. It would take changes to more than one input to move away from " + current + ".";
    } else {
      intro = "The recommendation is " + current + ". The smallest single changes that would alter it:";
    }

    return {
      intro: intro,
      sentences: shown.map(function (f) { return f.sentence; }),
      changes: shown.map(function (f) { return f.change; }),
      totalFound: findings.length
    };
  }

  /* ------------------------------------------------------------
     Contrastive explanation: "why not X?" for a specific other outcome.
     Searches every single-input change for the smallest one that yields
     exactly X. If none exists, tries pairs of categorical flips and
     reports honestly when X is out of reach with small changes.
     ------------------------------------------------------------ */
  function contrastiveExplanation(result, targetName) {
    var p = result.profile;
    var advisor = advisorFor(result);
    var current = result.portfolio.name;
    if (targetName === current) {
      return { target: targetName, sentence: current + " is already the recommendation.", found: true };
    }
    function withChanges(changes) {
      var copy = Object.assign({}, p);
      changes.forEach(function (c) { copy[c.key] = c.value; });
      return advisor.recommend(copy);
    }
    var candidates = [];
    var numeric = [
      { key: "age", label: "age", unit: "years old", limits: model.CONFIG.LIMITS.age },
      { key: "horizon", label: "horizon", unit: "years", limits: model.CONFIG.LIMITS.horizon }
    ];
    numeric.forEach(function (n) {
      var range = n.limits.max - n.limits.min;
      for (var delta = 1; delta <= range; delta++) {
        var vals = [p[n.key] + delta, p[n.key] - delta];
        for (var i = 0; i < vals.length; i++) {
          var v = vals[i];
          if (v < n.limits.min || v > n.limits.max) continue;
          if (withChanges([{ key: n.key, value: v }]).portfolio.name === targetName) {
            candidates.push({ size: delta / range, text: "your " + n.label + " were " + v + " " + n.unit + " instead of " + p[n.key] });
            delta = range + 1;
            break;
          }
        }
      }
    });
    var tolLabel = { low: "Low", medium: "Medium", high: "High" };
    var flips = [];
    ["low", "medium", "high"].forEach(function (t) {
      if (t !== p.tolerance) flips.push({ key: "tolerance", value: t, text: "your risk tolerance were " + tolLabel[t] + " instead of " + tolLabel[p.tolerance] });
    });
    flips.push({ key: "emergencyFund", value: !p.emergencyFund, text: p.emergencyFund ? "you had no 6-month emergency fund" : "you had a 6-month emergency fund" });
    flips.push({ key: "incomeStable", value: !p.incomeStable, text: p.incomeStable ? "your income were variable" : "your income were stable" });
    flips.forEach(function (f) {
      if (withChanges([f]).portfolio.name === targetName) candidates.push({ size: 0.5, text: f.text });
    });
    candidates.sort(function (a, b) { return a.size - b.size; });
    if (candidates.length) {
      return { target: targetName, found: true, sentence: "The advice would be " + targetName + " if " + candidates[0].text + "." + (candidates.length > 1 ? " Also if " + candidates[1].text + "." : "") };
    }
    // Pairs of categorical flips.
    for (var a = 0; a < flips.length; a++) {
      for (var b = a + 1; b < flips.length; b++) {
        if (flips[a].key === flips[b].key) continue;
        if (withChanges([flips[a], flips[b]]).portfolio.name === targetName) {
          return { target: targetName, found: true, sentence: "No single change would give " + targetName + ". It would take two changes, for example if " + flips[a].text + " and " + flips[b].text + "." };
        }
      }
    }
    return { target: targetName, found: false, sentence: "No single change, and no pair of changes to tolerance, emergency fund or income, would give " + targetName + " for a profile like yours. The inputs that keep you away from it are the ones with the largest contributions above." };
  }

  /* ------------------------------------------------------------
     3. Confidence display
     Derived from the margin: distance from the score to the nearest
     band boundary (0 to 10 points).
     ------------------------------------------------------------ */
  function confidenceExplanation(result) {
    if (result.probabilities) return mlConfidenceExplanation(result);
    var margin = result.margin;
    var label = result.confidence;
    var maxMargin = 10;
    var percent = Math.round(Math.min(1, margin / maxMargin) * 100);
    var neighbour = result.neighbourPortfolio ? result.neighbourPortfolio.name : null;

    if (result.escalated) {
      return {
        label: "high",
        labelText: "Rule-based outcome",
        margin: margin,
        percent: 100,
        sentence: "Human review comes from a fixed escalation rule, not from the score, so it does not depend on small changes in the score. " + result.escalationReason + " The score itself is " + result.score + " out of 100 and would point to " + result.scorePortfolio.name + ".",
        detail: "Escalation rule triggered. Score " + result.score + " out of 100."
      };
    }

    var sentence;
    if (label === "low") {
      sentence = neighbour
        ? "This recommendation is close to the boundary with " + neighbour + ". Small changes in your profile could shift it."
        : "This recommendation sits close to a band boundary. Small changes in your profile could shift it.";
    } else if (label === "moderate") {
      sentence = neighbour
        ? "This recommendation sits at a moderate distance from the boundary with " + neighbour + ". Moderate changes in your profile could shift it."
        : "This recommendation sits at a moderate distance from the nearest band boundary.";
    } else {
      sentence = neighbour
        ? "This recommendation sits well inside its band. It would take a substantial change in your profile to move it toward " + neighbour + "."
        : "This recommendation sits well inside its band. It would take a substantial change in your profile to move it.";
    }

    return {
      label: label,
      labelText: label.charAt(0).toUpperCase() + label.slice(1) + " confidence",
      margin: margin,
      percent: percent,
      sentence: sentence,
      detail: "Score " + result.score + " out of 100, " + margin + " points from the nearest boundary."
    };
  }

  /* Neural network: confidence is the calibrated probability of the
     recommended portfolio. The bar shows that probability directly. */
  function mlConfidenceExplanation(result) {
    var who = result.advisor === "logit" ? "The model" : "The network";
    var label = result.confidence;
    var pTop = Math.round(result.topProbability * 100);
    var neighbour = result.neighbourPortfolio ? result.neighbourPortfolio.name : null;
    var pSecond = neighbour ? Math.round((result.topProbability - result.margin / 100) * 100) : null;
    var sentence;
    if (label === "low") {
      sentence = who + " gives " + result.portfolio.name + " only " + pTop + " percent probability" + (neighbour ? ", with " + neighbour + " close behind at " + pSecond + " percent" : "") + ". Small changes in your profile could shift it.";
    } else if (label === "moderate") {
      sentence = who + " gives " + result.portfolio.name + " " + pTop + " percent probability" + (neighbour ? ", against " + pSecond + " percent for " + neighbour : "") + ". Moderate changes in your profile could shift it.";
    } else {
      sentence = who + " gives " + result.portfolio.name + " " + pTop + " percent probability" + (neighbour ? ", well ahead of " + neighbour + " at " + pSecond + " percent" : "") + ". It would take a substantial change in your profile to move it.";
    }
    return {
      label: label,
      labelText: label.charAt(0).toUpperCase() + label.slice(1) + " confidence",
      margin: result.margin,
      percent: pTop,
      sentence: sentence,
      detail: pTop + " percent calibrated probability, " + result.margin + " points ahead of the next portfolio.",
      probabilities: result.probabilities
    };
  }

  ns.explanations = {
    contrastiveExplanation: contrastiveExplanation,
    featureExplanation: featureExplanation,
    counterfactualExplanation: counterfactualExplanation,
    confidenceExplanation: confidenceExplanation
  };
})(window.AdviceIT);
