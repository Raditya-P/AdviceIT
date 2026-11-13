"use client";

/* Step one of the advisor flow: how should the advice be explained. The
   four plain choices the study uses come first; the other ways of
   delivering an explanation, the modality variants and the custom
   combination sit under "More ways to explain", so a first-time visitor
   meets four options instead of eleven. */

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
import { useWebGpu } from "@/lib/use-webgpu";
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
    id: "Hanya rekomendasinya. Ini kondisi pembanding (kontrol) dalam penelitian.",
  },
  feature: {
    en: "Which facts about the person mattered most, and how much, shown as bars.",
    id: "Fakta mana tentang orang itu yang paling berpengaruh dan seberapa besar, dalam bentuk grafik batang.",
  },
  "feature-textual": {
    en: "The same reasoning, written out as sentences instead of bars.",
    id: "Alasan yang sama, ditulis sebagai kalimat, bukan grafik.",
  },
  "feature-hybrid": {
    en: "The bars and the sentences together, each covering what the other misses.",
    id: "Grafik dan kalimat sekaligus, saling melengkapi.",
  },
  counterfactual: {
    en: "What would have to be different for the advice to change.",
    id: "Apa yang harus berbeda agar sarannya berubah.",
  },
  confidence: {
    en: "How sure the advisor is, next to the other options it considered.",
    id: "Seberapa yakin penasihat, di samping pilihan lain yang ia pertimbangkan.",
  },
  hybrid: {
    en: "Why, what would change it, and how sure, together.",
    id: "Mengapa, apa yang bisa mengubahnya, dan seberapa yakin, sekaligus.",
  },
  interactive: {
    en: "Move the inputs yourself, with nothing written to explain the advice.",
    id: "Ubah sendiri datanya dan lihat sarannya berubah, tanpa penjelasan tertulis.",
  },
  "interactive-hybrid": {
    en: "All three explanations, plus controls to move the inputs and watch the advice react.",
    id: "Ketiga penjelasan sekaligus, ditambah tombol dan penggeser untuk mengubah data dan melihat sarannya berubah.",
  },
  adaptive: {
    en: "An explanation that adjusts to your financial literacy.",
    id: "Penjelasan yang disesuaikan dengan pengetahuan keuangan Anda.",
  },
  llm: {
    en: "Chat with an explainer running entirely in your browser.",
    id: "Tanya jawab dengan asisten AI yang berjalan sepenuhnya di browser Anda.",
  },
};

/* The two factors of the design, kept visible: what is explained, and how
   that content is delivered. The delivery presets all carry the same three
   contents, so they are not rival "explanation types" but ways of handing
   the same material over. */
const GROUPS: { key: string; title: { en: string; id: string }; note: { en: string; id: string }; items: string[] }[] = [
  {
    key: "content",
    title: { en: "Choose one", id: "Pilih salah satu" },
    note: {
      en: "The same advice each time, explained in a different way.",
      id: "Sarannya sama, hanya cara menjelaskannya yang berbeda.",
    },
    items: ["feature", "counterfactual", "confidence", "hybrid"],
  },
  {
    key: "delivery",
    title: { en: "Other ways to deliver it", id: "Cara penyajian lain" },
    note: {
      en: "The same three explanations, handed over differently, or no explanation at all.",
      id: "Tiga penjelasan yang sama, disajikan dengan cara berbeda, atau tanpa penjelasan sama sekali.",
    },
    items: ["interactive-hybrid", "adaptive", "llm", "interactive", "none"],
  },
  {
    key: "modality",
    title: { en: "How the why is presented", id: "Cara bagian \"mengapa\" ditampilkan" },
    note: {
      en: "The same attribution, as bars, as sentences, or as both. Not in the random pool, these are for the modality study.",
      id: "Penjelasan \"mengapa\" yang sama, sebagai grafik, kalimat, atau keduanya. Tidak diundi untuk peserta, hanya untuk studi tentang bentuk penyajian.",
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
  const gpuMissing = !useWebGpu();

  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("How should the advice be explained?", "Bagaimana saran ini sebaiknya dijelaskan?")}
        </h2>
        <p className="text-muted-foreground">
          {t(
            "Pick one style now. You can come back and try another one on the same profile at any point.",
            "Pilih satu gaya dulu. Anda bisa kembali kapan saja untuk mencoba gaya lain dengan profil yang sama.",
          )}
        </p>
      </div>

      {GROUPS.map((group, gi) => {
        const block = (
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
                    <Check className="size-3.5" aria-hidden />
                    {t("Selected", "Dipilih")}
                  </span>
                )}
              </div>
              <h3 className="mt-3.5 font-semibold tracking-tight">{presetLabel(name, locale)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tr(locale, TAGLINES[name])}</p>
              {name === "llm" && (
                <Badge variant="secondary" className="mt-3 text-[11px]">
                  {blocked
                    ? t("needs a WebGPU browser", "perlu browser dengan WebGPU")
                    : t("downloads a model on first use", "mengunduh model saat pertama kali dipakai")}
                </Badge>
              )}
            </button>
          );
        })}
          </div>
        </div>
        );
        return gi === 0 ? block : null;
      })}

      <details className="rounded-2xl border border-border/70 bg-muted/40 p-5 text-sm">
          <summary className="cursor-pointer font-medium text-primary">
            {t("More ways to explain", "Cara menjelaskan lainnya")}
          </summary>
          <div className="mt-5 space-y-8">
            {GROUPS.slice(1).map((group) => (
              <div key={group.key} className="space-y-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">{tr(locale, group.title)}</h3>
                  <p className="text-sm text-muted-foreground">{tr(locale, group.note)}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((name) => {
                    const blocked = name === "llm" && gpuMissing;
                    const selected = preset === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        disabled={blocked}
                        aria-pressed={selected}
                        onClick={() => onPreset(name)}
                        className={`rounded-xl border bg-background p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                          selected ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/50"
                        }`}
                      >
                        <span className="block font-semibold">{presetLabel(name, locale)}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{tr(locale, TAGLINES[name])}</span>
                        {name === "llm" && (
                          <span className="mt-2 block text-xs text-muted-foreground">
                            {blocked
                              ? t("Needs a WebGPU browser.", "Perlu browser dengan WebGPU.")
                              : t("Downloads a model on first use.", "Mengunduh model saat pertama kali dipakai.")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          <div className="space-y-4 border-t border-border/70 pt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t("Build your own combination", "Susun kombinasi sendiri")}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("Content", "Isi")}
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
                {t("Modality of the why", "Bentuk penjelasan \"mengapa\"")}
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
                    { value: "sound", label: t("Sound advice", "Saran yang benar") },
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
                "Isi adalah apa yang dijelaskan: mengapa, apa yang bisa mengubahnya, dan seberapa yakin. Penyajian adalah cara penjelasan itu sampai kepada Anda: biasa, interaktif, disesuaikan dengan literasi, atau lewat percakapan. Setiap gaya adalah satu kombinasi keduanya, dan keduanya dicatat.",
              )}
            </p>
          </div>
          </div>
        </details>
    </div>
  );
}
