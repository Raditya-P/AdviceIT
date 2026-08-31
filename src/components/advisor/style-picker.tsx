"use client";

/* Step one of the advisor flow: how should the advice be explained. The
   researcher disclosure keeps the exact content x delivery controls, so a
   custom combination is still one click away. */

import {
  AlignLeft,
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
import { CONTENT_PARTS, FORMS, MODALITIES, presetLabel, type ContentPart, type Form, type Modality } from "@/lib/conditions";
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
  "interactive-hybrid": SlidersHorizontal,
  "feature-textual": AlignLeft,
  "feature-hybrid": Layers,
  adaptive: GraduationCap,
  llm: MessageSquareText,
};

const TAGLINES: Record<string, { en: string; id: string }> = {
  none: {
    en: "Just the recommendation. This is the control condition in the study.",
    id: "Hanya rekomendasinya. Ini adalah kondisi kontrol dalam studi.",
  },
  feature: {
    en: "See which of your answers pushed the advice, and by how much, as bars.",
    id: "Lihat jawaban Anda yang mana yang mendorong saran dan seberapa besar, dalam bentuk batang.",
  },
  "feature-textual": {
    en: "The same reasoning, written out as sentences instead of bars.",
    id: "Penalaran yang sama, ditulis sebagai kalimat alih-alih batang.",
  },
  "feature-hybrid": {
    en: "The bars and the sentences together, each covering what the other misses.",
    id: "Batang dan kalimat sekaligus, saling menutupi kekurangan masing-masing.",
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
    en: "Move the inputs yourself, with nothing written to explain the advice.",
    id: "Geser sendiri inputnya, tanpa tulisan apa pun yang menjelaskan sarannya.",
  },
  "interactive-hybrid": {
    en: "All three explanations, plus controls to move the inputs and watch the advice react.",
    id: "Ketiga penjelasan sekaligus, ditambah kendali untuk menggeser input dan melihat sarannya bereaksi.",
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

/* The two factors of the design, kept visible: what is explained, and how
   that content is delivered. The delivery presets all carry the same three
   contents, so they are not rival "explanation types" but ways of handing
   the same material over. */
const GROUPS: { key: string; title: { en: string; id: string }; note: { en: string; id: string }; items: string[] }[] = [
  {
    key: "content",
    title: { en: "What is explained", id: "Apa yang dijelaskan" },
    note: {
      en: "Different material about the same recommendation, shown as a static panel.",
      id: "Materi yang berbeda tentang rekomendasi yang sama, ditampilkan sebagai panel statis.",
    },
    items: ["feature", "counterfactual", "confidence", "hybrid", "none"],
  },
  {
    key: "delivery",
    title: { en: "How it is delivered", id: "Bagaimana penyajiannya" },
    note: {
      en: "The same three contents, handed over in a different way. The last one drops the written explanation entirely.",
      id: "Ketiga konten yang sama, disampaikan dengan cara berbeda. Yang terakhir menghilangkan penjelasan tertulis sepenuhnya.",
    },
    items: ["interactive-hybrid", "adaptive", "llm", "interactive"],
  },
  {
    key: "modality",
    title: { en: "How the why is presented", id: "Bagaimana bagian mengapa ditampilkan" },
    note: {
      en: "The same attribution, as bars, as sentences, or as both. Not in the random pool, these are for the modality study.",
      id: "Atribusi yang sama, sebagai batang, sebagai kalimat, atau keduanya. Tidak masuk kumpulan acak, ini untuk studi modalitas.",
    },
    items: ["feature-textual", "feature-hybrid"],
  },
];

export function StylePicker({
  preset,
  onPreset,
  content,
  form,
  onToggleContent,
  onForm,
  modality,
  onModality,
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
  modality: Modality;
  onModality: (m: Modality) => void;
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

      {GROUPS.map((group) => (
        <div key={group.key} className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">{tr(locale, group.title)}</h3>
            <p className="text-sm text-muted-foreground">{tr(locale, group.note)}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {group.items.map((name) => {
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
        </div>
      ))}

      <details className="rounded-2xl border border-border/70 bg-muted/40 p-5 text-sm">
          <summary className="cursor-pointer font-medium text-primary">
            {t("Build your own combination", "Susun kombinasi Anda sendiri")}
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
                {t("Modality of the why", "Modalitas bagian mengapa")}
              </span>
              <RadioGroup
                value={modality}
                onValueChange={(v: string) => onModality(v as Modality)}
                className="flex flex-wrap gap-4"
              >
                {MODALITIES.map((m) => (
                  <label key={m} className="flex items-center gap-1.5">
                    <RadioGroupItem value={m} />{" "}
                    {tr(locale, {
                      en: { visual: "Visual", textual: "Textual", hybrid: "Hybrid" }[m],
                      id: { visual: "Visual", textual: "Tekstual", hybrid: "Hibrida" }[m],
                    })}
                  </label>
                ))}
              </RadioGroup>
            </div>
            {researcher && (
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
            )}
            <p className="text-xs text-muted-foreground">
              {t(
                "Content is what is explained: why, what would change it, how sure. Delivery is how it reaches you: static, interactive, adapted to literacy, or conversational. A preset is one combination of the two, and both parts are recorded.",
                "Konten adalah apa yang dijelaskan: mengapa, apa yang mengubahnya, seberapa yakin. Penyajian adalah cara sampainya kepada Anda: statis, interaktif, disesuaikan dengan literasi, atau percakapan. Preset adalah satu kombinasi keduanya, dan kedua bagian itu dicatat.",
              )}
            </p>
          </div>
        </details>
    </div>
  );
}
