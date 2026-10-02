/// <reference types="react/canary" />

/* Cross-fades the page body when the visitor follows a link, where the
   browser supports view transitions; elsewhere the page simply changes.
   default="none" keeps everything else still: a language switch
   (router.refresh) or a state change inside a page never animates. The
   header sits outside and is named in site-header.tsx, so it holds still.
   The study page does not use this, so a trial never fades. The styles are
   the "Page changes" rules in globals.css. */

import { ViewTransition, type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}
