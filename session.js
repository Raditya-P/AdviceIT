/*
  AdviceIT by Radit, session.js
  ---------------------------------------------------------------
  The session log: the data-collection side of the instrument.

  - Every submitted response becomes one row (see FIELDS).
  - Rows are kept in memory and mirrored to localStorage so an
    accidental reload does not lose them. Nothing leaves the browser.
  - CSV and JSON exports are generated client-side with a Blob.
*/

window.AdviceIT = window.AdviceIT || {};

(function (ns) {
  "use strict";

  var STORAGE_KEY = "adviceit-session-v1";

  /* Column order for the CSV export and the on-screen table. */
  var FIELDS = [
    "timestamp",
    "participantId",
    "mode",
    "condition",
    "advisorModel",
    "scenario",
    "age",
    "horizon",
    "tolerance",
    "emergencyFund",
    "incomeStable",
    "knowledge",
    "toleranceInconsistent",
    "suitabilityTolerance",
    "suitabilityCapacity",
    "suitabilityLiquidity",
    "narrativeUsed",
    "ilsCaseId",
    "recommendedPortfolio",
    "soundPortfolio",
    "score",
    "margin",
    "confidence",
    "trustRating",
    "decision",
    "adjustedTo",
    "adjustSteps",
    "understanding",
    "decisionConfidence",
    "mentalDemand",
    "reason",
    "literacyScore",
    "literacyAnswers",
    "literacyLevel",
    "explanationContent",
    "explanationForm",
    "whatIfMoves",
    "whyNotAsked",
    "adaptiveVariant",
    "flow",
    "trialIndex",
    "trialProfileId",
    "attentionCheck",
    "decisionTimeMs",
    "llmModel",
    "llmExplanation",
    "llmTurns"
  ];

  var rows = [];

  function load() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) rows = JSON.parse(stored) || [];
    } catch (e) {
      rows = [];
    }
    return rows;
  }

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (e) {
      // localStorage may be unavailable (private mode, file:// in some browsers). Ignore.
    }
  }

  function add(row) {
    rows.push(row);
    persist();
    return rows;
  }

  function clear() {
    rows = [];
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    return rows;
  }

  function all() {
    return rows.slice();
  }

  /* CSV escaping: wrap in quotes when needed and double inner quotes. */
  function csvCell(value) {
    if (value === null || value === undefined) return "";
    var s = String(value);
    if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCSV() {
    var lines = [FIELDS.join(",")];
    rows.forEach(function (r) {
      lines.push(FIELDS.map(function (f) { return csvCell(r[f]); }).join(","));
    });
    return lines.join("\r\n") + "\r\n";
  }

  function toJSON() {
    return JSON.stringify({
      instrument: "AdviceIT by Radit",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      fields: FIELDS,
      rows: rows
    }, null, 2);
  }

  /* Trigger a client-side download. No server is involved. */
  function download(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function stamp() {
    var d = new Date();
    function two(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + two(d.getMonth() + 1) + two(d.getDate()) + "-" + two(d.getHours()) + two(d.getMinutes());
  }

  function downloadCSV() {
    download("adviceit-session-" + stamp() + ".csv", toCSV(), "text/csv;charset=utf-8");
  }

  function downloadJSON() {
    download("adviceit-session-" + stamp() + ".json", toJSON(), "application/json;charset=utf-8");
  }

  /* Short random participant ID, e.g. P-K7Q2. Used only when the URL
     does not provide one. */
  function randomParticipantId() {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var id = "P-";
    for (var i = 0; i < 4; i++) id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    return id;
  }

  ns.session = {
    FIELDS: FIELDS,
    load: load,
    add: add,
    clear: clear,
    all: all,
    toCSV: toCSV,
    toJSON: toJSON,
    downloadCSV: downloadCSV,
    downloadJSON: downloadJSON,
    randomParticipantId: randomParticipantId
  };
})(window.AdviceIT);
