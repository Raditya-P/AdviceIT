/*
  AdviceIT by Radit, app.js
  ---------------------------------------------------------------
  Wires the page together: reads the profile form, calls the model,
  renders the recommendation and the active explanation condition,
  records responses into the session log, and handles researcher
  versus participant mode.

  URL parameters (participant links):
    ?mode=participant        hide researcher controls, walk through steps
    &pid=P07                 participant ID (random short ID if absent)
    &cond=<preset>           none | feature | counterfactual | confidence |
                             hybrid | interactive | adaptive | llm  (random
                             among all but llm if absent)
    &content=a,b             custom content: any of feature, counterfactual,
                             confidence (overrides the preset's content)
    &form=static|interactive|adaptive|llm   custom delivery
    &scenario=sound|flawed   (sound if absent)
    ?ils=ILS-014             (researcher mode) load that ILS-Bench case into the
                             narrative box, used by the Training data page
    ?panel=study-design|how-it-works   open that dialog on load, used by the
                             Training data page's navigation

  Pages: index.html runs the neural-network (AI) advisor and
  interpretable.html the interpretable rule-based advisor, a logistic
  regression fitted on the same data (id "logit"). The derived page is
  generated from index.html by tools/make_pages.py. model.js still holds an
  illustrative hand-set scorecard (id "glass") that is not shown in the app. The page declares its advisor with
  <body data-advisor="ml|glass">. A legacy &model= parameter that names
  the other advisor redirects to the right page with the same parameters.
*/

