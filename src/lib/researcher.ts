/* Researcher controls on the advisor pages (the flawed-advice toggle, the
   suitability labels, the advisor comparison) reveal the study manipulation,
   so a query parameter alone must not unlock them. The dashboard validates
   the researcher key against the server and records the fact in this
   browser session. The advisor pages then require both the request
   (?researcher=1) and that validated session. Nothing sensitive is stored:
   the key itself is never written, only the fact that it was accepted. */

const KEY = "adviceit-researcher-validated";

export function hasResearcherAccess(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function grantResearcherAccess() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

export function revokeResearcherAccess() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
