"use client";

/* The suitability profile form. Controlled: the parent owns the profile
   state. Includes the optional free-text description that the in-browser
   language model reads into the fields (facts extracted by the model, the
   judgement calls computed in code, fields it could not read left alone). */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { EXAMPLE_PROFILES } from "@/lib/advisor/model";
import type { RawProfile } from "@/lib/advisor/types";
import { tr, useLang } from "@/lib/i18n";
import * as llm from "@/lib/llm";
import benchData from "@/data/ils_bench_cases.json";

export interface FormProfile extends RawProfile {
  tolerance: "low" | "medium" | "high";
  toleranceInconsistent: boolean;
  emergencyFund: boolean;
  incomeStable: boolean;
  debtObligations: boolean;
  nearTermNeed: boolean;
  knowledge: string;
}

export const DEFAULT_PROFILE: FormProfile = {
  age: 35,
  horizon: 15,
  tolerance: "medium",
  toleranceInconsistent: false,
  emergencyFund: true,
  incomeStable: true,
  debtObligations: false,
  nearTermNeed: false,
  knowledge: "intermediate",
};

const EXAMPLE_LABELS_ID: Record<string, string> = {
  young: "Investor muda berhorizon panjang",
  midcareer: "Karier menengah, tanpa jaring pengaman",
  retirement: "Investor menjelang pensiun",
  escalation: "Horizon pendek, tanpa penyangga",
};

interface IlsCase {
  id: string;
  narrative: string;
  evidence: string;
  tolerance: string;
  capacity: string;
  liquidity: string;
  portfolio: string;
  escalation: string;
}

