/* The response buffer. A row that cannot reach the collector waits in this
   browser and goes out with the next submit, so the checks cover what would
   lose data without anyone noticing: a backlog too large to be accepted,
   a refused batch blocking everything behind it, and a server error
   throwing away rows that should have been kept. The collector is faked;
   it accepts or refuses whole batches the way the real one does. */

import { MAX_BODY_BYTES, MAX_ROWS_PER_POST, cleanParticipantId, submitRow, type StudyRow } from "@/lib/records";

let store: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
  clear: () => {
    store = {};
  },
  key: () => null,
  length: 0,
} as Storage;

let failures = 0;
function ok(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`ok   ${name}`);
  else {
    failures++;
    console.log(`FAIL ${name} ${detail}`);
  }
}

/* The fake collector: "up" stores, "down" throws like a lost connection,
   a number answers with that status. It records every batch it is sent. */
let mode: "up" | "down" | number = "up";
let refuseParticipant = "";
const batches: StudyRow[][] = [];
const stored: StudyRow[] = [];
globalThis.fetch = (async (_url: unknown, init?: { body?: string }) => {
  if (mode === "down") throw new TypeError("network down");
  const body = String(init?.body ?? "");
  const rows = (JSON.parse(body) as { rows: StudyRow[] }).rows;
  batches.push(rows);
  if (typeof mode === "number") return new Response("{}", { status: mode });
  if (rows.length > MAX_ROWS_PER_POST || new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
    return new Response("{}", { status: rows.length > MAX_ROWS_PER_POST ? 400 : 413 });
  }
  if (rows.every((r) => r.participantId === refuseParticipant)) return new Response("{}", { status: 400 });
  stored.push(...rows.filter((r) => r.participantId !== refuseParticipant));
  return new Response("{}", { status: 200 });
}) as typeof fetch;

let n = 0;
const row = (over: Partial<StudyRow> = {}): StudyRow => ({
  rowType: "trial",
  timestamp: new Date(Date.UTC(2026, 9, 1, 10, 0, n++)).toISOString(),
  participantId: "P-ABC123",
  condition: "hybrid",
  explanationContent: "feature+counterfactual+confidence",
  explanationForm: "static",
  assignedBy: "random",
  advisorModel: "ml",
  advisorAssignedBy: "random",
  ...over,
});
const buffered = (): StudyRow[] => JSON.parse(store["adviceit-web-buffer-v1"] ?? "[]");
const reset = () => {
  store = {};
  batches.length = 0;
  stored.length = 0;
  mode = "up";
  refuseParticipant = "";
};

async function main() {
  /* Offline: the row waits, and the caller is told so. */
  reset();
  mode = "down";
  ok("offline: reported as not stored", (await submitRow(row())) === false);
  ok("offline: the row waits in the buffer", buffered().length === 1);

  /* Back online: the waiting row goes out with the new one. */
  mode = "up";
  ok("online again: reported as stored", (await submitRow(row())) === true);
  ok("online again: both rows reach the server", stored.length === 2);
  ok("online again: the buffer is empty", buffered().length === 0);

  /* A long outage: 120 rows wait. The old client sent them in one request,
     which the collector refuses above 50, so nothing ever got through. */
  reset();
  mode = "down";
  for (let i = 0; i < 120; i++) await submitRow(row());
  mode = "up";
  await submitRow(row());
  ok("backlog: all 121 rows are stored", stored.length === 121, `${stored.length}`);
  ok("backlog: no request carries more than 50 rows", batches.every((b) => b.length <= MAX_ROWS_PER_POST));
  ok("backlog: the buffer is empty", buffered().length === 0);

  /* Rows with long free text are split by size as well as by count. */
  reset();
  mode = "down";
  const long = "x".repeat(7_000);
  for (let i = 0; i < 49; i++) await submitRow(row({ reason: long, llmExplanation: long }));
  mode = "up";
  await submitRow(row());
  ok("large rows: every request stays under the byte cap", batches.every((b) => new TextEncoder().encode(JSON.stringify({ rows: b })).length <= MAX_BODY_BYTES));
  ok("large rows: all 50 rows are stored", stored.length === 50, `${stored.length}`);

  /* A batch the collector refuses as invalid is dropped, so it cannot block
     the valid rows queued behind it. The collector stores the valid rows of
     a mixed batch, so the refusal needs a full batch of invalid ones. */
  reset();
  mode = "down";
  for (let i = 0; i < MAX_ROWS_PER_POST; i++) await submitRow(row({ participantId: "P BAD" }));
  mode = "up";
  refuseParticipant = "P BAD";
  await submitRow(row());
  ok("refused rows are dropped", buffered().length === 0);
  ok("the valid row behind them is stored", stored.length === 1 && stored[0].participantId === "P-ABC123");

  /* A server error keeps everything for the next submit. */
  reset();
  mode = 503;
  ok("server error: reported as not stored", (await submitRow(row())) === false);
  await submitRow(row());
  ok("server error: both rows are kept", buffered().length === 2);
  mode = 429;
  await submitRow(row());
  ok("rate limited: all three rows are kept", buffered().length === 3);

  /* Researcher-issued ids are cleaned to what the collector accepts. */
  ok("pid with a space is cleaned", cleanParticipantId("P 07") === "P07");
  ok("pid with punctuation is cleaned", cleanParticipantId("andi.s@x") === "andisx");
  ok("an unusable pid is dropped", cleanParticipantId(" .!") === undefined && cleanParticipantId(null) === undefined);
  ok("a long pid is cut to 40", cleanParticipantId("A".repeat(60))?.length === 40);

  console.log(failures ? `\n${failures} FAILURES` : "\nALL RECORDS CHECKS PASSED");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
