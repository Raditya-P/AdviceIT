"use client";

/* Step one of the advisor flow: how should the advice be explained. The
   researcher disclosure keeps the exact content x delivery controls, so a
   custom combination is still one click away. */

import {
  BarChart3,
  Check,
  CircleSlash,
  Gauge,
  GraduationCap,
  Layers,
  MessageSquareText,
  Shuffle,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CONTENT_PARTS, FORMS, presetLabel, type ContentPart, type Form } from "@/lib/conditions";
import { tr, useLang } from "@/lib/i18n";
import * as llm from "@/lib/llm";
import { Seg } from "./profile-form";

const ICONS: Record<string, LucideIcon> = {
  none: CircleSlash,
  feature: BarChart3,
  counterfactual: Shuffle,
  confidence: Gauge,
  hybrid: Layers,
  interactive: SlidersHorizontal,
  adaptive: GraduationCap,
  llm: MessageSquareText,
};

const TAGLINES: Record<string, { en: string; id: string }> = {
  none: {
    en: "Just the recommendation. This is the control condition in the study.",
    id: "Hanya rekomendasinya. Ini adalah kondisi kontrol dalam studi.",
  },
  feature: {
    en: "See which of your answers pushed the advice, and by how much.",
    id: "Lihat jawaban Anda yang mana yang mendorong saran, dan seberapa besar.",
  },
  counterfactual: {
    en: "The smallest change to your situation that would flip the advice.",
    id: "Perubahan terkecil pada situasi Anda yang akan membalik sarannya.",
  },
  confidence: {
    en: "The advisor's calibrated confidence, with the full probability picture.",
    id: "Keyakinan terkalibrasi si penasihat, dengan gambaran probabilitas lengkap.",
  },
  hybrid: {
    en: "Why, what would change it, and how sure, together.",
    id: "Mengapa, apa yang mengubahnya, dan seberapa yakin, bersama-sama.",
  },
  interactive: {
    en: "Move the inputs yourself and watch the advice react live.",
    id: "Geser sendiri inputnya dan lihat sarannya bereaksi seketika.",
  },
  adaptive: {
    en: "An explanation that adjusts to your financial literacy.",
    id: "Penjelasan yang menyesuaikan diri dengan literasi keuangan Anda.",
  },
  llm: {
    en: "Chat with an explainer running entirely in your browser.",
    id: "Mengobrol dengan penjelas yang berjalan sepenuhnya di browser Anda.",
  },
};

const ORDER = ["feature", "counterfactual", "confidence", "hybrid", "interactive", "adaptive", "llm", "none"];

export function StylePicker({
  preset,
  onPreset,
  content,
  form,
  onToggleContent,
  onForm,
  researcher,
  scenario,
  onScenario,
}: {
  preset: string;
  onPreset: (name: string) => void;
  content: ContentPart[];
  form: Form;
  onToggleContent: (part: ContentPart) => void;
  onForm: (f: Form) => void;
  researcher: boolean;
  scenario: "sound" | "flawed";
  onScenario: (s: "sound" | "flawed") => void;
}) {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const gpuMissing = !llm.supported();

  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("How should the advice be explained?", "Bagaimana saran ini sebaiknya dijelaskan?")}
        </h2>
        <p className="text-muted-foreground">
          {t(
            "Pick one style now. You can come back and try another one on the same profile at any point.",
            "Pilih satu gaya sekarang. Anda bisa kembali dan mencoba gaya lain pada profil yang sama kapan saja.",
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ORDER.map((name) => {
          const Icon = ICONS[name] ?? Layers;
          const selected = preset === name;
          const blocked = name === "llm" && gpuMissing;
          return (
            <button
              key={name}
              type="button"
              disabled={blocked}
              aria-pressed={selected}
              onClick={() => onPreset(name)}
              className={`panel lift relative p-5 text-left disabled:cursor-not-allowed disabled:opacity-55 ${
                selected ? "ring-soft border-primary/60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex size-10 items-center justify-center rounded-xl ${
                    selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                {selected && (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Check className="size-3.5" aria-hidden /> {t("Selected", "Dipilih")}
                  </span>
                )}
              </div>
              <h3 className="mt-3.5 font-semibold tracking-tight">{presetLabel(name, locale)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tr(locale, TAGLINES[name])}</p>
              {name === "llm" && (
                <Badge variant="secondary" className="mt-3 text-[11px]">
                  {blocked
                    ? t("needs a WebGPU browser", "butuh browser dengan WebGPU")
                    : t("downloads a model on first use", "mengunduh model saat pertama dipakai")}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {researcher && (
        <details className="rounded-2xl border border-border/70 bg-muted/40 p-5 text-sm">
          <summary className="cursor-pointer font-medium text-primary">
            {t("Researcher controls", "Kontrol peneliti")}
          </summary>
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("Content", "Konten")}
              </span>
              {CONTENT_PARTS.map((part) => (
                <label key={part} className="flex items-center gap-1.5">
                  <Checkbox checked={content.includes(part)} onCheckedChange={() => onToggleContent(part)} />
                  {presetLabel(part, locale)}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("Delivery", "Penyajian")}
              </span>
              <RadioGroup
                value={form}
                onValueChange={(v: string) => onForm(v as Form)}
                className="flex flex-wrap gap-4"
              >
                {FORMS.map((f) => (
                  <label key={f} className="flex items-center gap-1.5">
                    <RadioGroupItem value={f} />{" "}
                    {tr(locale, {
                      en: { static: "Static", interactive: "Interactive what-if", adaptive: "Adaptive to literacy", llm: "Conversational (LLM)" }[f],
                      id: { static: "Statis", interactive: "What-if interaktif", adaptive: "Adaptif terhadap literasi", llm: "Percakapan (LLM)" }[f],
                    })}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("Scenario", "Skenario")}
              </span>
              <Seg
                name={t("Advice scenario", "Skenario saran")}
                options={[
                  { value: "sound", label: t("Sound advice", "Saran tepat") },
                  { value: "flawed", label: t("Flawed advice", "Saran keliru") },
                ]}
                value={scenario}
                onChange={(v) => onScenario(v as "sound" | "flawed")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "Content is what is explained. Delivery is how it is shown. A preset is one combination, and the study log records both parts.",
                "Konten adalah apa yang dijelaskan. Penyajian adalah cara menampilkannya. Preset adalah satu kombinasi, dan log studi merekam keduanya.",
              )}
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
