"use client";

/* Conversational delivery.

   Two answer paths. Questions that match the supported intent set are
   answered from the advisor's own computations by src/lib/advisor/intents.ts,
   so no number in those answers can be invented. Everything else goes to an
   open-weight language model running in the browser through WebLLM, grounded
   only on the ticked content facts. This is the hybrid prompt handling of
   Samimi et al. (CUI 2025), with a lexical matcher in place of their
   fine-tuned one, and the supported set taken from the XAI question bank of
   Liao, Gruen and Miller (CHI 2020).

   The routed path needs no GPU, so the suggested questions work on any
   device. The opening explanation, the turn counts and the matched intents
   are reported to the parent for the study log. */

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as llm from "@/lib/llm";
import type { AdvisorResult } from "@/lib/advisor/types";
import { answerFor, matchIntent, suggestedQuestions } from "@/lib/advisor/intents";
import { tr, useLang } from "@/lib/i18n";
import { Calculator, MessageSquareText } from "lucide-react";
import { ExplanationCard } from "./explanation-boxes";

type Bubble = { role: "user" | "assistant"; text: string; computed?: boolean };

export function LlmChat({
  result,
  content,
  showModelPicker,
  autoStart,
  onOpening,
  onTurn,
}: {
  result: AdvisorResult;
  content: string[];
  showModelPicker?: boolean;
  autoStart?: boolean;
  onOpening?: (text: string, modelId: string) => void;
  onTurn?: (info: { routed: boolean; intent?: string }) => void;
}) {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const [modelId, setModelId] = useState(llm.MODELS[0].id);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const messagesRef = useRef<llm.ChatMessage[]>([]);
  const startedRef = useRef(false);

  const gpuOk = llm.supported();

  useEffect(() => {
    const off = llm.onProgress((r) => {
      setStatus(r.text);
      setProgress(Math.round((r.progress || 0) * 100));
    });
    return off;
  }, []);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setBubbles([]);
    setReady(false);
    try {
      await llm.load(modelId);
      messagesRef.current = [
        { role: "system", content: llm.systemPrompt(result, content, locale) },
        { role: "user", content: llm.openingRequest(locale) },
      ];
      setBubbles([{ role: "assistant", text: "" }]);
      const text = await llm.chat(messagesRef.current, (tk) =>
        setBubbles((b) => [...b.slice(0, -1), { role: "assistant", text: tk }]),
      );
      messagesRef.current.push({ role: "assistant", content: text });
      onOpening?.(text, modelId);
      setReady(true);
      setStatus(
        t("Model ready. You can ask a follow-up question.", "Model siap. Anda bisa mengajukan pertanyaan lanjutan."),
      );
    } catch {
      /* status already shows the error via onProgress */
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (autoStart && gpuOk && !startedRef.current) {
      startedRef.current = true;
      setStatus(
        t(
          "Loading the language model. This can take a minute the first time.",
          "Memuat model bahasa. Kali pertama bisa memakan waktu sekitar satu menit.",
        ),
      );
      void start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, gpuOk]);

  const ask = async (preset?: string) => {
    const q = (preset ?? input).trim();
    if (!q || busy) return;
    setInput("");

    /* Route first. A matched question is answered from the computation, which
       is both faster and impossible to hallucinate. */
    const match = matchIntent(q, locale, result.escalated);
    const routed = match ? answerFor(match, result, locale) : null;
    if (routed) {
      onTurn?.({ routed: true, intent: match!.intent });
      setBubbles((b) => [...b, { role: "user", text: q }, { role: "assistant", text: routed, computed: true }]);
      /* Give the model the exchange too, so a later free-form question has it. */
      messagesRef.current.push({ role: "user", content: q }, { role: "assistant", content: routed });
      return;
    }

    if (!ready) {
      setBubbles((b) => [
        ...b,
        { role: "user", text: q },
        {
          role: "assistant",
          text: t(
            "I can answer that only with the language model, which is not loaded on this device. The suggested questions above are answered from the advisor's own numbers and work anywhere.",
            "Pertanyaan itu hanya bisa saya jawab dengan model bahasa, yang tidak termuat di perangkat ini. Pertanyaan yang disarankan di atas dijawab dari angka milik penasihat sendiri dan berfungsi di mana saja.",
          ),
        },
      ]);
      return;
    }

    setBusy(true);
    onTurn?.({ routed: false });
    messagesRef.current.push({ role: "user", content: q });
    setBubbles((b) => [...b, { role: "user", text: q }, { role: "assistant", text: "" }]);
    try {
      const text = await llm.chat(messagesRef.current, (tk) =>
        setBubbles((b) => [...b.slice(0, -1), { role: "assistant", text: tk }]),
      );
      messagesRef.current.push({ role: "assistant", content: text });
    } catch (err) {
      setBubbles((b) => [
        ...b.slice(0, -1),
        {
          role: "assistant",
          text:
            t("The model could not answer: ", "Model tidak bisa menjawab: ") +
            (err instanceof Error ? err.message : String(err)),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };


  return (
    <ExplanationCard icon={MessageSquareText} title={t("Ask the advisor", "Tanya penasihat")}>
      {showModelPicker && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger className="w-full max-w-md" aria-label={t("Language model", "Model bahasa")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {llm.MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={start} disabled={busy}>
            {ready && llm.loadedModelId() === modelId ? t("Restart", "Mulai ulang") : t("Load model", "Muat model")}
          </Button>
        </div>
      )}
      {status && (
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {status}
        </p>
      )}
      {busy && progress > 0 && progress < 100 && <Progress value={progress} className="h-1.5" />}

      {bubbles.length > 0 && (
        <div className="max-h-80 space-y-2 overflow-y-auto" aria-live="polite">
          {bubbles.map((b, i) => (
            <div
              key={i}
              className={`max-w-[92%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                b.role === "assistant" ? "bg-muted" : "ml-auto bg-primary text-primary-foreground"
              }`}
            >
              {b.text || <span className="italic text-muted-foreground">{t("Thinking", "Berpikir")}</span>}
              {b.computed && (
                <span className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                  <Calculator className="size-3" aria-hidden />
                  {t("Computed by the advisor, not written by the model", "Dihitung oleh penasihat, bukan ditulis model")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {suggestedQuestions(result, locale).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void ask(q)}
            disabled={busy}
            className="rounded-full border border-border/80 px-3 py-1.5 text-xs transition-colors hover:border-primary/50 hover:bg-muted disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {(
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void ask();
              }
            }}
            placeholder={t("Ask a follow-up question", "Ajukan pertanyaan lanjutan")}
            aria-label={t("Your question", "Pertanyaan Anda")}
          />
          <Button onClick={() => void ask()} disabled={busy || !input.trim()}>
            {t("Ask", "Tanya")}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {t(
          "The suggested questions are answered from the advisor's own computations, so those answers cannot be invented and they work on any device. Other questions go to a language model that only sees the computed facts. It downloads once (about 1 GB), is cached by your browser, needs WebGPU, and runs on your device. Nothing you type here leaves your device, and the text is recorded in the study log.",
          "Pertanyaan yang disarankan dijawab dari hasil perhitungan penasihat sendiri, sehingga jawabannya tidak mungkin dikarang dan berfungsi di perangkat apa pun. Pertanyaan lain diteruskan ke model bahasa yang hanya melihat fakta yang telah dihitung. Model itu diunduh sekali (sekitar 1 GB), disimpan cache oleh browser Anda, membutuhkan WebGPU, dan berjalan di perangkat Anda. Tidak ada yang Anda ketik di sini yang meninggalkan perangkat Anda, dan teksnya direkam dalam log studi.",
        )}
      </p>
    </ExplanationCard>
  );
}
