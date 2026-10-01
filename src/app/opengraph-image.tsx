import { ImageResponse } from "next/og";
import { DIAL } from "@/components/brand";

/* The link preview card, drawn at build time. It repeats the home page:
   the mark, the headline, and a recommendation card with the Growth mix
   (70 equities, 20 bonds, 10 real assets, the real allocation). Colours
   are the light theme tokens from globals.css. */

export const alt = "AdviceIT: know when to trust AI investment advice. An open research study.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BLUE = "#2f7fd0";
const INK = "#0d1725";
const MUTED = "#5b6b80";
const BORDER = "#e3e9f1";
const BONDS = "#3aa8a0";
const REAL = "#e0a136";
const SLATE = "#8fa3ba";

const HEADLINE = ["Know when to trust", "AI investment advice"];
const SUBLINE = ["An open research study.", "Six short cases, about 15 minutes."];
const PILL = "A research simulation. Not a financial service";

/* Fonts are fetched from Google Fonts, subset to the characters drawn. If
   that fails the card is still drawn, in the built-in font, so a build
   never breaks on it. */
async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const query = `family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await fetch(`https://fonts.googleapis.com/css2?${query}`).then((r) => r.text());
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return src ? await fetch(src).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/* The dial from src/components/brand.tsx, in the light theme colours,
   because the image renderer cannot read CSS variables. */
function Mark({ size: px }: { size: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 32 32" fill="none">
      <path d={DIAL.low} stroke={SLATE} strokeWidth="4.5" />
      <path d={DIAL.mid} stroke={BLUE} strokeWidth="4.5" />
      <path d={DIAL.high} stroke={REAL} strokeWidth="4.5" />
      <path d={DIAL.needle} stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="16" cy="21.75" r="3" fill={INK} />
    </svg>
  );
}

export default async function OpengraphImage() {
  const headingText = "AdviceIT" + HEADLINE.join("") + "Growth";
  const bodyText = SUBLINE.join("") + PILL + "RECOMMENDED OUTCOMEGlobal equities 70%Bonds 20%Real assets 10%";
  const [heading, body] = await Promise.all([
    googleFont("Instrument Sans", 600, headingText),
    googleFont("Inter", 500, bodyText),
  ]);
  const fonts = [
    ...(heading ? [{ name: "Heading", data: heading, weight: 600 as const, style: "normal" as const }] : []),
    ...(body ? [{ name: "Body", data: body, weight: 500 as const, style: "normal" as const }] : []),
  ];
  const headingFont = heading ? "Heading" : undefined;
  const bodyFont = body ? "Body" : undefined;

  const legend = [
    { label: "Global equities 70%", color: BLUE },
    { label: "Bonds 20%", color: BONDS },
    { label: "Real assets 10%", color: REAL },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "64px 72px",
          backgroundColor: "#ffffff",
          backgroundImage: "radial-gradient(circle at 85% 20%, #dcebfa 0%, #ffffff 55%)",
          fontFamily: bodyFont,
          color: INK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mark size={84} />
            <div style={{ display: "flex", fontFamily: headingFont, fontSize: 46, letterSpacing: -1.4 }}>
              <span style={{ color: INK }}>Advice</span>
              <span style={{ color: BLUE }}>IT</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: headingFont, fontSize: 62, lineHeight: 1.08, letterSpacing: -2 }}>
            <span>{HEADLINE[0]}</span>
            <span style={{ color: BLUE }}>{HEADLINE[1]}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 28, color: MUTED }}>
              <span>{SUBLINE[0]}</span>
              <span>{SUBLINE[1]}</span>
            </div>
            <div style={{ display: "flex" }}>
              <span
                style={{
                  fontSize: 20,
                  color: MUTED,
                  border: `2px solid ${BORDER}`,
                  borderRadius: 999,
                  padding: "8px 20px",
                  backgroundColor: "#ffffff",
                }}
              >
                {PILL}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 360,
              padding: 32,
              gap: 20,
              backgroundColor: "#ffffff",
              border: `2px solid ${BORDER}`,
              borderRadius: 28,
              boxShadow: "0 24px 60px rgba(13, 23, 37, 0.10)",
            }}
          >
            <span style={{ fontSize: 16, color: MUTED, letterSpacing: 2 }}>RECOMMENDED OUTCOME</span>
            <span style={{ fontFamily: headingFont, fontSize: 52, letterSpacing: -1 }}>Growth</span>
            <div style={{ display: "flex", height: 34, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ width: "70%", backgroundColor: BLUE }} />
              <div style={{ width: "20%", backgroundColor: BONDS }} />
              <div style={{ width: "10%", backgroundColor: REAL }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {legend.map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 20, color: MUTED }}>
                  <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: l.color }} />
                  <span>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}
