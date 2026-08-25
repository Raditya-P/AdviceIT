/*
  AdviceIT by Radit, analytics.js
  ---------------------------------------------------------------
  Researcher analytics over collected responses. Sources, merged and
  de-duplicated by (participantId, timestamp):
    1. the session log in this browser's localStorage (session.js)
    2. the study server, GET api/responses.json, when the page is served
       by serve.py
    3. a JSON export loaded by the researcher (the app's export format
       {rows: [...]} or the server format {rows: [...]})
  Everything is descriptive: counts, rates, means, medians. No inference.
*/

(function (ns) {
  "use strict";

  var session = ns.session;
  var CONDITIONS = ["none", "feature", "counterfactual", "confidence", "hybrid", "interactive", "adaptive", "llm", "custom"];
  var LABELS = { none: "No explanation", feature: "Why (feature-based)", counterfactual: "What would change it", confidence: "How sure", hybrid: "All three (hybrid)", interactive: "Interactive what-if", adaptive: "Adaptive to literacy", llm: "Conversational", custom: "Custom" };
  var ADVISORS = { ml: "Neural network", logit: "Interpretable rule-based" };
  var OVERRIDES = { adjust: true, reject: true, "ask-human": true };

  var sources = { local: [], server: [], file: [] };

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (typeof c === "string") node.appendChild(document.createTextNode(c)); else if (c) node.appendChild(c); });
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function allRows() {
    var seen = {}, out = [];
    [sources.local, sources.server, sources.file].forEach(function (list) {
      list.forEach(function (r) {
        var key = (r.participantId || "") + "|" + (r.timestamp || "");
        if (seen[key]) return;
        seen[key] = true;
        out.push(r);
      });
    });
    return out;
  }

  function filteredRows() {
    var advisor = $("an-advisor").value, flow = $("an-flow").value, excl = $("an-exclude-researcher").checked;
    return allRows().filter(function (r) {
      if (advisor && r.advisorModel !== advisor) return false;
      if (flow && (r.flow || "single") !== flow) return false;
      if (excl && r.mode === "researcher") return false;
      return true;
    });
  }

  function mean(list) { var v = list.filter(function (x) { return typeof x === "number" && !isNaN(x); }); return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null; }
  function median(list) { var v = list.filter(function (x) { return typeof x === "number" && !isNaN(x); }).sort(function (a, b) { return a - b; }); if (!v.length) return null; var m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; }
  function fmt(x, d) { return x === null || x === undefined ? "" : (Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toString(); }
  function pct(num, den) { return den ? Math.round(num / den * 1000) / 10 + "%" : ""; }
  function num(v) { var n = Number(v); return v === "" || v === null || v === undefined || isNaN(n) ? NaN : n; }

  function table(headers, rows, caption) {
    var t = el("table", { class: "log-table data-table" });
    if (caption) t.appendChild(el("caption", { class: "hint", text: caption }));
    var tr = el("tr");
    headers.forEach(function (h) { tr.appendChild(el("th", { scope: "col", text: h })); });
    t.appendChild(el("thead", {}, [tr]));
    var tb = el("tbody");
    rows.forEach(function (r) {
      var row = el("tr");
      r.forEach(function (c, i) { row.appendChild(el(i === 0 ? "th" : "td", i === 0 ? { scope: "row", text: String(c) } : { class: "num", text: String(c) })); });
      tb.appendChild(row);
    });
    t.appendChild(tb);
    return el("div", { class: "table-wrap" }, [t]);
  }

  function barList(title, items) {
    var wrap = el("div", { class: "stat-block" });
    wrap.appendChild(el("h3", { class: "sub-heading", text: title }));
    var ul = el("ul", { class: "stat-list" });
    var max = items.reduce(function (m, it) { return Math.max(m, it.n); }, 0);
    items.forEach(function (it) {
      var fill = el("span", { class: "stat-fill", "aria-hidden": "true" });
      fill.style.width = (max ? it.n / max * 100 : 0) + "%";
      ul.appendChild(el("li", { class: "stat-item" }, [el("span", { class: "stat-label", text: it.key }), el("span", { class: "stat-bar", "aria-hidden": "true" }, [fill]), el("span", { class: "stat-value", text: it.text || String(it.n) })]));
    });
    wrap.appendChild(ul);
    return wrap;
  }

  function renderSources() {
    var node = $("an-sources");
    clear(node);
    node.appendChild(el("p", { class: "hint", text: "Sources: " + sources.local.length + " row(s) in this browser, " + sources.server.length + " from the study server, " + sources.file.length + " from a loaded file. " + allRows().length + " unique responses in total." }));
  }

  function renderOverview(rows) {
    var root = $("an-overview"); clear(root);
    if (!rows.length) { root.appendChild(el("p", { class: "hint", text: "No responses match. Submit a few responses on the advisor pages, run the study flow, or load an export." })); return; }
    var participants = {}; rows.forEach(function (r) { participants[r.participantId] = true; });
    root.appendChild(el("p", { class: "stat-headline" }, [el("strong", { text: String(rows.length) }), " responses from ", el("strong", { text: String(Object.keys(participants).length) }), " participant ID(s)."]));
    var byCond = CONDITIONS.map(function (c) { return { key: LABELS[c], n: rows.filter(function (r) { return r.condition === c; }).length }; }).filter(function (it) { return it.n; });
    var byAdv = Object.keys(ADVISORS).map(function (a) { return { key: ADVISORS[a], n: rows.filter(function (r) { return r.advisorModel === a; }).length }; }).filter(function (it) { return it.n; });
    var byScen = ["sound", "flawed"].map(function (s) { return { key: s, n: rows.filter(function (r) { return r.scenario === s; }).length }; });
    var grid = el("div", { class: "columns data-columns" });
    grid.appendChild(el("div", {}, [barList("Responses per condition", byCond)]));
    grid.appendChild(el("div", {}, [barList("Responses per advisor", byAdv), barList("Sound versus flawed", byScen)]));
    root.appendChild(grid);
  }

  function renderReliance(rows) {
    var root = $("an-reliance"); clear(root);
    if (!rows.length) return;
    var out = [];
    CONDITIONS.concat(["all"]).forEach(function (c) {
      var rs = c === "all" ? rows : rows.filter(function (r) { return r.condition === c; });
      if (!rs.length) return;
      var sound = rs.filter(function (r) { return r.scenario === "sound"; });
      var flawed = rs.filter(function (r) { return r.scenario === "flawed"; });
      var followSound = sound.filter(function (r) { return r.decision === "follow"; }).length;
      var overrideFlawed = flawed.filter(function (r) { return OVERRIDES[r.decision]; }).length;
      var overRel = flawed.filter(function (r) { return r.decision === "follow"; }).length;
      var underRel = sound.filter(function (r) { return OVERRIDES[r.decision]; }).length;
      var askHuman = rs.filter(function (r) { return r.decision === "ask-human"; }).length;
      out.push([c === "all" ? "All conditions" : LABELS[c], rs.length, sound.length, pct(followSound, sound.length), flawed.length, pct(overrideFlawed, flawed.length), pct(followSound + overrideFlawed, sound.length + flawed.length), pct(overRel, flawed.length), pct(underRel, sound.length), pct(askHuman, rs.length)]);
    });
    root.appendChild(table(["Condition", "n", "sound n", "follow on sound", "flawed n", "override on flawed", "appropriate reliance", "over-reliance", "under-reliance", "asked a human"], out));
  }

  function renderMeasures(rows) {
    var root = $("an-measures"); clear(root);
    if (!rows.length) return;
    var out = [];
    CONDITIONS.forEach(function (c) {
      ["sound", "flawed"].forEach(function (s) {
        var rs = rows.filter(function (r) { return r.condition === c && r.scenario === s; });
        if (!rs.length) return;
        out.push([LABELS[c] + ", " + s, rs.length,
          fmt(mean(rs.map(function (r) { return num(r.trustRating); })), 2),
          fmt(median(rs.map(function (r) { return num(r.decisionTimeMs) / 1000; })), 1),
          fmt(mean(rs.map(function (r) { return num(r.understanding); })), 2),
          fmt(mean(rs.map(function (r) { return num(r.decisionConfidence); })), 2),
          fmt(mean(rs.map(function (r) { return num(r.mentalDemand); })), 2)]);
      });
    });
    root.appendChild(table(["Condition, scenario", "n", "trust (1 to 7)", "decision time (s, median)", "understanding", "decision confidence", "mental demand"], out));
    var inter = rows.filter(function (r) { return r.explanationForm === "interactive" || r.condition === "interactive"; });
    if (inter.length) root.appendChild(el("p", { class: "hint", text: "Interactive condition: mean what-if moves " + fmt(mean(inter.map(function (r) { return num(r.whatIfMoves); })), 1) + ", mean why-not questions " + fmt(mean(inter.map(function (r) { return num(r.whyNotAsked); })), 1) + "." }));
    var llmRows = rows.filter(function (r) { return r.explanationForm === "llm" || r.condition === "llm"; });
    if (llmRows.length) root.appendChild(el("p", { class: "hint", text: "Conversational condition: mean follow-up turns " + fmt(mean(llmRows.map(function (r) { return num(r.llmTurns); })), 1) + ". Explanations are logged verbatim for auditing." }));
  }

  function renderQuality(rows) {
    var root = $("an-quality"); clear(root);
    if (!rows.length) return;
    var att = rows.filter(function (r) { return r.attentionCheck; });
    var passed = att.filter(function (r) { return r.attentionCheck === "passed"; }).length;
    var lit = rows.filter(function (r) { return r.literacyScore !== "" && r.literacyScore !== undefined && r.literacyScore !== null; });
    var byLit = [0, 1, 2, 3].map(function (k) { return { key: k + " of 3 correct", n: lit.filter(function (r) { return num(r.literacyScore) === k; }).length }; });
    var byLevel = ["low", "high"].map(function (l) {
      var rs = rows.filter(function (r) { return r.literacyLevel === l; });
      var sound = rs.filter(function (r) { return r.scenario === "sound"; }), flawed = rs.filter(function (r) { return r.scenario === "flawed"; });
      var ok = sound.filter(function (r) { return r.decision === "follow"; }).length + flawed.filter(function (r) { return OVERRIDES[r.decision]; }).length;
      return [l + " literacy", rs.length, pct(ok, rs.length), fmt(mean(rs.map(function (r) { return num(r.trustRating); })), 2)];
    });
    root.appendChild(el("p", { class: "stat-headline", text: "Attention checks: " + passed + " passed of " + att.length + " (" + pct(passed, att.length) + "). Rows with a literacy score: " + lit.length + " of " + rows.length + "." }));
    var grid = el("div", { class: "columns data-columns" });
    grid.appendChild(el("div", {}, [barList("Financial literacy score", byLit)]));
    grid.appendChild(el("div", {}, [el("h3", { class: "sub-heading", text: "Appropriate reliance by literacy level" }), table(["Level", "n", "appropriate reliance", "trust"], byLevel)]));
    root.appendChild(grid);
    var adaptive = rows.filter(function (r) { return r.explanationForm === "adaptive" || r.condition === "adaptive"; });
    if (adaptive.length) {
      var plain = adaptive.filter(function (r) { return r.adaptiveVariant === "plain"; }).length;
      root.appendChild(el("p", { class: "hint", text: "Adaptive condition: " + plain + " plain and " + (adaptive.length - plain) + " detailed variants shown." }));
    }
  }

  function render() {
    renderSources();
    var rows = filteredRows();
    renderOverview(rows);
    renderReliance(rows);
    renderMeasures(rows);
    renderQuality(rows);
  }

  function loadLocal() { sources.local = session.load().slice(); }

  function loadServer() {
    if (!/^https?:$/.test(window.location.protocol) || typeof window.fetch !== "function") return Promise.resolve();
    return window.fetch("api/responses.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
      sources.server = data && data.rows ? data.rows : [];
    }).catch(function () { sources.server = []; });
  }

  function loadFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        sources.file = Array.isArray(data) ? data : (data.rows || []);
      } catch (e) { sources.file = []; }
      render();
    };
    reader.readAsText(file);
  }

  function downloadCombined() {
    var rows = allRows();
    var fields = session.FIELDS;
    function cell(v) { if (v === null || v === undefined) return ""; var s = String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    var lines = [fields.join(",")].concat(rows.map(function (r) { return fields.map(function (f) { return cell(r[f]); }).join(","); }));
    var blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = "adviceit-combined.csv"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  var initialised = false;
  function init() {
    if (initialised) return;
    initialised = true;
    loadLocal();
    loadServer().then(render);
    render();
    $("an-refresh").addEventListener("click", function () { loadLocal(); loadServer().then(render); });
    $("an-download").addEventListener("click", downloadCombined);
    $("an-file").addEventListener("change", function () { if (this.files && this.files[0]) loadFile(this.files[0]); });
    ["an-advisor", "an-flow", "an-exclude-researcher"].forEach(function (id) { $(id).addEventListener("change", render); });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window.AdviceIT);