(function (ns) {
  "use strict";

  var model = ns.model;
  var explanations = ns.explanations;
  var session = ns.session;
  var advisors = ns.advisors;
  var llm = ns.llm;
  var study = ns.study;

  /* An explanation condition is a combination of CONTENT (what is
     explained) and FORM (how it is delivered). Presets name the common
     combinations. Anything else is "custom". */
  var CONTENT_PARTS = ["feature", "counterfactual", "confidence"];
  var FORMS = ["static", "interactive", "adaptive", "llm"];
  var PRESETS = {
    none: { content: [], form: "static" },
    feature: { content: ["feature"], form: "static" },
    counterfactual: { content: ["counterfactual"], form: "static" },
    confidence: { content: ["confidence"], form: "static" },
    hybrid: { content: ["feature", "counterfactual", "confidence"], form: "static" },
    interactive: { content: [], form: "interactive" },
    adaptive: { content: ["feature", "counterfactual", "confidence"], form: "adaptive" },
    llm: { content: ["feature", "counterfactual", "confidence"], form: "llm" }
  };
  var CONDITIONS = Object.keys(PRESETS);
  var RANDOMISABLE_CONDITIONS = ["none", "feature", "counterfactual", "confidence", "hybrid", "interactive", "adaptive"];
  var CONDITION_LABELS = {
    none: "No explanation",
    feature: "Why (feature-based)",
    counterfactual: "What would change it (counterfactual)",
    confidence: "How sure (confidence)",
    hybrid: "All three (hybrid)",
    interactive: "Interactive what-if",
    adaptive: "Adaptive to literacy",
    llm: "Conversational (LLM)",
    custom: "Custom"
  };

  function presetFor(content, form) {
    var key = content.slice().sort().join("+") + "|" + form;
    for (var name in PRESETS) {
      if (PRESETS[name].content.slice().sort().join("+") + "|" + PRESETS[name].form === key) return name;
    }
    return "custom";
  }

  /* ------------------------------------------------------------
     State
     ------------------------------------------------------------ */
  var state = {
    mode: "researcher",          // "researcher" or "participant"
    participantId: "researcher",
    condition: "none",           // preset name, or "custom"
    content: [],                 // explanation content parts shown
    form: "static",              // delivery form
    advisor: document.body.getAttribute("data-advisor") === "logit" ? "logit" : "ml", // set by the page
    scenario: "sound",
    llmModelId: llm.MODELS[0].id,
    llmMessages: [],             // chat history for the current recommendation
    llmExplanation: "",          // first generated explanation, stored in the log
    llmTurns: 0,                 // follow-up questions asked
    whatIfMoves: 0,              // interactions in the what-if panel for the current recommendation
    whyNotAsked: 0,              // contrastive questions asked
    adaptiveVariant: "",         // "plain" or "detailed", set by the adaptive condition
    flow: "single",              // "single" (one trial) or "study" (consent, literacy, trials, debrief)
    trialsTotal: 6,
    plan: null,                  // trial plan in study flow
    trial: null,                 // current trial of the plan
    stage: "",                   // current study stage
    toleranceInconsistent: false, // set when the LLM reads conflicting attitudes from a narrative
    ilsCaseId: "",               // ILS-Bench case loaded into the narrative box, if any
    narrativeUsed: false,        // the current form values came from a narrative
    result: null,                // current model result (possibly flawed)
    displayedAt: null,           // timestamp when the current recommendation was shown
    recommendationVisible: true  // participant mode reveals it on request
  };

  /* ------------------------------------------------------------
     DOM helpers
     ------------------------------------------------------------ */
  function $(id) { return document.getElementById(id); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else if (c) node.appendChild(c);
    });
    return node;
  }

  function clearChildren(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function radioValue(name) {
    var checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : null;
  }

  function setRadio(name, value) {
    var input = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (input) input.checked = true;
  }

  function signed(points) {
    var v = model.round1(points);
    if (v > 0) return "+" + v;
    if (v < 0) return String(v);
    return "0";
  }

  /* ------------------------------------------------------------
     URL parameters and mode
     ------------------------------------------------------------ */

  /* Pure helper: if the query names the other advisor with &model=, return
     the URL of the right page with the remaining parameters, else null. */
  function legacyRedirectTarget(search, pageAdvisor) {
    var params = new URLSearchParams(search);
    var wanted = params.get("model");
    var pages = { glass: "interpretable.html", ml: "index.html", logit: "interpretable.html" };
    if (pages[wanted] && wanted !== pageAdvisor) {
      params.delete("model");
      var query = params.toString();
      return pages[wanted] + (query ? "?" + query : "");
    }
    return null;
  }

  function readParams() {
    var params = new URLSearchParams(window.location.search);
    var mode = params.get("mode") === "participant" ? "participant" : "researcher";
    var cond = params.get("cond");
    var scenario = params.get("scenario") === "flawed" ? "flawed" : "sound";
    var pid = params.get("pid");
    state.flow = params.get("flow") === "study" ? "study" : "single";
    var trials = parseInt(params.get("trials"), 10);
    if (!isNaN(trials)) state.trialsTotal = Math.max(2, Math.min(12, trials));

    // Legacy links carried the advisor as &model=. The page now decides,
    // so send such a link to the matching page, keeping the other parameters.
    var target = legacyRedirectTarget(window.location.search, state.advisor);
    if (target) {
      window.location.replace(target);
      return false;
    }

    state.mode = mode;
    state.scenario = scenario;

    if (mode === "participant") {
      state.participantId = pid || session.randomParticipantId();
      state.condition = CONDITIONS.indexOf(cond) >= 0
        ? cond
        : RANDOMISABLE_CONDITIONS[Math.floor(Math.random() * RANDOMISABLE_CONDITIONS.length)];
      applyPreset(state.condition);
      applyCustomParams(params);
      state.recommendationVisible = false;
      // Reflect the assigned condition and ID in the URL only, never in the UI.
      var url = new URL(window.location.href);
      url.searchParams.set("mode", "participant");
      url.searchParams.set("pid", state.participantId);
      url.searchParams.set("cond", state.condition);
      url.searchParams.delete("model");
      url.searchParams.set("scenario", state.scenario);
      try { window.history.replaceState(null, "", url.toString()); } catch (e) { /* file:// may refuse */ }
    } else {
      state.participantId = "researcher";
      state.condition = CONDITIONS.indexOf(cond) >= 0 ? cond : "none";
      applyPreset(state.condition);
      applyCustomParams(params);
    }
    return true;
  }

  function applyPreset(name) {
    var p = PRESETS[name] || PRESETS.none;
    state.content = p.content.slice();
    state.form = p.form;
    state.condition = name in PRESETS ? name : "custom";
  }

  /* &content= and &form= override the preset, and the condition name
     becomes the matching preset or "custom". */
  function applyCustomParams(params) {
    var content = params.get("content");
    var form = params.get("form");
    var changed = false;
    if (content !== null) {
      state.content = content.split(",").filter(function (c) { return CONTENT_PARTS.indexOf(c) >= 0; });
      changed = true;
    }
    if (form && FORMS.indexOf(form) >= 0) { state.form = form; changed = true; }
    if (changed) state.condition = presetFor(state.content, state.form);
  }

  function syncExplanationControls() {
    var sel = $("preset-select");
    if (!sel) return;
    sel.value = state.condition;
    document.querySelectorAll('input[name="content"]').forEach(function (cb) { cb.checked = state.content.indexOf(cb.value) >= 0; });
    setRadio("form", state.form);
  }

  function applyMode() {
    var isParticipant = state.mode === "participant";
    document.body.classList.toggle("participant-mode", isParticipant);

    document.querySelectorAll("[data-researcher-only]").forEach(function (node) {
      node.hidden = isParticipant;
    });
    document.querySelectorAll(".participant-only").forEach(function (node) {
      node.hidden = !isParticipant;
    });

    // Page-specific panels: shown only on the page of the matching advisor.
    document.querySelectorAll("[data-advisor-only]").forEach(function (node) {
      if (node.getAttribute("data-advisor-only") !== state.advisor) node.hidden = true;
    });
    // Mark the current page in the navigation.
    document.querySelectorAll(".nav-page").forEach(function (link) {
      if (link.getAttribute("data-page") === state.advisor) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    if (isParticipant) {
      $("participant-id-display").textContent = state.participantId;
    } else {
      syncExplanationControls();
      setRadio("scenario", state.scenario);
    }
    updateLiteracyVisibility();
  }

  /* ------------------------------------------------------------
     Financial literacy (Lusardi and Mitchell "Big Three"). Correct
     answers: 1 more than 102, 2 less than today, 3 false.
     Returns null when nothing is answered.
     ------------------------------------------------------------ */
  var LITERACY_CORRECT = { lit1: "more", lit2: "less", lit3: "false" };

  function literacyScore() {
    var answered = 0, score = 0, answers = [];
    Object.keys(LITERACY_CORRECT).forEach(function (name) {
      var v = radioValue(name);
      answers.push(v || "");
      if (v) { answered++; if (v === LITERACY_CORRECT[name]) score++; }
    });
    if (!answered) return null;
    return { score: score, answered: answered, answers: answers.join("|") };
  }

  function literacyLevel() {
    var lit = literacyScore();
    if (lit) return lit.score >= 2 ? "high" : "low";
    return radioValue("knowledge") === "beginner" ? "low" : "high";
  }

  /* The literacy check is only shown when the adaptive delivery is
     selected (it decides the plain or detailed variant). In the study flow
     it is asked at the start as its own stage, whatever the condition,
     because it is also the moderator variable. */
  function updateLiteracyVisibility() {
    var block = document.querySelector(".literacy-block");
    if (!block || state.flow === "study") return;
    block.hidden = state.form !== "adaptive";
  }

  function updateLiteracyStatus() {
    var node = $("literacy-status");
    if (!node) return;
    var lit = literacyScore();
    node.textContent = lit ? "Literacy score: " + lit.score + " of 3 (" + lit.answered + " answered), level " + literacyLevel() + "." : "Literacy score: not answered (the adaptive condition falls back to the self-rating).";
  }

  /* ------------------------------------------------------------
     Profile form
     ------------------------------------------------------------ */
  function readProfile() {
    return {
      age: Number($("age").value),
      horizon: Number($("horizon").value),
      tolerance: radioValue("tolerance"),
      toleranceInconsistent: state.toleranceInconsistent,
      emergencyFund: radioValue("emergencyFund") === "yes",
      incomeStable: radioValue("incomeStable") === "stable",
      knowledge: radioValue("knowledge")
    };
  }

  function setInconsistent(flag) {
    state.toleranceInconsistent = Boolean(flag);
    $("inconsistent-chip").hidden = !state.toleranceInconsistent;
  }

  function writeProfile(p) {
    $("age").value = p.age;
    $("horizon").value = p.horizon;
    $("horizon-output").value = p.horizon;
    setRadio("tolerance", p.tolerance);
    setRadio("emergencyFund", p.emergencyFund ? "yes" : "no");
    setRadio("incomeStable", p.incomeStable ? "stable" : "variable");
    setRadio("knowledge", p.knowledge);
  }

  function renderExampleButtons() {
    var wrap = $("example-buttons");
    model.EXAMPLE_PROFILES.forEach(function (ex) {
      var btn = el("button", { type: "button", class: "btn", text: ex.label });
      btn.addEventListener("click", function () {
        writeProfile(ex.profile);
        setInconsistent(false);
        state.ilsCaseId = "";
        state.narrativeUsed = false;
        $("ils-box").hidden = true;
        recompute();
      });
      wrap.appendChild(btn);
    });
  }

  /* ------------------------------------------------------------
     Recommendation rendering
     ------------------------------------------------------------ */
  function recompute() {
    var profile = readProfile();
    var result = advisors[state.advisor].recommend(profile);
    if (state.scenario === "flawed") result = model.applyFlawedScenario(result);
    state.result = result;

    if (state.recommendationVisible) {
      state.whatIfMoves = 0;
      state.whyNotAsked = 0;
      renderRecommendation(result);
      renderExplanation(result);
      state.displayedAt = Date.now();
      resetResponse();
    }
  }

  /* One line saying what the other advisor would answer for the same
     profile, so the two pages can be compared at a glance (researcher only). */
  function renderCompareLine(result) {
    var soundHere = result.flawed && result.soundPortfolio ? result.soundPortfolio : result.portfolio;
    var parts = [];
    ["ml", "logit"].forEach(function (id) {
      if (id === result.advisor || !advisors[id]) return;
      var other = advisors[id].recommend(result.profile);
      parts.push("The " + advisors[id].name.toLowerCase() + " advisor would answer: " + other.portfolio.name + (other.portfolio.name === soundHere.name ? " (same outcome)" : ""));
    });
    $("compare-line").textContent = parts.join(". ") + (parts.length ? "." : "");
  }

  function renderRecommendation(result) {
    var pf = result.portfolio;
    $("portfolio-name").textContent = pf.name;
    $("portfolio-summary").textContent = pf.summary;
    renderCompareLine(result);

    var bar = $("allocation-bar");
    clearChildren(bar);
    var legend = $("allocation-legend");
    clearChildren(legend);
    var ariaParts = [];
    var note = $("human-review-note");

    if (!pf.allocation) {
      // Human review: no allocation to draw.
      bar.hidden = true;
      legend.hidden = true;
      note.hidden = false;
      note.textContent = result.escalationReason || "";
      var lab = result.labels;
      $("labels-line").textContent = lab ? "Suitability labels: tolerance " + lab.tolerance + ", capacity " + lab.capacity + ", liquidity need " + lab.liquidity + "." : "";
      $("flawed-marker").hidden = !(result.flawed && state.mode === "researcher");
      $("advisor-tag").textContent = "Advisor: " + advisors[result.advisor || "glass"].name;
      return;
    }
    bar.hidden = false;
    legend.hidden = false;
    note.hidden = true;

    model.ASSET_CLASSES.forEach(function (ac) {
      var pct = pf.allocation[ac.key];
      ariaParts.push(ac.label + " " + pct + " percent");
      if (pct > 0) {
        var seg = el("div", { class: "allocation-seg seg-" + ac.key, title: ac.label + " " + pct + "%" });
        seg.style.width = pct + "%";
        seg.textContent = pct >= 12 ? pct + "%" : "";
        bar.appendChild(seg);
      }
      var li = el("li", {}, [
        el("span", { class: "swatch seg-" + ac.key, "aria-hidden": "true" }),
        el("span", { text: ac.label + ": " + pct + "%" })
      ]);
      legend.appendChild(li);
    });
    bar.setAttribute("aria-label", "Allocation: " + ariaParts.join(", "));

    var flawedMarker = $("flawed-marker");
    flawedMarker.hidden = !(result.flawed && state.mode === "researcher");

    var tag = $("advisor-tag");
    tag.textContent = "Advisor: " + advisors[result.advisor || "glass"].name;
    var lab = result.labels;
    $("labels-line").textContent = lab ? "Suitability labels: tolerance " + lab.tolerance + ", capacity " + lab.capacity + ", liquidity need " + lab.liquidity + "." : "";
  }

  /* ------------------------------------------------------------
     Explanation rendering, one function per condition
     ------------------------------------------------------------ */
  function renderExplanation(result) {
    var area = $("explanation-area");
    clearChildren(area);
    // Explanations always describe the shown recommendation. In the flawed
    // scenario the feature and confidence explanations still describe the
    // underlying score, which is exactly the tension the study can measure.
    if (state.form === "llm") { area.appendChild(renderLLM(result)); return; }
    if (state.form === "adaptive") { area.appendChild(renderAdaptive(result)); return; }
    var stack = el("div", { class: "hybrid-stack" });
    if (state.form === "interactive") stack.appendChild(renderInteractive(result));
    renderContent(result, state.content).forEach(function (box) { stack.appendChild(box); });
    if (!stack.children.length) stack.appendChild(renderNone());
    area.appendChild(stack);
  }

  /* The static content boxes for a set of content parts, in a fixed order. */
  function renderContent(result, content) {
    var boxes = [];
    if (content.indexOf("feature") >= 0) boxes.push(renderFeature(result));
    if (content.indexOf("counterfactual") >= 0) boxes.push(renderCounterfactual(result));
    if (content.indexOf("confidence") >= 0) boxes.push(renderConfidence(result));
    return boxes;
  }

  function renderNone() {
    if (state.mode === "participant") return el("div");
    return el("p", { class: "explanation-none", text: "Condition: no explanation. Only the recommendation is shown to the participant." });
  }

  function renderFeature(result) {
    var fx = explanations.featureExplanation(result);
    var box = el("div", { class: "explanation-box" });
    box.appendChild(el("h3", { text: "Why this recommendation" }));
    box.appendChild(el("p", { text: result.contribIntro || ("Compared with a neutral baseline profile, each of your inputs moved " + fx.targetLabel + " as follows (largest effect first):") }));

    var list = el("ul", { class: "contrib-list", "aria-label": "Feature contributions" });
    fx.items.forEach(function (it) {
      var cls = it.points > 0 ? "pos" : it.points < 0 ? "neg" : "zero";
      var width = fx.maxAbs > 0 ? (Math.abs(it.points) / fx.maxAbs) * 50 : 0;

      var barWrap = el("div", { class: "contrib-bar-wrap", "aria-hidden": "true" });
      if (it.points !== 0) {
        var bar = el("div", { class: "contrib-bar " + cls });
        bar.style.width = width + "%";
        barWrap.appendChild(bar);
      }

      var label = el("div", { class: "contrib-label" }, [
        it.label,
        el("small", { text: it.valueText })
      ]);
      var value = el("div", { class: "contrib-value " + cls, text: signed(it.points) });
      var li = el("li", { class: "contrib-item", "aria-label": it.sentence }, [label, barWrap, value]);
      list.appendChild(li);
    });
    box.appendChild(list);

    var total = el("p", { class: "contrib-total" });
    total.textContent = (result.contribTotal || "") + " " + fx.toleranceNote + (fx.clampNote ? " " + fx.clampNote : "");
    box.appendChild(total);
    box.appendChild(el("p", { class: "explanation-note", text: fx.methodNote }));

    // Also list the sentences in plain language for screen readers and clarity.
    var sentences = fx.items.filter(function (it) { return it.points !== 0; }).map(function (it) { return it.sentence; });
    if (sentences.length) box.appendChild(el("p", { class: "explanation-note", text: sentences.join(" ") }));
    return box;
  }

  function renderCounterfactual(result) {
    var cf = explanations.counterfactualExplanation(result);
    var box = el("div", { class: "explanation-box" });
    box.appendChild(el("h3", { text: "What would change this recommendation" }));
    box.appendChild(el("p", { text: cf.intro }));
    if (cf.sentences.length) {
      var list = el("ul", { class: "cf-list" });
      cf.sentences.forEach(function (s, i) {
        var li = el("li", { text: s });
        var ch = cf.changes && cf.changes[i];
        if (ch) li.appendChild(el("span", { class: "cf-chip", "aria-hidden": "true", text: ch.input + " " + ch.from + " to " + ch.to }));
        list.appendChild(li);
      });
      box.appendChild(list);
    }
    box.appendChild(el("p", { class: "explanation-note", text: "Each statement was produced by re-running the same " + (result.advisor === "ml" ? "network" : "model") + " with only that input changed." }));
    return box;
  }

  function renderConfidence(result) {
    var cx = explanations.confidenceExplanation(result);
    var box = el("div", { class: "explanation-box" });
    box.appendChild(el("h3", { text: "How confident is the model" }));

    var meter = el("div", { class: "confidence-meter", role: "meter", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(cx.percent), "aria-label": "Confidence, " + cx.percent + " percent" });
    var fill = el("div", { class: "confidence-meter-fill" });
    fill.style.width = cx.percent + "%";
    meter.appendChild(fill);

    var row = el("div", { class: "confidence-row" }, [
      el("span", { class: "confidence-pill " + cx.label, text: cx.labelText }),
      meter,
      el("span", { class: "confidence-detail", text: cx.detail })
    ]);
    box.appendChild(row);
    box.appendChild(el("p", { text: cx.sentence }));
    if (!cx.probabilities) box.appendChild(renderBandVisual(result));
    if (cx.probabilities) {
      var probs = el("ul", { class: "prob-list", "aria-label": "Probability of each portfolio" });
      cx.probabilities.forEach(function (pr, i) {
        var pct = Math.round(pr * 100);
        var li = el("li", { class: "prob-item" + (i === result.portfolioIndex ? " top" : "") });
        var fill = el("span", { class: "prob-fill", "aria-hidden": "true" });
        fill.style.width = pct + "%";
        li.appendChild(el("span", { class: "prob-label", text: model.OUTCOMES[i].name }));
        var barWrap = el("span", { class: "prob-bar", "aria-hidden": "true" }, [fill]);
        li.appendChild(barWrap);
        li.appendChild(el("span", { class: "prob-value", text: pct + "%" }));
        probs.appendChild(li);
      });
      box.appendChild(probs);
    }
    box.appendChild(el("p", { class: "explanation-note", text: "Note: confidence displays can increase or decrease reliance depending on how people read them. That effect is exactly what a study would test." }));
    return box;
  }

  /* Score band visual for the rule-based advisor: five bands, a marker at
     the score, the active band highlighted. Names are printed, not only
     colours. */
  function renderBandVisual(result) {
    var wrap = el("div", { class: "band-visual", role: "img", "aria-label": "Score " + result.score + " out of 100 on a five-band scale" });
    var track = el("div", { class: "band-track" });
    var edges = model.CONFIG.BAND_EDGES;
    model.PORTFOLIOS.forEach(function (pf, i) {
      var seg = el("div", { class: "band-seg" + (i === result.capacityBand ? " active" : ""), text: pf.name.replace("Capital preservation", "Cap. pres.").replace("Aggressive growth", "Aggr. growth") });
      seg.style.flex = String(edges[i + 1] - edges[i]);
      track.appendChild(seg);
    });
    var marker = el("div", { class: "band-marker" });
    marker.style.left = "calc(" + Math.min(100, Math.max(0, result.score)) + "% - 1px)";
    track.appendChild(marker);
    wrap.appendChild(track);
    var cap = "Score " + result.score + " of 100 sits in the " + model.PORTFOLIOS[result.capacityBand].name + " band, " + result.margin + " points from the nearest boundary.";
    if (result.toleranceShift) cap += " Your stated tolerance then moved the choice one step " + (result.toleranceShift > 0 ? "up" : "down") + ".";
    if (result.escalated) cap += " The escalation rule then replaced the portfolio with Human review.";
    wrap.appendChild(el("p", { class: "band-caption", text: cap }));
    return wrap;
  }

  /* ------------------------------------------------------------
     Interactive (what-if) condition: the participant steers the inputs
     of a copy of the profile and sees the outcome, probabilities or band,
     and contributions move. Inputs can be switched off ("ignore"), which
     holds them at the neutral baseline. A "why not" selector gives a
     contrastive explanation. The real recommendation is untouched.
     ------------------------------------------------------------ */
  function renderInteractive(result) {
    var advisor = advisors[result.advisor || "glass"];
    var baseline = { age: 45, horizon: 10, tolerance: "medium", emergencyFund: true, incomeStable: true };
    var whatIf = Object.assign({}, result.profile);
    var ignored = {};

    var box = el("div", { class: "explanation-box" });
    box.appendChild(el("h3", { text: "Explore what would change the advice" }));
    box.appendChild(el("p", { text: "Move the controls to see how the advice would change. Tick \"ignore\" to see what the advisor would say if it did not know that input. Your actual profile and recommendation stay as they are." }));

    var grid = el("div", { class: "whatif-grid" });
    var controls = el("div", { class: "whatif-controls" });
    var preview = el("div", { class: "whatif-preview", "aria-live": "polite" });
    grid.appendChild(controls); grid.appendChild(preview);
    box.appendChild(grid);

    function ignoreToggle(key) {
      var cb = el("input", { type: "checkbox", "aria-label": "Ignore " + key });
      cb.addEventListener("change", function () { ignored[key] = cb.checked; bump(); });
      return el("label", { class: "ignore-toggle" }, [cb, " ignore"]);
    }
    function field(labelText, key, control) {
      var f = el("div", { class: "field" });
      var lab = el("label", { text: labelText });
      lab.appendChild(ignoreToggle(key));
      f.appendChild(lab); f.appendChild(control);
      return f;
    }
    function segmented(name, options, current, onChange) {
      var wrap = el("div", { class: "segmented", role: "radiogroup", "aria-label": name });
      options.forEach(function (o) {
        var input = el("input", { type: "radio", name: "whatif-" + name, value: o.value });
        if (o.value === current) input.checked = true;
        input.addEventListener("change", function () { onChange(o.value); });
        wrap.appendChild(el("label", {}, [input, el("span", { text: o.label })]));
      });
      return wrap;
    }

    var ageInput = el("input", { type: "number", min: "18", max: "80", step: "1", value: String(whatIf.age), "aria-label": "What-if age" });
    ageInput.addEventListener("input", function () { var v = Number(ageInput.value); if (v >= 18 && v <= 80) { whatIf.age = Math.round(v); bump(); } });
    controls.appendChild(field("Age", "age", ageInput));

    var horOut = el("output", { text: String(whatIf.horizon) });
    var horInput = el("input", { type: "range", min: "1", max: "40", step: "1", value: String(whatIf.horizon), "aria-label": "What-if horizon" });
    horInput.addEventListener("input", function () { whatIf.horizon = Number(horInput.value); horOut.textContent = horInput.value; bump(); });
    var horLabel = el("label", {}, ["Investment horizon: ", horOut, " years"]);
    horLabel.appendChild(ignoreToggle("horizon"));
    var horField = el("div", { class: "field" }, [horLabel, horInput]);
    controls.appendChild(horField);

    controls.appendChild(field("Risk tolerance", "tolerance", segmented("tolerance", [
      { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }
    ], whatIf.tolerance, function (v) { whatIf.tolerance = v; bump(); })));
    controls.appendChild(field("Emergency fund", "emergencyFund", segmented("fund", [
      { value: "yes", label: "Yes" }, { value: "no", label: "No" }
    ], whatIf.emergencyFund ? "yes" : "no", function (v) { whatIf.emergencyFund = v === "yes"; bump(); })));
    controls.appendChild(field("Income stability", "incomeStable", segmented("income", [
      { value: "stable", label: "Stable" }, { value: "variable", label: "Variable" }
    ], whatIf.incomeStable ? "stable" : "variable", function (v) { whatIf.incomeStable = v === "stable"; bump(); })));

    function effectiveProfile() {
      var p = Object.assign({}, whatIf);
      Object.keys(ignored).forEach(function (k) { if (ignored[k]) p[k] = baseline[k]; });
      p.toleranceInconsistent = ignored.tolerance ? false : Boolean(result.profile.toleranceInconsistent);
      return p;
    }

    function renderPreview() {
      clearChildren(preview);
      var r = advisor.recommend(effectiveProfile());
      preview.appendChild(el("p", { class: "card-eyebrow", text: "With these inputs the advice would be" }));
      preview.appendChild(el("p", { class: "whatif-outcome", text: r.portfolio.name }));
      preview.appendChild(el("p", { class: "hint", text: r.portfolio.name === result.portfolio.name ? "Same as your recommendation (" + result.portfolio.name + ")." : "Different from your recommendation (" + result.portfolio.name + ")." }));
      if (r.probabilities) {
        var probs = el("ul", { class: "prob-list", "aria-label": "Probability of each outcome" });
        r.probabilities.forEach(function (pr, i) {
          var pct = Math.round(pr * 100);
          var fill = el("span", { class: "prob-fill", "aria-hidden": "true" }); fill.style.width = pct + "%";
          probs.appendChild(el("li", { class: "prob-item" + (i === r.portfolioIndex ? " top" : "") }, [
            el("span", { class: "prob-label", text: model.OUTCOMES[i].name }),
            el("span", { class: "prob-bar", "aria-hidden": "true" }, [fill]),
            el("span", { class: "prob-value", text: pct + "%" })
          ]));
        });
        preview.appendChild(probs);
      } else {
        preview.appendChild(renderBandVisual(r));
      }
      var fx = explanations.featureExplanation(r);
      var top = fx.items.filter(function (it) { return it.points !== 0; }).slice(0, 3);
      if (top.length) {
        var list = el("ul", { class: "contrib-list", "aria-label": "Largest contributions" });
        top.forEach(function (it) {
          list.appendChild(el("li", { class: "contrib-item" }, [
            el("div", { class: "contrib-label" }, [it.label, el("small", { text: it.valueText })]),
            el("div", { class: "contrib-value " + (it.points > 0 ? "pos" : "neg"), text: signed(it.points) })
          ]));
        });
        preview.appendChild(el("p", { class: "hint", text: "Largest contributions (" + fx.targetUnit + "):" }));
        preview.appendChild(list);
      }
    }
    function bump() { state.whatIfMoves += 1; renderPreview(); }
    renderPreview();

    // Why not X?
    var whyNot = el("div", { class: "whynot" });
    var sel = el("select", { "aria-label": "Why not another outcome" });
    sel.appendChild(el("option", { value: "", text: "Why not another outcome?" }));
    model.OUTCOMES.forEach(function (o) { if (o.name !== result.portfolio.name) sel.appendChild(el("option", { value: o.name, text: "Why not " + o.name + "?" })); });
    var answer = el("p", { class: "whynot-answer", "aria-live": "polite" });
    sel.addEventListener("change", function () {
      if (!sel.value) { answer.textContent = ""; return; }
      state.whyNotAsked += 1;
      answer.textContent = explanations.contrastiveExplanation(result, sel.value).sentence;
    });
    whyNot.appendChild(sel); whyNot.appendChild(answer);
    box.appendChild(whyNot);
    box.appendChild(el("p", { class: "explanation-note", text: "Every preview is a real re-run of the same advisor. Interactions are counted in the log." }));
    return box;
  }

  /* Adaptive: plain sentences for low literacy, bars and probabilities
     for high literacy. The level comes from the Big Three score, or from
     the self-rating when the questions were not answered. */
  function renderAdaptive(result) {
    var level = literacyLevel();
    state.adaptiveVariant = level === "low" ? "plain" : "detailed";
    var lit = literacyScore();
    var content = state.content.length ? state.content : CONTENT_PARTS.slice();
    var note = "Adaptive variant: " + state.adaptiveVariant + " (literacy " + (lit ? lit.score + " of 3" : "self-rated " + radioValue("knowledge")) + ").";
    if (level === "high") {
      var wrap = el("div", { class: "hybrid-stack" });
      renderContent(result, content).forEach(function (box) { wrap.appendChild(box); });
      if (state.mode === "researcher") wrap.appendChild(el("p", { class: "explanation-note", text: note }));
      return wrap;
    }
    // Plain variant: short sentences built from the same content.
    var box = el("div", { class: "explanation-box adaptive-plain" });
    box.appendChild(el("h3", { text: "In short" }));
    var name = result.portfolio.name;
    if (content.indexOf("feature") >= 0) {
      var fx = explanations.featureExplanation(result);
      var items = fx.items.filter(function (it) { return it.points !== 0; });
      if (items.length) {
        var first = items[0];
        box.appendChild(el("p", { text: "The main reason for this advice is your " + first.label.toLowerCase() + " (" + first.valueText + "). It counted " + (first.points > 0 ? "in favour of " + name : "against " + name) + "." }));
        if (items.length > 1) {
          var second = items[1];
          box.appendChild(el("p", { text: "Your " + second.label.toLowerCase() + " (" + second.valueText + ") also mattered, " + (second.points > 0 ? "in favour." : "against it.") }));
        }
      }
    }
    if (content.indexOf("counterfactual") >= 0) {
      var cf = explanations.counterfactualExplanation(result);
      if (cf.sentences.length) box.appendChild(el("p", { text: cf.sentences[0] }));
    }
    if (content.indexOf("confidence") >= 0) {
      var cx = explanations.confidenceExplanation(result);
      var sure = cx.label === "high" ? "The advisor is quite sure about this." : cx.label === "moderate" ? "The advisor is fairly sure, but not certain." : "The advisor is not very sure about this.";
      box.appendChild(el("p", { text: sure }));
    }
    box.appendChild(el("p", { text: "You can also choose to ask a human adviser." }));
    if (state.mode === "researcher") box.appendChild(el("p", { class: "explanation-note", text: note }));
    return box;
  }

  /* ------------------------------------------------------------
     Conversational (LLM) condition. The language model runs in the
     browser via WebLLM (see llm.js). The UI has three states:
     unsupported, not loaded (with a load button), and ready (with the
     generated explanation and a chat box).
     ------------------------------------------------------------ */
  var llmProgressWired = false;

  function renderLLM(result) {
    var box = el("div", { class: "explanation-box llm-box" });
    box.appendChild(el("h3", { text: "Ask the advisor" }));

    if (!llm.servedOverHttp()) {
      box.appendChild(el("p", { text: "The conversational condition needs the page to be served over http. Run python3 -m http.server 8000 in the folder and open localhost:8000, or use the GitHub Pages link." }));
      return box;
    }
    if (!llm.supported()) {
      box.appendChild(el("p", { text: "This browser does not expose WebGPU, which the in-browser language model needs. Use a recent Chrome or Edge on a laptop with a GPU." }));
      return box;
    }

    // Model chooser and status (researcher mode shows the chooser, participants get the default).
    var status = el("p", { class: "llm-status", id: "llm-status", role: "status", "aria-live": "polite" });
    var progress = el("div", { class: "llm-progress", "aria-hidden": "true" }, [el("div", { class: "llm-progress-fill", id: "llm-progress-fill" })]);

    if (state.mode === "researcher") {
      var select = el("select", { id: "llm-model-select", "aria-label": "Language model" });
      llm.MODELS.forEach(function (m) {
        var opt = el("option", { value: m.id, text: m.label });
        if (m.id === state.llmModelId) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("change", function () { state.llmModelId = select.value; });
      var loadBtn = el("button", { type: "button", class: "btn", id: "llm-load", text: llm.isReady() && llm.loadedModelId() === state.llmModelId ? "Model ready" : "Load model" });
      loadBtn.addEventListener("click", function () { startLLM(result); });
      box.appendChild(el("div", { class: "button-row llm-controls" }, [select, loadBtn]));
      box.appendChild(el("p", { class: "explanation-note", text: "The model downloads once (size shown above) and is cached by the browser. It then runs on this device's GPU." }));
    }
    box.appendChild(status);
    box.appendChild(progress);

    var transcript = el("div", { class: "llm-transcript", id: "llm-transcript", "aria-live": "polite" });
    box.appendChild(transcript);

    var input = el("input", { type: "text", id: "llm-input", placeholder: "Ask a follow-up question", "aria-label": "Your question" });
    var ask = el("button", { type: "button", class: "btn btn-primary", id: "llm-ask", text: "Ask" });
    var chatRow = el("div", { class: "llm-chat-row", id: "llm-chat-row" }, [input, ask]);
    chatRow.hidden = true;
    box.appendChild(chatRow);
    ask.addEventListener("click", function () { askLLM(result); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); askLLM(result); } });

    box.appendChild(el("p", { class: "explanation-note", text: "The language model only sees the facts computed by the advisor and is instructed to explain those. Its text is recorded in the session log." }));

    if (!llmProgressWired) {
      llm.onProgress(function (r) {
        var st = $("llm-status"), fill = $("llm-progress-fill");
        if (st) st.textContent = r.text;
        if (fill) fill.style.width = Math.round((r.progress || 0) * 100) + "%";
      });
      llmProgressWired = true;
    }

    // Auto-start when the model is already loaded, or in participant mode.
    if (llm.isReady() && llm.loadedModelId() === state.llmModelId) {
      startLLM(result);
    } else if (state.mode === "participant") {
      status.textContent = "Loading the language model. This can take a minute the first time.";
      startLLM(result);
    } else {
      status.textContent = "Choose a model and press Load model.";
    }
    return box;
  }

  function appendBubble(role, text) {
    var t = $("llm-transcript");
    if (!t) return null;
    var b = el("div", { class: "llm-bubble " + role });
    b.textContent = text;
    t.appendChild(b);
    t.scrollTop = t.scrollHeight;
    return b;
  }

  function startLLM(result) {
    state.llmMessages = [];
    state.llmExplanation = "";
    state.llmTurns = 0;
    var t = $("llm-transcript");
    if (t) clearChildren(t);
    llm.load(state.llmModelId).then(function () {
      var loadBtn = $("llm-load");
      if (loadBtn) loadBtn.textContent = "Model ready";
      state.llmMessages = [
        { role: "system", content: llm.systemPrompt(result, state.content) },
        { role: "user", content: llm.OPENING_REQUEST }
      ];
      var bubble = appendBubble("assistant", "");
      return llm.chat(state.llmMessages, function (text) { if (bubble) bubble.textContent = text; }).then(function (text) {
        state.llmMessages.push({ role: "assistant", content: text });
        state.llmExplanation = text;
        var row = $("llm-chat-row");
        if (row) row.hidden = false;
        // The participant only really "sees" the recommendation once the text is there.
        state.displayedAt = Date.now();
        var st = $("llm-status");
        if (st) st.textContent = "Model ready. You can ask a follow-up question.";
      });
    }).catch(function () { /* status already shows the error */ });
  }

  function askLLM(result) {
    var input = $("llm-input");
    if (!input || !input.value.trim() || !llm.isReady()) return;
    var question = input.value.trim();
    input.value = "";
    appendBubble("user", question);
    state.llmMessages.push({ role: "user", content: question });
    state.llmTurns += 1;
    var bubble = appendBubble("assistant", "");
    llm.chat(state.llmMessages, function (text) { if (bubble) bubble.textContent = text; }).then(function (text) {
      state.llmMessages.push({ role: "assistant", content: text });
    }).catch(function (err) {
      if (bubble) bubble.textContent = "The model could not answer: " + (err && err.message ? err.message : String(err));
    });
  }

  /* ------------------------------------------------------------
     Response and session log
     ------------------------------------------------------------ */
  function resetResponse() {
    $("trust").value = 4;
    $("trust-output").value = 4;
    document.querySelectorAll('input[name="decision"]').forEach(function (i) { i.checked = false; });
    ["understanding", "decision-confidence", "mental-demand"].forEach(function (id) { $(id).value = 4; $(id + "-output").value = 4; });
    $("reason").value = "";
    $("adjust-panel").hidden = true;
    document.querySelectorAll('input[name="adjustTo"]').forEach(function (i) { i.checked = false; });
    $("submit-status").textContent = "";
    $("submit-status").classList.remove("error");
  }

  /* Build the five-portfolio chooser shown when the decision is Adjust. */
  function buildAdjustGroup() {
    var group = $("adjust-group");
    clearChildren(group);
    model.PORTFOLIOS.forEach(function (pf) {
      var input = el("input", { type: "radio", name: "adjustTo", value: pf.name });
      group.appendChild(el("label", {}, [input, el("span", { text: pf.name })]));
    });
  }

  function updateAdjustPanel() {
    var isAdjust = radioValue("decision") === "adjust";
    $("adjust-panel").hidden = !isAdjust;
    if (isAdjust && state.result) {
      $("adjust-hint").textContent = "The advice shown is " + state.result.portfolio.name + ". Choose the portfolio you would go for instead.";
    }
  }

  function submitResponse() {
    var status = $("submit-status");
    var decision = radioValue("decision");
    if (!state.result || !state.recommendationVisible) {
      status.textContent = "Show a recommendation first.";
      status.classList.add("error");
      return;
    }
    if (!decision) {
      status.textContent = "Please choose Follow, Adjust, Reject, or Ask a human adviser.";
      status.classList.add("error");
      return;
    }
    var adjustedTo = decision === "adjust" ? radioValue("adjustTo") : "";
    if (decision === "adjust" && !adjustedTo) {
      status.textContent = "Please choose which portfolio you would adjust to.";
      status.classList.add("error");
      return;
    }
    var r = state.result;
    var p = r.profile;
    var lit = literacyScore();
    var shownIdx = model.PORTFOLIOS.map(function (pf) { return pf.name; }).indexOf(r.portfolio.name);
    var adjIdx = adjustedTo ? model.PORTFOLIOS.map(function (pf) { return pf.name; }).indexOf(adjustedTo) : -1;
    var row = {
      timestamp: new Date().toISOString(),
      participantId: state.participantId,
      mode: state.mode,
      condition: state.condition,
      advisorModel: r.advisor || "glass",
      scenario: r.flawed ? "flawed" : "sound",
      age: p.age,
      horizon: p.horizon,
      tolerance: p.tolerance,
      emergencyFund: p.emergencyFund ? "yes" : "no",
      incomeStable: p.incomeStable ? "stable" : "variable",
      knowledge: p.knowledge,
      toleranceInconsistent: p.toleranceInconsistent ? "yes" : "no",
      suitabilityTolerance: r.labels ? r.labels.tolerance : "",
      suitabilityCapacity: r.labels ? r.labels.capacity : "",
      suitabilityLiquidity: r.labels ? r.labels.liquidity : "",
      narrativeUsed: state.narrativeUsed ? "yes" : "no",
      ilsCaseId: state.ilsCaseId,
      recommendedPortfolio: r.portfolio.name,
      soundPortfolio: r.flawed ? r.soundPortfolio.name : r.portfolio.name,
      score: r.score,
      margin: r.margin,
      confidence: r.confidence,
      trustRating: Number($("trust").value),
      decision: decision,
      adjustedTo: adjustedTo,
      adjustSteps: adjustedTo && shownIdx >= 0 && adjIdx >= 0 ? adjIdx - shownIdx : "",
      understanding: Number($("understanding").value),
      decisionConfidence: Number($("decision-confidence").value),
      mentalDemand: Number($("mental-demand").value),
      reason: $("reason").value.trim(),
      literacyScore: lit ? lit.score : "",
      literacyAnswers: lit ? lit.answers : "",
      literacyLevel: literacyLevel(),
      explanationContent: state.content.join("+"),
      explanationForm: state.form,
      whatIfMoves: state.form === "interactive" ? state.whatIfMoves : "",
      whyNotAsked: state.form === "interactive" ? state.whyNotAsked : "",
      adaptiveVariant: state.form === "adaptive" ? state.adaptiveVariant : "",
      flow: state.flow || "single",
      trialIndex: state.trial ? state.trial.index + 1 : "",
      trialProfileId: state.trial ? state.trial.profileId : "",
      attentionCheck: state.trial && state.trial.attention ? (decision === "reject" ? "passed" : "failed") : "",
      decisionTimeMs: state.displayedAt ? Date.now() - state.displayedAt : null,
      llmModel: state.form === "llm" ? state.llmModelId : "",
      llmExplanation: state.form === "llm" ? state.llmExplanation : "",
      llmTurns: state.form === "llm" ? state.llmTurns : ""
    };
    session.add(row);
    renderSession();
    status.classList.remove("error");
    status.textContent = "Response recorded. Thank you.";
    sendToStudyServer(row, status);
    if (state.flow === "study") {
      // One response per trial: lock the controls and offer the next case.
      $("submit-response").disabled = true;
      $("next-trial").hidden = false;
      $("next-trial").focus();
      return;
    }
    // A new decision starts now, for a possible second response on the same recommendation.
    state.displayedAt = Date.now();
    document.querySelectorAll('input[name="decision"]').forEach(function (i) { i.checked = false; });
  }

  /* If the page is served by serve.py, also send the row to the laptop
     that hosts the study. Fails silently otherwise (GitHub Pages, file). */
  function sendToStudyServer(row, statusNode) {
    if (!/^https?:$/.test(window.location.protocol) || typeof window.fetch !== "function") return;
    window.fetch("api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row)
    }).then(function (res) {
      if (res.ok && statusNode) statusNode.textContent = "Response recorded and sent to the study server. Thank you.";
    }).catch(function () { /* no server, local log still has the row */ });
  }

  function renderSession() {
    var rows = session.all();
    var tbody = $("session-tbody");
    clearChildren(tbody);
    $("session-count").textContent = String(rows.length);
    $("session-empty").hidden = rows.length > 0;

    rows.forEach(function (r) {
      var tr = el("tr", { class: r.scenario === "flawed" ? "flawed" : "" });
      var time = r.timestamp.replace("T", " ").slice(0, 19);
      var profileText = r.age + "y, " + r.horizon + "y horizon, " + r.tolerance + ", fund " + r.emergencyFund + ", " + r.incomeStable + ", " + r.knowledge;
      var scenarioCell = el("td");
      scenarioCell.textContent = r.scenario;
      if (r.scenario === "flawed") {
        scenarioCell.appendChild(document.createTextNode(" "));
        scenarioCell.appendChild(el("span", { class: "tag-flawed", text: "sound: " + r.soundPortfolio }));
      }
      [
        el("td", { text: time }),
        el("td", { text: r.participantId }),
        el("td", { text: CONDITION_LABELS[r.condition] || r.condition }),
        el("td", { text: r.advisorModel === "ml" ? "Neural network" : "Rule-based" }),
        scenarioCell,
        el("td", { text: profileText }),
        el("td", { text: r.recommendedPortfolio }),
        el("td", { class: "num", text: String(r.score) }),
        el("td", { class: "num", text: String(r.margin) }),
        el("td", { class: "num", text: String(r.trustRating) }),
        el("td", { text: r.decision }),
        el("td", { class: "num", text: r.decisionTimeMs === null ? "" : String(r.decisionTimeMs) })
      ].forEach(function (td) { tr.appendChild(td); });
      tbody.appendChild(tr);
    });
  }

  /* ------------------------------------------------------------
     Dialogs
     ------------------------------------------------------------ */
  function wireDialog(openId, dialogId) {
    var dialog = $(dialogId);
    var opener = $(openId);
    if (!dialog || !opener) return;
    opener.addEventListener("click", function () {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });
    dialog.querySelectorAll("[data-close-dialog]").forEach(function (b) {
      b.addEventListener("click", function () { dialog.close ? dialog.close() : dialog.removeAttribute("open"); });
    });
    // Close on backdrop click.
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog && dialog.close) dialog.close();
    });
  }

  /* ------------------------------------------------------------
     Event wiring
     ------------------------------------------------------------ */
  function wireEvents() {
    var form = $("profile-form");
    form.addEventListener("submit", function (e) { e.preventDefault(); });

    $("horizon").addEventListener("input", function () {
      $("horizon-output").value = $("horizon").value;
    });
    $("trust").addEventListener("input", function () {
      $("trust-output").value = $("trust").value;
    });
    ["understanding", "decision-confidence", "mental-demand"].forEach(function (id) {
      $(id).addEventListener("input", function () { $(id + "-output").value = $(id).value; });
    });
    document.querySelectorAll('input[name="decision"]').forEach(function (i) { i.addEventListener("change", updateAdjustPanel); });
    ["lit1", "lit2", "lit3"].forEach(function (name) {
      document.querySelectorAll('input[name="' + name + '"]').forEach(function (i) {
        i.addEventListener("change", function () { updateLiteracyStatus(); if (state.result && state.form === "adaptive" && state.recommendationVisible) renderExplanation(state.result); });
      });
    });

    // Any profile change recomputes (live in researcher mode, hidden until
    // requested in participant mode).
    form.addEventListener("input", function (e) {
      if (e.target && (e.target.name === "decision" || /^lit[123]$/.test(e.target.name || ""))) return;
      if (state.mode === "participant") {
        // In participant mode, editing the profile after a reveal hides the
        // recommendation again so decision time is measured cleanly.
        state.recommendationVisible = false;
        $("recommendation-block").hidden = true;
        $("recommendation-placeholder").hidden = false;
      }
      recompute();
    });
    $("age").addEventListener("change", function () {
      var v = Number($("age").value);
      if (isNaN(v)) v = 35;
      $("age").value = Math.min(80, Math.max(18, Math.round(v)));
      recompute();
    });

    document.querySelectorAll('input[name="tolerance"]').forEach(function (input) {
      input.addEventListener("change", function () { setInconsistent(false); });
    });
    $("clear-inconsistent").addEventListener("click", function () { setInconsistent(false); recompute(); });
    $("read-narrative").addEventListener("click", readNarrative);
    $("load-ils-case").addEventListener("click", function () { loadIlsCase(); });
    $("narrative").addEventListener("input", function () { state.ilsCaseId = ""; $("ils-box").hidden = true; });

    $("show-recommendation").addEventListener("click", function () {
      state.recommendationVisible = true;
      $("recommendation-block").hidden = false;
      $("recommendation-placeholder").hidden = true;
      recompute();
      $("recommendation-card").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("preset-select").addEventListener("change", function () {
      var v = $("preset-select").value;
      if (v === "custom") { $("customise").open = true; return; }
      applyPreset(v);
      syncExplanationControls();
      onExplanationChanged();
    });
    document.querySelectorAll('input[name="content"]').forEach(function (cb) {
      cb.addEventListener("change", function () {
        state.content = CONTENT_PARTS.filter(function (c) { var n = document.querySelector('input[name="content"][value="' + c + '"]'); return n && n.checked; });
        state.condition = presetFor(state.content, state.form);
        $("preset-select").value = state.condition;
        onExplanationChanged();
      });
    });
    document.querySelectorAll('input[name="form"]').forEach(function (r) {
      r.addEventListener("change", function () {
        state.form = r.value;
        state.condition = presetFor(state.content, state.form);
        $("preset-select").value = state.condition;
        onExplanationChanged();
      });
    });
    document.querySelectorAll('input[name="scenario"]').forEach(function (input) {
      input.addEventListener("change", function () {
        state.scenario = input.value;
        updateParticipantLink();
        recompute();
      });
    });

    $("submit-response").addEventListener("click", submitResponse);
    $("next-trial").addEventListener("click", function () { startTrial(state.trial ? state.trial.index + 1 : 0); });
    $("download-csv").addEventListener("click", session.downloadCSV);
    $("download-json").addEventListener("click", session.downloadJSON);
    $("clear-session").addEventListener("click", function () {
      if (session.all().length === 0) return;
      if (window.confirm("Clear all recorded responses in this browser? This cannot be undone.")) {
        session.clear();
        renderSession();
      }
    });

    wireDialog("open-study-design", "study-design-dialog");
    wireDialog("open-how-it-works", "how-it-works-dialog");
  }

  /* ------------------------------------------------------------
     Language to suitability: read the narrative into the form with the
     in-browser language model (ILS-Bench procedure, step 1).
     ------------------------------------------------------------ */
  function readNarrative() {
    var status = $("narrative-status");
    var text = $("narrative").value.trim();
    status.classList.remove("error");
    if (!text) { status.textContent = "Write or load a description first."; status.classList.add("error"); return; }
    if (!llm.servedOverHttp()) { status.textContent = "Needs the page served over http (python3 serve.py)."; status.classList.add("error"); return; }
    if (!llm.supported()) { status.textContent = "This browser has no WebGPU, the language model cannot run here."; status.classList.add("error"); return; }
    status.textContent = llm.isReady() ? "Reading the description" : "Loading the language model, then reading the description";
    var progressNode = status;
    llm.onProgress(function (r) { if (!llm.isReady()) progressNode.textContent = r.text; });
    llm.load(state.llmModelId).then(function () {
      status.textContent = "Reading the description";
      return llm.complete(llm.extractionMessages(text), 220);
    }).then(function (reply) {
      var ex = llm.parseExtraction(reply);
      if (!ex) { status.textContent = "The model did not return readable JSON. Try again or fill in the form by hand."; status.classList.add("error"); return; }
      var filled = [], missing = [];
      if (ex.age !== null) { $("age").value = ex.age; filled.push("age"); } else missing.push("age");
      if (ex.horizon !== null) { $("horizon").value = ex.horizon; $("horizon-output").value = ex.horizon; filled.push("horizon"); } else missing.push("horizon");
      if (ex.tolerance) { setRadio("tolerance", ex.tolerance); filled.push("tolerance"); } else missing.push("tolerance");
      if (ex.emergencyFund !== null) { setRadio("emergencyFund", ex.emergencyFund ? "yes" : "no"); filled.push("emergency fund"); } else missing.push("emergency fund");
      if (ex.incomeStable !== null) { setRadio("incomeStable", ex.incomeStable ? "stable" : "variable"); filled.push("income"); } else missing.push("income");
      setInconsistent(ex.toleranceInconsistent);
      state.narrativeUsed = true;
      status.textContent = "Filled: " + (filled.join(", ") || "nothing") + (missing.length ? ". Not found in the text: " + missing.join(", ") + ", left as they were." : ".") + (ex.toleranceInconsistent ? " Risk attitude read as Inconsistent." : "");
      recompute();
    }).catch(function (err) {
      status.textContent = "Could not read the description: " + (err && err.message ? err.message : String(err));
      status.classList.add("error");
    });
  }

  /* Load one of the 400 ILS-Bench cases and show the expert consensus,
     so the advisors' outcome can be compared with the panel. */
  function loadIlsCase(caseId) {
    var bench = ns.ilsBench;
    if (!bench || !bench.cases || !bench.cases.length) return;
    var c = null;
    if (typeof caseId === "string") {
      for (var i = 0; i < bench.cases.length; i++) if (bench.cases[i].id === caseId) c = bench.cases[i];
    }
    if (!c) c = bench.cases[Math.floor(Math.random() * bench.cases.length)];
    $("narrative").value = c.narrative;
    state.ilsCaseId = c.id;
    state.narrativeUsed = false;
    setInconsistent(false);
    var box = $("ils-box");
    clearChildren(box);
    box.appendChild(el("div", {}, [el("strong", { text: c.id + " (ILS-Bench, expert consensus)" })]));
    var ul = el("ul", { class: "ils-labels" });
    ul.appendChild(el("li", { text: "Recommended outcome: " + c.portfolio + (c.escalation === "Yes" ? " (escalate to a human)" : "") }));
    ul.appendChild(el("li", { text: "Risk tolerance " + c.tolerance + ", risk capacity " + c.capacity + ", liquidity need " + c.liquidity + ", suitability risk " + c.suitabilityRisk }));
    ul.appendChild(el("li", { text: "Evidence the experts pointed to: " + c.evidence }));
    box.appendChild(ul);
    box.appendChild(el("p", { class: "hint", text: "Press \"Read description into the form\" to let the language model fill in the fields, or fill them in by hand, then compare the advisors' outcome with the panel." }));
    box.hidden = false;
    $("narrative-status").textContent = "";
  }

  /* ------------------------------------------------------------
     Full study flow (participant mode, flow=study).
     ------------------------------------------------------------ */
  function showStage(name) {
    state.stage = name;
    var stage = $("study-stage");
    var inTrial = name === "trial";
    stage.hidden = inTrial;
    $("columns").hidden = !inTrial;
    $("profile-panel").hidden = true; // participants do not enter their own profile in the study flow
    document.querySelectorAll(".panel").forEach(function (p) {
      // the session panel stays reachable only on the done screen
      if (p.getAttribute("aria-labelledby") === "session-heading") p.hidden = name !== "done";
    });
    if (!inTrial) clearChildren(stage);
    return stage;
  }

  function startStudyFlow() {
    state.plan = study.buildPlan(state.participantId, state.trialsTotal);
    $("participant-banner").hidden = false;
    renderConsent();
  }

  function renderConsent() {
    var stage = showStage("consent");
    var T = study.TEXTS;
    stage.appendChild(el("h2", { text: T.consentTitle }));
    T.consent.forEach(function (t) { stage.appendChild(el("p", { text: t })); });
    var cb = el("input", { type: "checkbox", id: "consent-check" });
    stage.appendChild(el("label", { class: "consent-check", for: "consent-check" }, [cb, "I have read the information above and I agree to take part."]));
    var btn = el("button", { type: "button", class: "btn btn-primary", text: "Start" });
    btn.disabled = true;
    cb.addEventListener("change", function () { btn.disabled = !cb.checked; });
    btn.addEventListener("click", renderLiteracyStage);
    stage.appendChild(el("div", { class: "button-row" }, [btn]));
  }

  function renderLiteracyStage() {
    var stage = showStage("literacy");
    var T = study.TEXTS;
    stage.appendChild(el("h2", { text: T.literacyTitle }));
    stage.appendChild(el("p", { text: T.literacyIntro }));
    // Move the literacy fieldset out of the (hidden) form into the stage.
    var block = document.querySelector(".literacy-block");
    block.hidden = false;
    var holder = el("div", { id: "literacy-holder" });
    holder.appendChild(block);
    stage.appendChild(holder);
    var btn = el("button", { type: "button", class: "btn btn-primary", text: "Continue" });
    btn.addEventListener("click", function () {
      var lit = literacyScore();
      if (!lit || lit.answered < 3) { note.textContent = "Please answer all three questions (\"Do not know\" is a valid answer)."; return; }
      $("profile-form").appendChild(block); // put it back so scoring keeps working
      startTrial(0);
    });
    var note = el("span", { class: "status error" });
    stage.appendChild(el("div", { class: "button-row" }, [btn, note]));
  }

  function startTrial(i) {
    var plan = state.plan;
    if (i >= plan.length) { renderDebrief(); return; }
    var trial = plan[i];
    state.trial = trial;
    state.scenario = trial.scenario;
    showStage("trial");
    writeProfile(trial.profile);
    setInconsistent(false);
    $("case-card").hidden = false;
    $("case-eyebrow").textContent = "Case " + (i + 1) + " of " + plan.length + ": " + trial.label;
    $("case-text").textContent = trial.text;
    $("attention-line").hidden = !trial.attention;
    $("submit-response").disabled = false;
    $("next-trial").hidden = true;
    state.recommendationVisible = true;
    $("recommendation-block").hidden = false;
    $("recommendation-placeholder").hidden = true;
    recompute();
    window.scrollTo(0, 0);
  }

  function renderDebrief() {
    var stage = showStage("debrief");
    var T = study.TEXTS;
    stage.appendChild(el("h2", { text: T.debriefTitle }));
    stage.appendChild(el("p", { text: T.debriefIntro }));
    var ul = el("ul", { class: "debrief-list" });
    state.plan.forEach(function (t) {
      if (t.scenario === "flawed") ul.appendChild(el("li", { text: "Case " + (t.index + 1) + " (" + t.label + ")" }));
    });
    stage.appendChild(ul);
    stage.appendChild(el("p", { text: T.debriefOutro }));
    var btn = el("button", { type: "button", class: "btn btn-primary", text: "Finish" });
    btn.addEventListener("click", renderDone);
    stage.appendChild(el("div", { class: "button-row" }, [btn]));
  }

  function renderDone() {
    var stage = showStage("done");
    var T = study.TEXTS;
    stage.appendChild(el("h2", { text: T.doneTitle }));
    stage.appendChild(el("p", { text: T.done }));
    var mine = session.all().filter(function (r) { return r.participantId === state.participantId; }).length;
    stage.appendChild(el("p", { class: "hint", text: mine + " response(s) recorded for participant " + state.participantId + "." }));
    state.trial = null;
  }

  function onExplanationChanged() {
    updateParticipantLink();
    updateLiteracyVisibility();
    if (state.result && state.recommendationVisible) {
      renderExplanation(state.result);
      state.displayedAt = Date.now();
    }
  }

  /* The demo link in researcher mode mirrors the active condition and
     scenario, so the interviewer can open exactly what is on screen. */
  function updateParticipantLink() {
    var extra = "&cond=" + state.condition + "&scenario=" + state.scenario;
    if (state.condition === "custom") extra = "&content=" + state.content.join(",") + "&form=" + state.form + "&scenario=" + state.scenario;
    var link = $("participant-link");
    if (link) link.href = "?mode=participant" + extra;
    var study = $("study-link");
    if (study) study.href = "?mode=participant&flow=study" + extra;
  }

  /* ------------------------------------------------------------
     Init
     ------------------------------------------------------------ */
  var initialised = false;
  function init() {
    if (initialised) return;
    initialised = true;
    if (!readParams()) return; // redirecting to the other page
    applyMode();
    renderExampleButtons();
    buildAdjustGroup();
    updateLiteracyStatus();
    var acc = $("hiw-ml-acc");
    if (acc) acc.textContent = String(Math.round(ns.mlModel.meta.cvAccuracy * 100));
    var acc2 = $("ai-panel-acc");
    if (acc2) acc2.textContent = String(Math.round(ns.mlModel.meta.cvAccuracy * 100));
    var acc4 = $("hiw-logit-acc");
    if (acc4 && ns.logitModel) acc4.textContent = String(Math.round(ns.logitModel.meta.cvAccuracy * 100));
    var acc3 = $("logit-panel-acc");
    if (acc3 && ns.logitModel) acc3.textContent = String(Math.round(ns.logitModel.meta.cvAccuracy * 100));
    session.load();
    renderSession();
    wireEvents();

    if (state.mode === "participant") {
      $("recommendation-block").hidden = true;
      $("recommendation-placeholder").hidden = false;
    } else {
      updateParticipantLink();
    }
    if (state.mode === "participant" && state.flow === "study") {
      startStudyFlow();
      return;
    }
    recompute();

    // Deep links from the Training data page.
    var params = new URLSearchParams(window.location.search);
    if (state.mode === "researcher" && params.get("ils")) {
      loadIlsCase(params.get("ils"));
      var box = $("narrative");
      if (box && box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    var panel = params.get("panel");
    if (panel === "study-design" && state.mode === "researcher") $("open-study-design").click();
    if (panel === "how-it-works") $("open-how-it-works").click();
  }

  ns.app = { legacyRedirectTarget: legacyRedirectTarget };

  document.addEventListener("DOMContentLoaded", init);
})(window.AdviceIT);
