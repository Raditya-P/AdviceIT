/* The resumable session store.

   A participant who leaves half way through has to come back into the same
   condition, at the same point, and lose nothing. These checks cover what
   would silently break that: a stale session resuming after the deadline, a
   corrupted or older record being trusted, the snapshot changing identity
   between reads (which would put React into a re-render loop), and a
   finished session leaving anything behind. */

import { clearSession, loadSession, saveSession, sessionSnapshot, SESSION_TTL_MS, type SavedSession } from "@/lib/session";

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

const base = (over: Partial<SavedSession> = {}): SavedSession => ({
  v: 1,
  pid: "P-ABC123",
  advisorId: "ml",
  condition: "hybrid",
  content: ["feature", "counterfactual", "confidence"],
  form: "static",
  modality: "visual",
  assignedBy: "random",
  stage: "trial",
  litAnswers: { q1: "more" },
  pcAnswers: { nfc1: 4 },
  trialIdx: 4,
  perception: {},
  exit1: "",
  exit2: "",
  startedAt: new Date(Date.now() - 60_000).toISOString(),
  updatedAt: new Date().toISOString(),
  resumes: 0,
  ...over,
});

/* A round trip keeps every field the flow needs to restore itself. */
store = {};
saveSession(base());
const back = loadSession();
ok("round trip returns a session", back !== null);
ok("participant id survives", back?.pid === "P-ABC123");
ok("condition survives", back?.condition === "hybrid");
ok("advisor survives", back?.advisorId === "ml");
ok("stage survives", back?.stage === "trial");
ok("cases done survives", back?.trialIdx === 4);
ok("literacy answers survive", back?.litAnswers.q1 === "more");
ok("characteristics survive", back?.pcAnswers.nfc1 === 4);

/* The snapshot React reads must keep the same identity across reads, or
   useSyncExternalStore re-renders forever. It is read once per page load, so
   these two run before the rejection paths below, which reset it on the way
   out. */
store = {};
saveSession(base());
const a = sessionSnapshot();
const b = sessionSnapshot();
ok("snapshot identity is stable", a !== null && a === b);

/* Finishing clears the record and the snapshot together, so a new session
   started in the same page load does not pick the old one up. */
clearSession();
ok("clearing empties storage", Object.keys(store).length === 0);
ok("clearing resets the snapshot", sessionSnapshot() === null);

/* A session older than the deadline is not resumed, and is removed rather
   than left sitting in the browser. */
store = {};
saveSession(base({ updatedAt: new Date(Date.now() - SESSION_TTL_MS - 1000).toISOString() }));
ok("expired session is not resumed", loadSession() === null);
ok("expired session is erased", Object.keys(store).length === 0);

/* One inside the deadline still is. */
store = {};
saveSession(base({ updatedAt: new Date(Date.now() - SESSION_TTL_MS + 60_000).toISOString() }));
ok("session inside the deadline resumes", loadSession() !== null);

/* Anything unreadable, from a future version, or with a stage this build
   does not know, is dropped instead of half applied. */
for (const [name, raw] of [
  ["corrupt JSON", "{not json"],
  ["another version", JSON.stringify(base({ v: 2 as unknown as 1 }))],
  ["unknown stage", JSON.stringify(base({ stage: "debrief" as SavedSession["stage"] }))],
  ["no participant id", JSON.stringify({ ...base(), pid: 7 })],
] as const) {
  store = { "adviceit-web-session-v1": raw };
  ok(`${name} is rejected`, loadSession() === null);
  ok(`${name} is erased`, Object.keys(store).length === 0);
}

/* Nothing saved means nothing to resume. */
store = {};
ok("empty storage resumes nothing", loadSession() === null);

console.log(failures === 0 ? "\nALL SESSION CHECKS PASSED" : `\n${failures} SESSION CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