export function Seg({
  options,
  value,
  onChange,
  name,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="inline-flex flex-wrap overflow-hidden rounded-lg border bg-background">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-2 text-sm transition-colors not-last:border-r ${
            value === o.value ? "bg-primary font-medium text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProfileForm({
  profile,
  onChange,
  showNarrative = true,
  onSourceChange,
}: {
  profile: FormProfile;
  onChange: (p: FormProfile) => void;
  showNarrative?: boolean;
  onSourceChange?: (source: "form" | "example" | "ils-bench" | "narrative") => void;
}) {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const [narrative, setNarrative] = useState("");
  const [narrativeStatus, setNarrativeStatus] = useState("");
  const [reading, setReading] = useState(false);
  const [ilsCase, setIlsCase] = useState<IlsCase | null>(null);

  const set = (next: Partial<FormProfile>) => onChange({ ...profile, ...next });

  const loadExample = (id: string) => {
    const ex = EXAMPLE_PROFILES.find((e) => e.id === id);
    if (!ex) return;
    setIlsCase(null);
    onSourceChange?.("example");
    onChange({ ...DEFAULT_PROFILE, ...ex.profile, toleranceInconsistent: false } as FormProfile);
  };

  const loadIlsCase = () => {
    const cases = (benchData as { cases: IlsCase[] }).cases;
    const c = cases[Math.floor(Math.random() * cases.length)];
    setNarrative(c.narrative);
    setIlsCase(c);
    setNarrativeStatus("");
    onSourceChange?.("ils-bench");
  };

  const readNarrative = async () => {
    const text = narrative.trim();
    if (!text) {
      setNarrativeStatus(t("Write or load a description first.", "Tulis atau muat deskripsi terlebih dahulu."));
      return;
    }
    if (!llm.supported()) {
      setNarrativeStatus(
        t(
          "This browser has no WebGPU, the language model cannot run here.",
          "Browser ini tidak punya WebGPU, model bahasa tidak bisa berjalan di sini.",
        ),
      );
      return;
    }
    setReading(true);
    setNarrativeStatus(
      llm.isReady()
        ? t("Reading the description", "Membaca deskripsi")
        : t("Loading the language model, then reading the description", "Memuat model bahasa, lalu membaca deskripsi"),
    );
    const off = llm.onProgress((r) => {
      if (!llm.isReady()) setNarrativeStatus(r.text);
    });
    try {
      await llm.load(llm.MODELS[0].id);
      setNarrativeStatus(t("Reading the description", "Membaca deskripsi"));
      const reply = await llm.complete(llm.extractionMessages(text), 200);
      const ex = llm.parseExtraction(reply);
      if (!ex) {
        setNarrativeStatus(
          t(
            "The model did not return anything readable. Try again or fill in the form by hand.",
            "Model tidak mengembalikan apa pun yang terbaca. Coba lagi atau isi formulir secara manual.",
          ),
        );
        return;
      }
      const pf = llm.profileFromExtraction(ex);
      const filled: string[] = [];
      const missing: string[] = [];
      const F = {
        age: t("age", "usia"),
        when: t("when the money is needed", "kapan uang dibutuhkan"),
        tol: t("risk tolerance", "toleransi risiko"),
        fund: t("emergency fund", "dana darurat"),
        income: t("income", "pendapatan"),
        debt: t("debt", "utang"),
        need: t("near-term need", "kebutuhan jangka pendek"),
      };
      const next: Partial<FormProfile> = { toleranceInconsistent: pf.toleranceInconsistent };
      if (pf.age !== null) (next.age = pf.age), filled.push(F.age);
      else missing.push(F.age);
      if (pf.horizon !== null) (next.horizon = pf.horizon), filled.push(F.when);
      else missing.push(F.when);
      if (pf.tolerance) (next.tolerance = pf.tolerance), filled.push(F.tol);
      else missing.push(F.tol);
      if (pf.emergencyFund !== null) (next.emergencyFund = pf.emergencyFund), filled.push(F.fund);
      else missing.push(F.fund);
      if (pf.incomeStable !== null) (next.incomeStable = pf.incomeStable), filled.push(F.income);
      else missing.push(F.income);
      if (pf.debtObligations !== null) (next.debtObligations = pf.debtObligations), filled.push(F.debt);
      else missing.push(F.debt);
      if (pf.nearTermNeed !== null) (next.nearTermNeed = pf.nearTermNeed), filled.push(F.need);
      else missing.push(F.need);
      set(next);
      onSourceChange?.(ilsCase ? "ils-bench" : "narrative");
      const filledText = filled.join(", ") || t("nothing", "tidak ada");
      const missingText = missing.length
        ? t(
            `. Not found in the text: ${missing.join(", ")}, left as they were.`,
            `. Tidak ditemukan dalam teks: ${missing.join(", ")}, dibiarkan seperti semula.`,
          )
        : ".";
      setNarrativeStatus(
        t(`Filled: ${filledText}`, `Terisi: ${filledText}`) +
          missingText +
          (pf.toleranceInconsistent
            ? t(
                " Risk attitude read as Inconsistent (high stated appetite against a weak position).",
                " Sikap risiko terbaca Tidak konsisten (selera tinggi yang dinyatakan berlawanan dengan posisi yang lemah).",
              )
            : ""),
      );
    } catch (err) {
      setNarrativeStatus(
        t("Could not read the description: ", "Tidak bisa membaca deskripsi: ") +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      off();
      setReading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
          <Label htmlFor="example-select">{t("Load an example profile", "Muat profil contoh")}</Label>
          <Select onValueChange={loadExample}>
            <SelectTrigger id="example-select" className="w-full max-w-72">
              <SelectValue placeholder={t("Choose a profile", "Pilih profil")} />
            </SelectTrigger>
            <SelectContent>
              {EXAMPLE_PROFILES.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  {locale === "id" ? (EXAMPLE_LABELS_ID[ex.id] ?? ex.label) : ex.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="age">{t("Age", "Usia")}</Label>
        <Input
          id="age"
          type="number"
          min={18}
          max={80}
          value={profile.age}
          className="max-w-28"
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) set({ age: Math.min(80, Math.max(18, Math.round(v))) });
          }}
        />
        <p className="text-xs text-muted-foreground">{t("18 to 80.", "18 sampai 80.")}</p>
      </div>

      <div className="space-y-1.5">
        <Label>
          {t("Investment horizon:", "Horizon investasi:")} <span className="tabular-nums text-primary">{profile.horizon}</span>{" "}
          {t("years", "tahun")}
        </Label>
        <Slider min={1} max={40} step={1} value={[profile.horizon]} onValueChange={(v: number[]) => set({ horizon: v[0] })} aria-label={t("Investment horizon", "Horizon investasi")} />
        <p className="text-xs text-muted-foreground">
          {t("How many years until you expect to need this money.", "Berapa tahun lagi Anda memperkirakan membutuhkan uang ini.")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>{t("Risk tolerance", "Toleransi risiko")}</Label>
        <Seg
          name={t("Risk tolerance", "Toleransi risiko")}
          options={[
            { value: "low", label: t("Low", "Rendah") },
            { value: "medium", label: t("Medium", "Sedang") },
            { value: "high", label: t("High", "Tinggi") },
          ]}
          value={profile.tolerance}
          onChange={(v) => set({ tolerance: v as FormProfile["tolerance"], toleranceInconsistent: false })}
        />
        {profile.toleranceInconsistent && (
          <p className="text-xs">
            <Badge variant="secondary" className="bg-amber-100 text-amber-900">
              {t(
                "Risk tolerance read as Inconsistent from the description",
                "Toleransi risiko terbaca Tidak konsisten dari deskripsi",
              )}
            </Badge>{" "}
            <button type="button" className="text-muted-foreground underline" onClick={() => set({ toleranceInconsistent: false })}>
              {t("Clear", "Hapus")}
            </button>
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>
          {t("Emergency fund covering at least 6 months of expenses", "Dana darurat yang menutup minimal 6 bulan pengeluaran")}
        </Label>
        <Seg
          name={t("Emergency fund", "Dana darurat")}
          options={[
            { value: "yes", label: t("Yes", "Ya") },
            { value: "no", label: t("No", "Tidak") },
          ]}
          value={profile.emergencyFund ? "yes" : "no"}
          onChange={(v) => set({ emergencyFund: v === "yes" })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("Income stability", "Stabilitas pendapatan")}</Label>
        <Seg
          name={t("Income stability", "Stabilitas pendapatan")}
          options={[
            { value: "stable", label: t("Stable", "Stabil") },
            { value: "variable", label: t("Variable", "Tidak tetap") },
          ]}
          value={profile.incomeStable ? "stable" : "variable"}
          onChange={(v) => set({ incomeStable: v === "stable" })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("Significant debt or large fixed obligations", "Utang besar atau kewajiban tetap yang besar")}</Label>
        <Seg
          name={t("Debt and obligations", "Utang dan kewajiban")}
          options={[
            { value: "no", label: t("No", "Tidak") },
            { value: "yes", label: t("Yes", "Ya") },
          ]}
          value={profile.debtObligations ? "yes" : "no"}
          onChange={(v) => set({ debtObligations: v === "yes" })}
        />
        <p className="text-xs text-muted-foreground">
          {t(
            "For example high-interest debt, or fixed expenses that leave little room. Lowers risk capacity.",
            "Misalnya utang berbunga tinggi, atau pengeluaran tetap yang menyisakan sedikit ruang. Menurunkan kapasitas risiko.",
          )}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>
          {t("Could you need this money much sooner than planned?", "Mungkinkah Anda membutuhkan uang ini jauh lebih cepat dari rencana?")}
        </Label>
        <Seg
          name={t("Near-term need", "Kebutuhan jangka pendek")}
          options={[
            { value: "no", label: t("No", "Tidak") },
            { value: "yes", label: t("Yes", "Ya") },
          ]}
          value={profile.nearTermNeed ? "yes" : "no"}
          onChange={(v) => set({ nearTermNeed: v === "yes" })}
        />
        <p className="text-xs text-muted-foreground">
          {t(
            "For example rent, tuition or a tax bill within a year or two. Makes the liquidity need urgent whatever the horizon.",
            "Misalnya sewa, uang kuliah, atau tagihan pajak dalam satu dua tahun. Membuat kebutuhan likuiditas mendesak berapa pun horizonnya.",
          )}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>{t("Financial knowledge, self-rated", "Pengetahuan keuangan, penilaian sendiri")}</Label>
        <Seg
          name={t("Financial knowledge", "Pengetahuan keuangan")}
          options={[
            { value: "beginner", label: t("Beginner", "Pemula") },
            { value: "intermediate", label: t("Intermediate", "Menengah") },
            { value: "advanced", label: t("Advanced", "Mahir") },
          ]}
          value={profile.knowledge}
          onChange={(v) => set({ knowledge: v })}
        />
        <p className="text-xs text-muted-foreground">
          {t(
            "Recorded only, it does not affect the recommendation. In the study it is a moderator variable.",
            "Hanya direkam, tidak memengaruhi rekomendasi. Dalam studi ini menjadi variabel moderator.",
          )}
        </p>
      </div>

      {showNarrative && (
        <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
          <Label htmlFor="narrative">
            {t("Or describe your situation in your own words", "Atau gambarkan situasi Anda dengan kata-kata sendiri")}
          </Label>
          <Textarea
            id="narrative"
            rows={4}
            value={narrative}
            onChange={(e) => {
              setNarrative(e.target.value);
              setIlsCase(null);
            }}
            placeholder={t(
              "For example: I am 52, saving for retirement in about 12 years, steady salary, six months of expenses in the bank, and I can live with market swings.",
              "Misalnya: Saya berusia 52 tahun, menabung untuk pensiun sekitar 12 tahun lagi, gaji tetap, enam bulan pengeluaran di bank, dan saya sanggup menghadapi naik turun pasar.",
            )}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={readNarrative} disabled={reading}>
              {t("Read description into the form", "Baca deskripsi ke dalam formulir")}
            </Button>
            <Button size="sm" variant="ghost" onClick={loadIlsCase}>
              {t("Load an ILS-Bench case", "Muat kasus ILS-Bench")}
            </Button>
          </div>
          {narrativeStatus && (
            <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
              {narrativeStatus}
            </p>
          )}
          {ilsCase && (
            <div className="space-y-1 rounded-lg border bg-background p-3 text-xs">
              <p className="font-semibold text-primary">{ilsCase.id} (ILS-Bench, {t("expert consensus", "konsensus ahli")})</p>
              <p>
                {t("Recommended outcome", "Hasil yang direkomendasikan")}: {ilsCase.portfolio}
                {ilsCase.escalation === "Yes" ? t(" (escalate to a human)", " (eskalasi ke manusia)") : ""}
              </p>
              <p>
                {t("Risk tolerance", "Toleransi risiko")} {ilsCase.tolerance}, {t("risk capacity", "kapasitas risiko")}{" "}
                {ilsCase.capacity}, {t("liquidity need", "kebutuhan likuiditas")} {ilsCase.liquidity}
              </p>
              <p className="text-muted-foreground">
                {t("Evidence the experts pointed to", "Bukti yang dirujuk para ahli")}: {ilsCase.evidence}
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {t(
              "The in-browser language model reads the description and fills in the fields above, following the ILS-Bench language-to-suitability procedure. Check the fields before continuing. The reading step works best with English descriptions.",
              "Model bahasa dalam browser membaca deskripsi dan mengisi isian di atas, mengikuti prosedur bahasa-ke-kesesuaian ILS-Bench. Periksa isiannya sebelum melanjutkan. Langkah pembacaan bekerja paling baik dengan deskripsi berbahasa Inggris.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
