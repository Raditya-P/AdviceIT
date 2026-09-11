/* The AdviceIT brand. The mark is a banknote with a portrait on it, the way
   a real note carries one, except the portrait is an anonymous silhouette:
   the person whose judgement the study is about. The note is the brand blue
   and the silhouette is white, so the mark is the same drawing on both
   themes. The wordmark sets "Advice" in the foreground colour and "IT" in
   the brand blue. Both are inline SVG and text, so they follow the theme and
   scale without assets. Static copies for slides and papers live in
   public/brand. */

import Link from "next/link";

/* Head and shoulders in profile, facing right, drawn in a 32 unit square and
   scaled into the note by the transform below. The nose and chin are
   exaggerated, because at sixteen pixels a true profile flattens into a
   blob. The flat bottom edge is deliberate: it sits on the note's inner
   border, so the portrait reads as cropped by the frame. */
const BUST =
  "M2.5 32 C3.2 27.6 6.6 24.4 11.2 23.6 L11.2 22.6 C8.3 20.4 6.7 16.9 7.1 13.2 C7.5 7.6 11.9 3.4 17.2 3.4 C21.7 3.4 25 6.6 25.1 10.9 C25.15 12.5 24.7 13.7 25.3 14.6 C26.1 15.8 28.1 17.7 27.7 18.7 C27.3 19.7 25.4 19.9 24 19.9 C23.2 19.9 23 20.3 23.2 21 C23.5 22.3 22.8 23.4 21.3 23.9 C20.9 24.1 20.7 24.5 20.5 25.2 C20.2 26.4 19.4 27.2 18.2 27.6 C22.8 28 28.4 29.6 29.5 32 Z";
/* fits the bust between y=10 and y=23.7 and centres it on x=16 */
const BUST_FIT = "translate(8.336 8.371) scale(0.4790)";

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
      <path d={BUST} fill="#fff" transform={BUST_FIT} />
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
