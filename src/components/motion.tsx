"use client";

/* Motion helpers. The styles they switch on live in globals.css under
   "Motion", which also states the three rules: nothing hidden without
   scripts, nothing moving under prefers-reduced-motion, nothing moving
   inside a study trial ([data-motion="still"]).

   None of these components keep the animation in React state. They set a
   data attribute or a text node directly, so an animation never causes a
   re-render and the server HTML always carries the final content. */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type RefObject,
} from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

/** Smooth, unless the visitor asked for less motion. For scrollTo calls. */
export function scrollBehavior(): ScrollBehavior {
  return window.matchMedia(REDUCED).matches ? "auto" : "smooth";
}

/** Whether an element is at least a quarter on screen, so things that play
 *  on their own (the hero examples, the outcome showcase) can wait while
 *  nobody is looking. `initial` is the answer before the first report. */
export function useInView(ref: RefObject<Element | null>, initial = false) {
  const [inView, setInView] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

/* If the first page took longer than the CSS failsafe to become interactive,
   everything is already visible, and hiding it again to animate it in would
   flash. Decided once per page load; later navigations reuse the answer. */
const FAILSAFE_MS = 3500;
let late: boolean | null = null;
function hydratedLate() {
  if (late === null) {
    const root = document.documentElement;
    late = !root.hasAttribute("data-motion-ready") && performance.now() > FAILSAFE_MS;
    root.setAttribute("data-motion-ready", "");
  }
  return late;
}

function staysStill(el: Element) {
  return window.matchMedia(REDUCED).matches || el.closest('[data-motion="still"]') !== null;
}

/* One observer for every watched element. The callback learns whether the
   element is in view and whether this is the first report about it, which
   tells "already on screen at load" apart from "scrolled into view". */
type Watcher = (visible: boolean, first: boolean) => void;
const watchers = new Map<Element, { cb: Watcher; seen: boolean }>();
let observer: IntersectionObserver | null = null;

function watch(el: Element, cb: Watcher) {
  if (typeof IntersectionObserver === "undefined") {
    cb(true, true);
    return () => {};
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const w = watchers.get(entry.target);
        if (!w) continue;
        const first = !w.seen;
        w.seen = true;
        w.cb(entry.isIntersecting, first);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0 },
  );
  watchers.set(el, { cb, seen: false });
  observer.observe(el);
  return () => {
    watchers.delete(el);
    observer?.unobserve(el);
  };
}

/** Rises and fades in the first time it scrolls into view. `delay` staggers siblings. */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className = "",
  style,
  children,
  ...rest
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [attr: string]: unknown;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.setAttribute("data-shown", "");
    if (hydratedLate() || staysStill(el)) {
      show();
      return;
    }
    const stop = watch(el, (visible) => {
      if (!visible) return;
      show();
      stop();
    });
    return stop;
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties} {...rest}>
      {children}
    </Tag>
  );
}

function format(n: number, decimals: number, locale: "en" | "id") {
  const s = n.toFixed(decimals);
  return locale === "id" ? s.replace(".", ",") : s;
}

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/* Runs a tween on the text node React rendered. React keeps its own copy of
   the text, and the element carries the final text in data-final, which
   React updates before any cleanup runs. Stopping a tween puts that text
   back, so a re-render (a language switch, a new value) always wins. */
function tween(el: HTMLElement, node: Text, from: number, to: number, ms: number, fmt: (n: number) => string) {
  const start = performance.now();
  node.nodeValue = fmt(from);
  let raf = 0;
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / ms);
    node.nodeValue = fmt(from + (to - from) * easeOut(k));
    if (k < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => {
    cancelAnimationFrame(raf);
    node.nodeValue = el.getAttribute("data-final") ?? fmt(to);
  };
}

/** A number that counts up from zero when it first scrolls into view. One
 *  that is already on screen when the page loads simply shows its value,
 *  unless a Reveal around it is still hiding it, in which case nobody saw
 *  the value yet and the count can run as the Reveal fades it in. */
export function CountUp({
  value,
  decimals = 0,
  locale = "en",
  duration = 1300,
  className = "",
}: {
  value: number;
  decimals?: number;
  locale?: "en" | "id";
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const node = el?.firstChild;
    if (!el || !(node instanceof Text) || hydratedLate() || staysStill(el)) return;
    const fmt = (n: number) => format(n, decimals, locale);
    // Child effects run before the parent Reveal's, so this sees it unrevealed.
    const veiled = el.closest(".reveal:not([data-shown])") !== null;
    if (veiled) node.nodeValue = fmt(0);
    let cancel = () => {};
    const stop = watch(el, (visible, first) => {
      if (first && visible && !veiled) {
        stop();
        return;
      }
      if (first && !visible) {
        node.nodeValue = fmt(0);
        return;
      }
      if (visible) {
        stop();
        cancel = tween(el, node, 0, value, duration, fmt);
      }
    });
    return () => {
      stop();
      cancel();
      node.nodeValue = el.getAttribute("data-final") ?? fmt(value);
    };
  }, [value, decimals, locale, duration]);
  const text = format(value, decimals, locale);
  return (
    <span ref={ref} data-final={text} className={`tabular-nums ${className}`}>
      {text}
    </span>
  );
}

/** A number that glides from its previous value to a new one. It does not
 *  animate on first render. */
export function AnimatedNumber({ value, duration = 700, className = "" }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  // Layout effect: start from the old value before the browser paints the new one.
  useLayoutEffect(() => {
    const el = ref.current;
    const node = el?.firstChild;
    const from = previous.current;
    previous.current = value;
    if (!el || !(node instanceof Text) || from === value || staysStill(el)) return;
    return tween(el, node, from, value, duration, (n) => String(Math.round(n)));
  }, [value, duration]);
  return (
    <span ref={ref} data-final={String(value)} className={`tabular-nums ${className}`}>
      {String(value)}
    </span>
  );
}

/** A soft light that follows a fine pointer across its parent section. */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    if (!window.matchMedia("(pointer: fine)").matches || staysStill(el)) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };
    const move = (e: PointerEvent) => {
      const box = host.getBoundingClientRect();
      x = e.clientX - box.left;
      y = e.clientY - box.top;
      el.setAttribute("data-on", "");
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const leave = () => el.removeAttribute("data-on");
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} aria-hidden className="spotlight" />;
}
