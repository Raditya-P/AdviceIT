"use client";

/* Whether this browser can run the in-browser language model. The server
   cannot know and renders "no", so a component that read navigator.gpu
   during render drew "yes" on the client and failed hydration (React error
   418) in every WebGPU browser. useSyncExternalStore hands back the server
   answer while hydrating and the real one straight after. */

import { useSyncExternalStore } from "react";
import { supported } from "./llm";

const noSubscription = () => () => {};

export function useWebGpu(): boolean {
  return useSyncExternalStore(noSubscription, supported, () => false);
}
