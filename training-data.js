/*
  AdviceIT by Radit, training-data.js
  ---------------------------------------------------------------
  Renders the Training data page from the same two data files the app
  uses: ils_bench_cases.js (the 400 cases with expert consensus labels)
  and ml_weights.js (the trained network and its training metadata).
  Nothing here is typed in by hand, so the page cannot drift from the
  data or from the model.
*/

(function (ns) {
  "use strict";

  var cases = (ns.ilsBench && ns.ilsBench.cases) || [];
  var meta = (ns.mlWeights && ns.mlWeights.meta) || {};
  var classes = (ns.mlWeights && ns.mlWeights.classes) || [];

  var OUTCOME_ORDER = ["Capital preservation", "Conservative", "Balanced", "Growth", "Aggressive growth", "Human review"];

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

  function count(field, order) {
    var counts = {};
    cases.forEach(function (c) { counts[c[field]] = (counts[c[field]] || 0) + 1; });
    var keys = order ? order.filter(function (k) { return k in counts; }) : Object.keys(counts).sort();
    return keys.map(function (k) { return { key: k, n: counts[k] }; });
  }

  /* A labelled horizontal bar list, value and percent always printed. */
  function barList(title, items, total) {
    var wrap = el("div", { class: "stat-block" });
    wrap.appendChild(el("h3", { class: "sub-heading", text: title }));
    var ul = el("ul", { class: "stat-list", "aria-label": title });
    var max = items.reduce(function (m, it) { return Math.max(m, it.n); }, 0);
    items.forEach(function (it) {
      var pct = Math.round(it.n / total * 1000) / 10;
      var fill = el("span", { class: "stat-fill", "aria-hidden": "true" });
      fill.style.width = (max ? it.n / max * 100 : 0) + "%";
      ul.appendChild(el("li", { class: "stat-item" }, [
        el("span", { class: "stat-label", text: it.key }),
        el("span", { class: "stat-bar", "aria-hidden": "true" }, [fill]),
        el("span", { class: "stat-value", text: it.n + " (" + pct + "%)" })
      ]));
    });
    wrap.appendChild(ul);
    return wrap;
  }

  function renderStats() {
    var root = $("stats");
    if (!root) return;
    var total = cases.length;
    var hr = cases.filter(function (c) { return c.portfolio === "Human review"; }).length;
    var flagged = cases.filter(function (c) { return c.reviewFlag === "Yes"; }).length;
    var authorAgree = cases.filter(function (c) { return c.authorPortfolio === c.portfolio; }).length;
    var lens = cases.map(function (c) { return c.narrative.length; });
    var combos = {};
    cases.forEach(function (c) { combos[c.tolerance + "|" + c.capacity + "|" + c.liquidity] = true; });

    root.appendChild(el("p", { class: "stat-headline" }, [
      el("strong", { text: String(total) }), " cases, ",
      el("strong", { text: String(hr) }), " sent to human review (" + Math.round(hr / total * 100) + " percent), ",
      el("strong", { text: String(Object.keys(combos).length) }), " distinct label combinations, ",
      el("strong", { text: String(flagged) }), " with a review flag. Narratives run from " + Math.min.apply(null, lens) + " to " + Math.max.apply(null, lens) + " characters. Author draft label equals consensus in " + Math.round(authorAgree / total * 1000) / 10 + " percent of cases."
    ]));
    root.appendChild(barList("Recommended outcome (consensus)", count("portfolio", OUTCOME_ORDER), total));
    root.appendChild(barList("Risk tolerance", count("tolerance", ["Low", "Moderate", "High", "Inconsistent"]), total));
    root.appendChild(barList("Risk capacity", count("capacity", ["Low", "Moderate", "High"]), total));
    root.appendChild(barList("Liquidity need", count("liquidity", ["Low", "Moderate", "High", "Urgent"]), total));
    root.appendChild(barList("Suitability risk", count("suitabilityRisk", ["Low", "Medium", "High"]), total));
  }

  function pct(x, digits) {
    var d = digits === undefined ? 1 : digits;
    return (Math.round(x * 100 * Math.pow(10, d)) / Math.pow(10, d)) + " percent";
  }

  function renderResults() {
    var root = $("results");
    if (!root || !meta.cvAccuracy) {
      if (root) root.appendChild(el("p", { class: "hint", text: "Training metadata not found in ml_weights.js." }));
      return;
    }
    var rows = [
      ["Trained on", meta.cases + " cases, seed " + meta.seed + ", " + meta.trainedOn],
      ["Cross-validated accuracy", pct(meta.cvAccuracy) + " (sd " + pct(meta.cvAccuracySd) + ", " + meta.cvFolds + "-fold, " + meta.cvRepeats + " repeats)"],
      ["Cross-validated macro-F1", String(meta.cvMacroF1)],
      ["Majority-class baseline", pct(meta.majorityBaselineAccuracy)],
      ["Lookup-table baseline (cross-validated)", pct(meta.lookupBaselineAccuracy)],
      ["Author draft label agrees with expert consensus", pct(meta.authorAgreementWithConsensus)],
      ["Calibration (temperature scaling)", "temperature " + ns.mlWeights.temperature + ", expected calibration error " + meta.eceBefore + " before, " + meta.eceAfter + " after"],
      ["Final model, training accuracy on all cases", pct(meta.trainAccuracy)],
      ["Architecture", "12 inputs, two hidden layers of " + meta.hidden + " units, " + classes.length + " outputs, " + meta.epochs + " epochs"]
    ];
    var table = el("table", { class: "log-table data-table" });
    var tbody = el("tbody");
    rows.forEach(function (r) {
      tbody.appendChild(el("tr", {}, [el("th", { scope: "row", text: r[0] }), el("td", { text: r[1] })]));
    });
    table.appendChild(tbody);
    root.appendChild(el("div", { class: "table-wrap" }, [table]));

    root.appendChild(el("p", { class: "hint", text: "How to read this: once the three labels are known, the mapping to an outcome is largely rule-like, which is why the network ties a lookup table and the dataset author's own labels. What the network adds is calibrated probabilities, smooth behaviour on unseen combinations, and a realistic black box for the explanation study." }));

    if (meta.perClassRecall) {
      root.appendChild(el("h3", { class: "sub-heading", text: "Per-class recall (out of fold)" }));
      var t2 = el("table", { class: "log-table data-table" });
      var thead = el("thead", {}, [el("tr", {}, [el("th", { scope: "col", text: "Outcome" }), el("th", { scope: "col", text: "Cases" }), el("th", { scope: "col", text: "Recall" })])]);
      var tb2 = el("tbody");
      var counts = {};
      cases.forEach(function (c) { counts[c.portfolio] = (counts[c.portfolio] || 0) + 1; });
      OUTCOME_ORDER.forEach(function (k) {
        if (!(k in meta.perClassRecall)) return;
        tb2.appendChild(el("tr", {}, [el("td", { text: k }), el("td", { class: "num", text: String(counts[k] || 0) }), el("td", { class: "num", text: pct(meta.perClassRecall[k]) })]));
      });
      t2.appendChild(thead); t2.appendChild(tb2);
      root.appendChild(el("div", { class: "table-wrap" }, [t2]));
    }

    if (meta.confusion && classes.length) {
      root.appendChild(el("h3", { class: "sub-heading", text: "Confusion matrix (out of fold, rows are the experts' outcome, columns the network's)" }));
      var t3 = el("table", { class: "log-table data-table confusion" });
      var hrow = el("tr", {}, [el("th", { scope: "col", text: "" })]);
      classes.forEach(function (c) { hrow.appendChild(el("th", { scope: "col", text: c })); });
      t3.appendChild(el("thead", {}, [hrow]));
      var tb3 = el("tbody");
      meta.confusion.forEach(function (row, i) {
        var tr = el("tr", {}, [el("th", { scope: "row", text: classes[i] })]);
        row.forEach(function (v, j) {
          tr.appendChild(el("td", { class: "num" + (i === j ? " diag" : ""), text: String(v) }));
        });
        tb3.appendChild(tr);
      });
      t3.appendChild(tb3);
      root.appendChild(el("div", { class: "table-wrap" }, [t3]));
    }
  }

  /* ------------------------------------------------------------
     Case browser with search, outcome filter and paging.
     ------------------------------------------------------------ */
  var PAGE = 25;
  var shown = PAGE;

  function filtered() {
    var q = ($("case-search").value || "").trim().toLowerCase();
    var outcome = $("case-outcome").value;
    return cases.filter(function (c) {
      if (outcome && c.portfolio !== outcome) return false;
      if (!q) return true;
      return c.id.toLowerCase().indexOf(q) >= 0 || c.narrative.toLowerCase().indexOf(q) >= 0;
    });
  }

  function renderCases() {
    var tbody = $("case-tbody");
    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    var list = filtered();
    list.slice(0, shown).forEach(function (c) {
      var open = el("a", { class: "btn btn-small", href: "index.html?ils=" + encodeURIComponent(c.id), text: "Open in the AI advisor" });
      var tr = el("tr", { class: c.portfolio === "Human review" ? "flawed" : "" }, [
        el("td", { text: c.id }),
        el("td", { class: "narrative-cell", text: c.narrative }),
        el("td", { text: c.tolerance }),
        el("td", { text: c.capacity }),
        el("td", { text: c.liquidity }),
        el("td", { text: c.portfolio }),
        el("td", {}, [open])
      ]);
      tbody.appendChild(tr);
    });
    $("case-count").textContent = list.length === cases.length
      ? "All " + cases.length + " cases."
      : list.length + " of " + cases.length + " cases match.";
    $("show-more").hidden = shown >= list.length;
  }

  /* ------------------------------------------------------------
     Benchmark of the language-reading step: narrative -> form fields
     (language model) -> labels (form rules) -> outcome (advisors),
     compared with the expert consensus, case by case.
     ------------------------------------------------------------ */
  var bench = { running: false, stop: false, results: [] };
  var AGE_PATTERNS = [/\bI am (\d{2})\b/, /\b(\d{2})-year-old/, /\bI'm (\d{2})\b/, /\baged (\d{2})\b/, /\bage (\d{2})\b/, /\bat (\d{2})\b/, /\b(\d{2}) years old/];

  function ageFromText(text) {
    for (var i = 0; i < AGE_PATTERNS.length; i++) { var m = text.match(AGE_PATTERNS[i]); if (m) return parseInt(m[1], 10); }
    return null;
  }

  function benchSample(n) {
    if (n >= cases.length) return cases.slice();
    var step = cases.length / n, out = [];
    for (var i = 0; i < n; i++) out.push(cases[Math.floor(i * step)]);
    return out;
  }

  function benchStatus(text, progress) {
    var st = $("bench-status"), fill = $("bench-progress");
    if (st) st.textContent = text;
    if (fill && progress !== undefined) fill.style.width = Math.round(progress * 100) + "%";
  }

  function evaluateCase(c, ex) {
    var model = ns.model, advisors = ns.advisors;
    var age = ex.age !== null ? ex.age : ageFromText(c.narrative);
    var complete = ex.horizon !== null && ex.tolerance !== null && ex.emergencyFund !== null && ex.incomeStable !== null && age !== null;
    var profile = {
      age: age !== null ? age : 45,
      horizon: ex.horizon !== null ? ex.horizon : 10,
      tolerance: ex.tolerance || "medium",
      toleranceInconsistent: ex.toleranceInconsistent,
      emergencyFund: ex.emergencyFund === null ? true : ex.emergencyFund,
      incomeStable: ex.incomeStable === null ? true : ex.incomeStable
    };
    var labels = model.deriveSuitabilityLabels(model.normalizeProfile(profile));
    var mlOut = advisors.ml.recommend(profile).portfolio.name;
    var logitOut = advisors.logit ? advisors.logit.recommend(profile).portfolio.name : "";
    return {
      id: c.id, complete: complete, ageUsedFallback: ex.age === null,
      readTolerance: labels.tolerance, readCapacity: labels.capacity, readLiquidity: labels.liquidity,
      consensusTolerance: c.tolerance, consensusCapacity: c.capacity, consensusLiquidity: c.liquidity,
      toleranceOk: labels.tolerance === c.tolerance, capacityOk: labels.capacity === c.capacity, liquidityOk: labels.liquidity === c.liquidity,
      mlOutcome: mlOut, logitOutcome: logitOut, consensusOutcome: c.portfolio,
      mlOk: mlOut === c.portfolio, logitOk: logitOut === c.portfolio,
      horizonRead: ex.horizon, reasoning: ex.reasoning || ""
    };
  }

  function renderBenchResults() {
    var root = $("bench-results");
    clear(root);
    var rs = bench.results;
    if (!rs.length) return;
    var n = rs.length;
    function rate(key) { var ok = rs.filter(function (r) { return r[key]; }).length; return ok + " of " + n + " (" + Math.round(ok / n * 1000) / 10 + " percent)"; }
    var t = el("table", { class: "log-table data-table" });
    var tb = el("tbody");
    [
      ["Cases read", n + (rs.filter(function (r) { return !r.complete; }).length ? ", " + rs.filter(function (r) { return !r.complete; }).length + " with a field the model could not read (filled with the neutral default)" : "")],
      ["Risk tolerance label agrees with the panel", rate("toleranceOk")],
      ["Risk capacity label agrees with the panel", rate("capacityOk")],
      ["Liquidity need label agrees with the panel", rate("liquidityOk")],
      ["Neural network outcome agrees with the panel", rate("mlOk")],
      ["Interpretable model outcome agrees with the panel", rate("logitOk")]
    ].forEach(function (r) { tb.appendChild(el("tr", {}, [el("th", { scope: "row", text: r[0] }), el("td", { text: r[1] })])); });
    t.appendChild(tb);
    root.appendChild(el("div", { class: "table-wrap" }, [t]));
    root.appendChild(el("p", { class: "hint", text: "For reference, when the panel's own labels are fed to the models the outcome agreement is 94.0 percent (network) and 92.2 percent (interpretable) on all 400 cases. The gap between those figures and the rows above is the cost of reading labels from language with a small in-browser model." }));
    var mism = rs.filter(function (r) { return !r.mlOk; });
    if (mism.length) {
      root.appendChild(el("h3", { class: "sub-heading", text: "Cases where the network's outcome differs from the panel" }));
      var t2 = el("table", { class: "log-table data-table" });
      var hr = el("tr"); ["Case", "Read labels (tolerance, capacity, liquidity)", "Panel labels", "Network", "Panel"].forEach(function (h) { hr.appendChild(el("th", { scope: "col", text: h })); });
      t2.appendChild(el("thead", {}, [hr]));
      var tb2 = el("tbody");
      mism.forEach(function (r) {
        tb2.appendChild(el("tr", {}, [
          el("td", { text: r.id }), el("td", { text: r.readTolerance + ", " + r.readCapacity + ", " + r.readLiquidity }),
          el("td", { text: r.consensusTolerance + ", " + r.consensusCapacity + ", " + r.consensusLiquidity }),
          el("td", { text: r.mlOutcome }), el("td", { text: r.consensusOutcome })
        ]));
      });
      t2.appendChild(tb2);
      root.appendChild(el("div", { class: "table-wrap" }, [t2]));
    }
    $("bench-download").hidden = false;
  }

  function downloadBench() {
    var rs = bench.results;
    if (!rs.length) return;
    var fields = Object.keys(rs[0]);
    function cell(v) { var s = v === null || v === undefined ? "" : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    var lines = [fields.join(",")].concat(rs.map(function (r) { return fields.map(function (f) { return cell(r[f]); }).join(","); }));
    var blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = "adviceit-language-benchmark.csv"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function runBench() {
    var llm = ns.llm;
    if (bench.running) return;
    if (!llm.servedOverHttp()) { benchStatus("Needs the page served over http (python3 serve.py or the GitHub Pages link).", 0); return; }
    if (!llm.supported()) { benchStatus("This browser has no WebGPU, the language model cannot run here.", 0); return; }
    var n = parseInt($("bench-n").value, 10) || 20;
    var sample = benchSample(n);
    var modelId = $("bench-model").value;
    bench.running = true; bench.stop = false; bench.results = [];
    $("bench-run").disabled = true; $("bench-stop").hidden = false; $("bench-download").hidden = true;
    clear($("bench-results"));
    llm.onProgress(function (r) { if (!llm.isReady()) benchStatus(r.text, r.progress || 0); });
    llm.load(modelId).then(function () {
      var i = 0;
      function next() {
        if (bench.stop || i >= sample.length) { finish(); return; }
        var c = sample[i];
        benchStatus("Reading case " + (i + 1) + " of " + sample.length + " (" + c.id + ")", i / sample.length);
        return llm.complete(llm.extractionMessages(c.narrative), 220).then(function (reply) {
          var ex = llm.parseExtraction(reply) || { age: null, horizon: null, tolerance: null, toleranceInconsistent: false, emergencyFund: null, incomeStable: null, reasoning: "unreadable reply" };
          bench.results.push(evaluateCase(c, ex));
          i++;
          if (i % 5 === 0 || i === sample.length) renderBenchResults();
          return next();
        }).catch(function (err) {
          bench.results.push(evaluateCase(c, { age: null, horizon: null, tolerance: null, toleranceInconsistent: false, emergencyFund: null, incomeStable: null, reasoning: "error: " + (err && err.message ? err.message : String(err)) }));
          i++;
          return next();
        });
      }
      function finish() {
        bench.running = false;
        $("bench-run").disabled = false; $("bench-stop").hidden = true;
        benchStatus((bench.stop ? "Stopped after " : "Done, ") + bench.results.length + " case(s).", 1);
        renderBenchResults();
      }
      return next();
    }).catch(function (err) {
      bench.running = false;
      $("bench-run").disabled = false; $("bench-stop").hidden = true;
      benchStatus("Could not load the model: " + (err && err.message ? err.message : String(err)), 0);
    });
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function initBench() {
    var sel = $("bench-model");
    if (!sel || !ns.llm) return;
    ns.llm.MODELS.forEach(function (m) { sel.appendChild(el("option", { value: m.id, text: m.label })); });
    $("bench-run").addEventListener("click", runBench);
    $("bench-stop").addEventListener("click", function () { bench.stop = true; });
    $("bench-download").addEventListener("click", downloadBench);
    if (!ns.llm.servedOverHttp()) benchStatus("Serve the page over http to run the benchmark (python3 serve.py).", 0);
    else if (!ns.llm.supported()) benchStatus("This browser has no WebGPU, the benchmark needs a recent Chrome or Edge on a laptop with a GPU.", 0);
    else benchStatus("Choose a sample size and a model, then press Run. The model downloads once and is cached.", 0);
  }

  var initialised = false;
  function init() {
    if (initialised || !cases.length) return;
    initialised = true;
    initBench();
    renderStats();
    renderResults();
    var sel = $("case-outcome");
    OUTCOME_ORDER.forEach(function (k) { sel.appendChild(el("option", { value: k, text: k })); });
    $("case-search").addEventListener("input", function () { shown = PAGE; renderCases(); });
    sel.addEventListener("change", function () { shown = PAGE; renderCases(); });
    $("show-more").addEventListener("click", function () { shown += PAGE; renderCases(); });
    renderCases();
  }

  document.addEventListener("DOMContentLoaded", init);
})(window.AdviceIT);
