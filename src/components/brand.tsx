/* The AdviceIT brand. The mark is an A whose crossbar is a slider with a
   knob: advice you can adjust, and trust you can calibrate. The wordmark
   sets "Advice" in the foreground colour and "IT" in the brand blue. Both
   are inline SVG and text, so they follow the theme and scale without
   assets. Static copies for slides and papers live in public/brand. */

import Link from "next/link";

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
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--primary)" />
      {/* the A */}
      <path
        d="M8.5 24.5 16 8l7.5 16.5"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* the crossbar as a slider track */}
      <path d="M10.6 19h10.8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
      {/* the knob, set a little right of centre: adjusted, not default */}
      <circle cx="18.6" cy="19" r="2.6" fill="var(--bonds)" stroke="#fff" strokeWidth="1.6" />
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
