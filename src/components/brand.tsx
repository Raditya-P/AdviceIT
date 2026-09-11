/* The AdviceIT brand. The mark is a brain in front of a banknote: human
   judgement over the money, which is what the study asks a participant to
   exercise. The note is the brand blue, the brain takes the foreground
   colour and carries a background-coloured halo, so the mark reads on both
   themes without a second asset. The wordmark sets "Advice" in the
   foreground colour and "IT" in the brand blue. Both are inline SVG and
   text, so they follow the theme and scale without assets. Static copies
   for slides and papers live in public/brand. */

import Link from "next/link";

/* One half of the brain, mirrored about x=16 to make the whole. The gap the
   mirror leaves down the middle is the fissure, and it is what makes the
   shape read as a brain rather than a bean once the folds are gone at
   favicon size. */
const BRAIN_HALF =
  "M15.3 5.2 C13.9 4.3 12 4.5 10.8 5.7 C9.1 5.5 7.5 6.7 7.2 8.4 C5.7 9 4.8 10.7 5.2 12.3 C4.1 13.4 4 15.2 5 16.4 C4.5 18 5.3 19.8 6.9 20.6 C7 22.3 8.4 23.7 10.1 23.8 C11.1 25.2 13 25.7 14.5 24.9 L15.3 24.9 Z";
const BRAIN_FOLDS =
  "M15.3 9.4 C12.4 9.4 10.9 10.7 10.9 12.4 C10.9 13.7 9.8 14.4 8.5 14.3 M15.3 17.4 C12.2 17.4 10.3 18.8 10.3 21";
const MIRROR = "matrix(-1 0 0 1 32 0)";

export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
    >
      {/* the banknote, tilted so it sits behind rather than under */}
      <g transform="rotate(-7 16 16.5)">
        <rect x="1" y="7.5" width="30" height="18" rx="3.96" fill="var(--primary)" />
        <rect
          x="2.3"
          y="8.8"
          width="27.4"
          height="15.4"
          rx="2.34"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.5"
          strokeWidth="0.9"
        />
        <circle cx="4.4" cy="11.1" r="1.25" fill="#fff" fillOpacity="0.85" />
        <circle cx="27.6" cy="21.9" r="1.25" fill="#fff" fillOpacity="0.85" />
      </g>
      {/* the brain, haloed in the page colour so it lifts off the note */}
      <g transform="translate(16 15) scale(0.72) translate(-16 -15)">
        <g fill="var(--background)" stroke="var(--background)" strokeWidth="2.6" strokeLinejoin="round">
          <path d={BRAIN_HALF} />
          <path d={BRAIN_HALF} transform={MIRROR} />
        </g>
        <g fill="var(--foreground)">
          <path d={BRAIN_HALF} />
          <path d={BRAIN_HALF} transform={MIRROR} />
        </g>
        <g stroke="var(--background)" strokeWidth="1.35" strokeLinecap="round" fill="none">
          <path d={BRAIN_FOLDS} />
          <path d={BRAIN_FOLDS} transform={MIRROR} />
        </g>
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
  size = 28,
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
