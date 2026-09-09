/* Resumable study sessions.

   A session is written to this browser only after the person has consented,
   and it is cleared the moment the exit questionnaire is submitted. It holds
   what is needed to put someone back where they were: the participant ID,
   the assigned condition and advisor, the stage, the answers given so far,
   and how many cases are done.

   Two things this deliberately does not do. It does not resume inside a
   case, so a returning participant always starts the current case from its
   description again, which keeps the reading time honest and stops a case
   being judged from memory. And it does not survive a week, because a study
   session spread over many days is not the session the design assumes.

   The condition travels with the session rather than with the URL, so a
   participant who returns through a different link stays in the condition
   they were assigned. Refreshing cannot be used to shop for another one. */

import type { ContentPart, Form, Modality } from "./conditions";

export type ResumableStage = "literacy" | "characteristics" | "trial" | "exit";

export interface SavedSession {
  v: 1;
  pid: string;
  advisorId: "ml" | "logit";
  condition: string;
  content: ContentPart[];
  form: Form;
  modality: Modality;
  assignedBy: "random" | "chosen";
  stage: ResumableStage;
  litAnswers: Record<string, string>;
  pcAnswers: Record<string, number>;
  trialIdx: number;
  perception: Record<string, number>;
  exit1: string;
  exit2: string;
  startedAt: string;
  updatedAt: string;
  resumes: number;
}

const KEY = "adviceit-web-session-v1";

/** How long a half-finished session stays resumable. Beyond this the person
 *  starts again, and no partial session lingers in the browser. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const STAGES: ResumableStage[] = ["literacy", "characteristics", "trial", "exit"];

/* A stable snapshot for useSyncExternalStore. The value is read once per
   page load, because a snapshot that changed identity on every render would
   put React into a re-render loop. clearSession resets it so that starting a
   new session inside the same page load does not resurrect the old one. */
let snapshot: SavedSession | null | undefined;

export function sessionSnapshot(): SavedSession | null {
  if (snapshot === undefined) snapshot = loadSession();
  return snapshot;
}

/** No saved session exists on the server, so hydration starts from nothing. */
export function noSession(): null {
  return null;
}

/** useSyncExternalStore needs a subscribe function. Nothing outside React
 *  writes this store, so there is nothing to subscribe to. */
export function subscribeToSession(): () => void {
  return () => {};
}

export function loadSession(): SavedSession | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let s: SavedSession;
  try {
    s = JSON.parse(raw) as SavedSession;
  } catch {
    clearSession();
    return null;
  }
  if (s?.v !== 1 || typeof s.pid !== "string" || !STAGES.includes(s.stage)) {
    clearSession();
    return null;
  }
  const age = Date.now() - Date.parse(s.updatedAt);
  if (!isFinite(age) || age > SESSION_TTL_MS) {
    clearSession();
    return null;
  }
  return s;
}

export function saveSession(s: SavedSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or unavailable: the session simply is not resumable */
  }
}

export function clearSession() {
  snapshot = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
