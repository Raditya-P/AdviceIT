/* Study records: the row shape, and a submitter that POSTs to the API and
   falls back to localStorage when the network or the database is missing,
   flushing the buffer on the next successful submit. */

export interface StudyRow {
  rowType: "trial" | "exit";
  timestamp: string;
  participantId: string;
  condition: string;
  explanationContent: string;
  explanationForm: string;
  assignedBy: "random" | "chosen";
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
  whatIfMoves?: number | "";
  whyNotAsked?: number | "";
  adaptiveVariant?: string;
  attentionCheck?: string;
  decisionTimeMs?: number;
  llmModel?: string;
  llmExplanation?: string;
  llmTurns?: number | "";
  exitDistrustMoment?: string;
  exitMissingExplanation?: string;
  userAgentMobile?: boolean;
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

/** POST a row. Returns true if the server stored it, false if it was
 *  buffered locally. Buffered rows are retried on later submits. */
export async function submitRow(row: StudyRow): Promise<boolean> {
  const pending = [...readBuffer(), row];
  try {
    const res = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: pending }),
    });
    if (res.ok) {
      writeBuffer([]);
      return true;
    }
  } catch {
    /* offline or server missing */
  }
  writeBuffer(pending);
  return false;
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
