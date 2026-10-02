/* The AdviceIT brand. The mark is a dial with three zones: too little trust
   on the left, appropriate trust in the middle, too much on the right. The
   needle rests in the middle zone, because that is the question the study
   asks: which explanations bring people's reliance on AI advice into the
   middle, following it when it is sound and overriding it when it is not.
   The zones use the slate, blue and amber of the site palette and the
   needle the foreground colour, all through theme variables, so the mark is
   one drawing on both themes. The wordmark sets "Advice" in the foreground
   colour and "IT" in the brand blue. Static copies for slides, papers and
   the README live in public/brand, with the wordmark outlined. */

import Link from "next/link";

/* The dial: a 12.25 radius arc in three segments with 10 degree gaps,
   centred on (16, 21.75) so the drawing sits in the middle of the box. */
export const DIAL = {
  low: "M3.75 21.75A12.25 12.25 0 0 1 8.8 11.84",
  mid: "M10.63 10.74A12.25 12.25 0 0 1 21.37 10.74",
  high: "M23.2 11.84A12.25 12.25 0 0 1 28.25 21.75",
  needle: "M16 21.75V11.75",
};

export function LogoMark({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path d={DIAL.low} stroke="var(--cash)" strokeWidth="4.5" />
      <path d={DIAL.mid} stroke="var(--primary)" strokeWidth="4.5" />
      <path d={DIAL.high} stroke="var(--real-assets)" strokeWidth="4.5" />
      {/* Grouped so the needle can turn about its hub (see .logo-needle). */}
      <g className="logo-needle">
        <path d={DIAL.needle} stroke="var(--foreground)" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="16" cy="21.75" r="3" fill="var(--foreground)" />
      </g>
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
  intro = false,
}: {
  size?: number;
  wordmarkClass?: string;
  href?: string;
  className?: string;
  /** Swing the needle into place once, on the first page of a visit. */
  intro?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 transition-opacity hover:opacity-85 ${intro ? "needle-intro" : ""} ${className}`}
      aria-label="AdviceIT"
    >
      <LogoMark size={size} />
      <Wordmark className={wordmarkClass} />
    </Link>
  );
}
