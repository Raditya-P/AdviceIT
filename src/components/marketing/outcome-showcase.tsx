"use client";

/* The five mixes and Human review, one at a time. The big bar slides from one
   mix to the next and its percentages glide, the description crossfades, and
   the list beside it (a row of tabs on a phone) shows all six, each mix with
   a small bar, under a highlight that moves to the current one.

   The timing works like the hero card: the active tab's progress line is a
   CSS animation whose end moves on to the next outcome. Pausing is pausing
   that animation, which happens on hover, on keyboard focus, with the pause
   button and whenever the showcase is off screen. Under reduced motion the
   line does not run, so nothing advances on its own. Every description sits
   in the same grid cell, so the panel is as tall as the longest one and
   never jumps. */

import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Pause, Play, UserRound } from "lucide-react";
import { ASSET_COLOR, AllocationBar, AllocationLegend } from "@/components/allocation-bar";
import { scrollBehavior, useInView } from "@/components/motion";
import { outcomeGuide } from "@/lib/advisor/guide";
import { ASSET_CLASSES, OUTCOMES } from "@/lib/advisor/model";
import { outcomeName, outcomeSummary } from "@/lib/advisor/strings";
import { tr, useLang } from "@/lib/i18n";

const DWELL_MS = 5500;
const NONE = { equities: 0, bonds: 0, cash: 0, realAssets: 0 };
const MIXES = OUTCOMES.filter((o) => o.allocation).length;

export function OutcomeShowcase() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [holding, setHolding] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(rootRef);
  const current = OUTCOMES[index];
  const human = current.allocation === null;
  const next = () => setIndex((i) => (i + 1) % OUTCOMES.length);

  /* Move the highlight behind the active tab and, where the tabs scroll
     sideways (a phone), bring the active one into view. Written straight to
     the DOM; the highlight only starts to glide once it has a first place. */
  useLayoutEffect(() => {
    const list = listRef.current;
    const mark = markRef.current;
    if (!list || !mark) return;
    const place = () => {
      const tab = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!tab) return;
      mark.style.transform = `translate(${tab.offsetLeft}px, ${tab.offsetTop}px)`;
      mark.style.width = `${tab.offsetWidth}px`;
      mark.style.height = `${tab.offsetHeight}px`;
      if (list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: scrollBehavior() });
      }
    };
    place();
    const raf = requestAnimationFrame(() => mark.setAttribute("data-placed", ""));
    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [index]);

  /* Arrow keys, Home and End move between tabs, as in any tab list. */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let to: number;
    if (e.key in step) to = (index + step[e.key] + OUTCOMES.length) % OUTCOMES.length;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = OUTCOMES.length - 1;
    else return;
    e.preventDefault();
    setIndex(to);
    listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[to]?.focus();
  };

  return (
    <div
      ref={rootRef}
      className="panel grid grid-cols-[minmax(0,1fr)] overflow-hidden lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]"
      onMouseEnter={() => setHolding(true)}
      onMouseLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHolding(false);
      }}
    >
      <div className="min-w-0 border-b border-border/70 bg-muted/40 p-2 lg:border-r lg:border-b-0 lg:p-3">
        <div
          ref={listRef}
          role="tablist"
          aria-label={t("Outcomes", "Pilihan hasil")}
          onKeyDown={onKeyDown}
          className="relative flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible"
        >
          <span ref={markRef} aria-hidden className="tab-mark" />
          {OUTCOMES.map((o, i) => {
            const active = i === index;
            const alloc = o.allocation;
            return (
              <button
                key={o.id}
                type="button"
                role="tab"
                id={`outcome-tab-${o.id}`}
                aria-selected={active}
                aria-controls="outcome-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => setIndex(i)}
                className={`relative shrink-0 rounded-xl px-4 pt-3 pb-3.5 text-left text-sm transition-colors ${
                  active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                } ${alloc ? "" : "lg:mt-2"}`}
              >
                <span className="block whitespace-nowrap">{outcomeName(o.name)}</span>
                <span
                  aria-hidden
                  className={`mt-2 hidden h-1.5 overflow-hidden rounded-full lg:flex ${
                    alloc ? "bg-border/60" : "border border-dashed border-border"
                  }`}
                >
                  {alloc &&
                    ASSET_CLASSES.map((ac) => (
                      <span key={ac.key} style={{ width: `${alloc[ac.key]}%`, background: ASSET_COLOR[ac.key] }} />
                    ))}
                </span>
                {active && (
                  <span aria-hidden className="absolute inset-x-4 bottom-1 h-0.5 overflow-hidden rounded-full bg-primary/15">
                    <span
                      key={`fill-${index}`}
                      className="dot-fill absolute inset-0 rounded-full bg-primary"
                      style={{ "--dot-ms": `${DWELL_MS}ms` } as CSSProperties}
                      data-paused={stopped || holding || !inView ? "" : undefined}
                      onAnimationEnd={next}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="outcome-panel"
        role="tabpanel"
        aria-labelledby={`outcome-tab-${current.id}`}
        className="relative flex flex-col p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={() => setStopped((s) => !s)}
          aria-label={stopped ? t("Play the outcomes", "Putar pilihan hasilnya") : t("Pause the outcomes", "Jeda pilihan hasilnya")}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {stopped ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
        </button>

        <div className="grid pr-8">
          {OUTCOMES.map((o, i) => {
            const active = i === index;
            return (
              <div
                key={o.id}
                aria-hidden={!active}
                inert={!active}
                className={`[grid-area:1/1] transition-[opacity,translate,visibility] duration-500 ${
                  active ? "opacity-100" : "invisible translate-y-1 opacity-0"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {o.allocation
                    ? t(`Mix ${i + 1} of ${MIXES}`, `Komposisi ${i + 1} dari ${MIXES}`)
                    : t("No automated mix", "Tanpa komposisi otomatis")}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{outcomeName(o.name)}</h3>
                <p className="mt-2 font-medium">{outcomeSummary(o.id, o.summary)}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{outcomeGuide(o.id, locale).expect}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-6">
          <div className="relative overflow-hidden rounded-xl bg-muted">
            <div aria-hidden={human}>
              <AllocationBar allocation={current.allocation ?? NONE} height="h-12" animate={false} smooth />
            </div>
            <p
              aria-hidden={!human}
              className={`absolute inset-0 flex items-center justify-center gap-2 px-4 text-sm font-medium text-muted-foreground transition-opacity duration-500 ${
                human ? "opacity-100" : "opacity-0"
              }`}
            >
              <UserRound className="size-4 shrink-0 text-primary" aria-hidden />
              {t("Referred to a human adviser", "Dirujuk ke penasihat manusia")}
            </p>
          </div>
          <div className="mt-3 grid">
            <div
              aria-hidden={human}
              className={`[grid-area:1/1] transition-[opacity,visibility] duration-500 ${human ? "invisible opacity-0" : "opacity-100"}`}
            >
              <AllocationLegend allocation={current.allocation ?? NONE} animated />
            </div>
            <p
              aria-hidden={!human}
              className={`[grid-area:1/1] text-sm text-muted-foreground transition-[opacity,visibility] duration-500 ${
                human ? "opacity-100" : "invisible opacity-0"
              }`}
            >
              {t(
                "The experts referred almost half of the 400 training cases to a person too.",
                "Para ahli juga merujuk hampir separuh dari 400 kasus pelatihan ke penasihat manusia.",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
