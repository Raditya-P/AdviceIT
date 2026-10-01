/* Study records: the row shape, and a submitter that POSTs to the API and
   falls back to localStorage when the network or the database is missing,
   flushing the buffer on the next successful submit. */

/* Limits shared with the collector (src/app/api/responses/route.ts), so the
   browser never builds a request the server is bound to refuse. */
export const MAX_ROWS_PER_POST = 50;
export const MAX_BODY_BYTES = 256_000;

/* The participant ids the collector accepts. A researcher-issued link
   (/study?pid=...) is cleaned against the same pattern before the session
   starts, because the server refuses every row with any other id. */
export const PARTICIPANT_ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;

export function cleanParticipantId(raw: string | null | undefined): string | undefined {
  const id = (raw ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  return id || undefined;
}

/* How the condition and advisor were decided. "balanced": the server put
   the participant in the least-filled cell. "simple": drawn in the browser,
   the fallback when the server could not answer, and every session before
   2.12.0. "url": the condition came with the link, a chosen card or a
   researcher-issued link. */
export type AssignmentMethod = "balanced" | "simple" | "url";

export interface StudyRow {
  rowType: "trial" | "exit" | "explore";
  timestamp: string;
  participantId: string;
  condition: string;
  explanationContent: string;
  explanationForm: string;
  explanationModality?: "visual" | "textual" | "hybrid";
  assignedBy: "random" | "chosen";
  assignmentMethod?: AssignmentMethod;
  advisorModel: "ml" | "logit";
  advisorAssignedBy: "random" | "chosen";
  language?: "en" | "id";
  scenario?: "sound" | "flawed";
  trialIndex?: number;
  trialProfileId?: string;
  age?: number;
  horizon?: number;
  tolerance?: string;
  toleranceInconsistent?: string;
  emergencyFund?: string;
  incomeStable?: string;
  debtObligations?: string;
  nearTermNeed?: string;
  knowledge?: string;
  suitabilityTolerance?: string;
  suitabilityCapacity?: string;
  suitabilityLiquidity?: string;
  recommendedPortfolio?: string;
  soundPortfolio?: string;
  score?: number;
  margin?: number;
  confidence?: string;
  trustRating?: number;
  decision?: string;
  adjustedTo?: string;
  adjustSteps?: number | "";
  understanding?: number;
  decisionConfidence?: number;
  mentalDemand?: number;
  reason?: string;
  literacyScore?: number | "";
  literacyAnswers?: string;
  literacyLevel?: string;
  /* Personal characteristics, collected once before the trials.
     nfcScore: six-item need for cognition, 1 to 5, reverse items flipped.
     easeOfSatisfaction: three-item scale, same range. */
  nfcScore?: number | "";
  nfcAnswers?: string;
  easeOfSatisfaction?: number | "";
  easeAnswers?: string;
  /* Explanation perception, collected once at the exit questionnaire. */
  percTrust?: number | "";
  percTransparency?: number | "";
  percPersuasiveness?: number | "";
  percUsefulness?: number | "";
  percSatisfaction?: number | "";
  whatIfMoves?: number | "";
  whyNotAsked?: number | "";
  adaptiveVariant?: string;
  attentionCheck?: string;
  decisionTimeMs?: number;
  llmModel?: string;
  llmExplanation?: string;
  llmTurns?: number | "";
  /* Conversational condition: how many turns were answered from the
     computation rather than by the model, which intents matched, and whether
     the model was available on this device at all. */
  llmRoutedTurns?: number | "";
  llmIntents?: string;
  llmModelAvailable?: string;
  exitDistrustMoment?: string;
  exitMissingExplanation?: string;
  userAgentMobile?: boolean;
  caseReadMs?: number;
  /* Session continuity: how many times the participant left the page and
     came back, and the wall clock time from consent to this row. Both are
     zero and short for an uninterrupted session. */
  sessionResumes?: number | "";
  sessionElapsedMs?: number | "";
  /* explore rows only: where the profile came from, and how many tries this
     visitor has submitted in this browser session */
  profileSource?: "form" | "example" | "ils-bench" | "narrative";
  tryIndex?: number;
}

const BUFFER_KEY = "adviceit-web-buffer-v1";

function readBuffer(): StudyRow[] {
  try {
    return JSON.parse(localStorage.getItem(BUFFER_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeBuffer(rows: StudyRow[]) {
  try {
    localStorage.setItem(BUFFER_KEY, JSON.stringify(rows));
  } catch {
    /* storage unavailable */
  }
}

/** POST a row together with anything still buffered. Returns true if the
 *  server stored this row, false if it is held in the buffer for a later
 *  submit.
 *
 *  The backlog goes out in batches the collector accepts, so a browser that
 *  was offline for a long time (a shared lab machine during an outage, say)
 *  drains it instead of growing one request that is refused for ever. A
 *  batch the server refuses as invalid is dropped, since sending it again
 *  cannot succeed. Anything else (offline, rate limited, a server error)
 *  keeps the rest for the next submit. The collector skips a row it already
 *  holds, so a batch that was stored but whose answer was lost is safe to
 *  send again. */
export async function submitRow(row: StudyRow): Promise<boolean> {
  let pending = [...readBuffer(), row];
  let stored = false;
  while (pending.length) {
    const batch = nextBatch(pending);
    const outcome = await send(batch);
    if (outcome === "retry") break;
    if (outcome === "stored" && batch.includes(row)) stored = true;
    pending = pending.slice(batch.length);
  }
  writeBuffer(pending);
  return stored;
}

function nextBatch(rows: StudyRow[]): StudyRow[] {
  const batch: StudyRow[] = [];
  let bytes = 16; // the {"rows":[]} around them
  for (const r of rows) {
    const size = new TextEncoder().encode(JSON.stringify(r)).length + 1;
    if (batch.length && (batch.length >= MAX_ROWS_PER_POST || bytes + size > MAX_BODY_BYTES)) break;
    batch.push(r);
    bytes += size;
  }
  return batch;
}

async function send(rows: StudyRow[]): Promise<"stored" | "refused" | "retry"> {
  try {
    const res = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    if (res.ok) return "stored";
    if (res.status === 400 || res.status === 413) return "refused";
  } catch {
    /* offline or server missing */
  }
  return "retry";
}

/** Ask the collector for the least-filled condition and advisor. Null when
 *  it cannot answer within a few seconds (no database, offline, slow): the
 *  session then keeps the condition drawn in this browser. */
export async function requestAssignment(
  participantId: string,
  language: "en" | "id",
): Promise<{ condition: string; advisor: "ml" | "logit" } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch("/api/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, language }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data: { condition?: unknown; advisor?: unknown } = await res.json();
    if (typeof data.condition !== "string" || (data.advisor !== "ml" && data.advisor !== "logit")) return null;
    return { condition: data.condition, advisor: data.advisor };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* A per-browser id for visitor tryouts, so several tries by the same
   person can be grouped without identifying anybody. */
const VISITOR_KEY = "adviceit-web-visitor-v1";

export function visitorId(): string {
  try {
    const v = localStorage.getItem(VISITOR_KEY);
    if (v) return v;
    const made = "V-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    localStorage.setItem(VISITOR_KEY, made);
    return made;
  } catch {
    return "V-ANON";
  }
}

const DONE_KEY = "adviceit-web-participated-v1";

export function markParticipated(pid: string) {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify({ pid, at: new Date().toISOString() }));
  } catch {
    /* ignore */
  }
}

export function priorParticipation(): { pid: string; at: string } | null {
  try {
    const v = localStorage.getItem(DONE_KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
