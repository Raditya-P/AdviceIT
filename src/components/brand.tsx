/* The AdviceIT brand. The mark is a banknote with three people on it, the
   middle one standing taller, because the study is about what a person does
   with advice about money rather than about the money itself. The note is
   the brand blue and the figures are white, so the mark is one drawing on
   both themes. The wordmark sets "Advice" in the foreground colour and "IT"
   in the brand blue. Both are inline SVG and text, so they follow the theme
   and scale without assets. Static copies for slides and papers live in
   public/brand. */

import Link from "next/link";

/* Each figure is a head and a pair of shoulders, the shoulders a rectangle
   with a semicircular top. The figures overlap, so the middle one is drawn
   last with a stroke in the note colour, which carves a clean gap between
   it and the two behind it. */
function Figure({
  cx,
  headY,
  r,
  halfW,
  bodyTop,
}: {
  cx: number;
  headY: number;
  r: number;
  halfW: number;
  bodyTop: number;
}) {
  const round = (n: number) => Math.round(n * 100) / 100;
  const left = round(cx - halfW);
  const right = round(cx + halfW);
  const arcY = round(bodyTop + halfW);
  return (
    <g fill="#fff" stroke="var(--primary)" strokeWidth="0.9" strokeLinejoin="round">
      <circle cx={cx} cy={headY} r={r} />
      <path
        d={`M${left} 23.7 L${left} ${arcY} A${halfW} ${halfW} 0 0 1 ${right} ${arcY} L${right} 23.7 Z`}
      />
    </g>
  );
}

export function LogoMark({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect x="1" y="7" width="30" height="18" rx="3.96" fill="var(--primary)" />
      <rect
        x="2.3"
        y="8.3"
        width="27.4"
        height="15.4"
        rx="2.34"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.5"
        strokeWidth="0.9"
      />
      <circle cx="4.4" cy="10.6" r="1.25" fill="#fff" fillOpacity="0.85" />
      <circle cx="27.6" cy="21.4" r="1.25" fill="#fff" fillOpacity="0.85" />
      <Figure cx={9.4} headY={14.7} r={2.15} halfW={3.7} bodyTop={17.4} />
      <Figure cx={22.6} headY={14.7} r={2.15} halfW={3.7} bodyTop={17.4} />
      <Figure cx={16} headY={12.5} r={2.6} halfW={4.5} bodyTop={15.7} />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-heading font-semibold tracking-[-0.03em] ${className}`}>
      <span className="text-foreground">Advice</span>
      <span className="text-primary">IT</span>
    </span>
  );
}

export function Logo({
  size = 34,
  wordmarkClass = "text-[19px]",
  href = "/",
  className = "",
}: {
  size?: number;
  wordmarkClass?: string;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 transition-opacity hover:opacity-85 ${className}`} aria-label="AdviceIT">
      <LogoMark size={size} />
      <Wordmark className={wordmarkClass} />
    </Link>
  );
}
