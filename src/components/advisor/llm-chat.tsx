"use client";

/* Conversational delivery: an open-weight language model runs in the
   browser through WebLLM, grounded ONLY on the ticked content facts. The
   opening explanation and the number of follow-up turns are reported to
   the parent so the study can log them verbatim. */

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as llm from "@/lib/llm";
import type { AdvisorResult } from "@/lib/advisor/types";
import { ExplanationCard } from "./explanation-boxes";

type Bubble = { role: "user" | "assistant"; text: string };

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
  onTurn?: () => void;
}) {
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
        { role: "system", content: llm.systemPrompt(result, content) },
        { role: "user", content: llm.OPENING_REQUEST },
      ];
      setBubbles([{ role: "assistant", text: "" }]);
      const text = await llm.chat(messagesRef.current, (t) =>
        setBubbles((b) => [...b.slice(0, -1), { role: "assistant", text: t }]),
      );
      messagesRef.current.push({ role: "assistant", content: text });
      onOpening?.(text, modelId);
      setReady(true);
      setStatus("Model ready. You can ask a follow-up question.");
    } catch {
      /* status already shows the error via onProgress */
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (autoStart && gpuOk && !startedRef.current) {
      startedRef.current = true;
      setStatus("Loading the language model. This can take a minute the first time.");
      void start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, gpuOk]);

  const ask = async () => {
    const q = input.trim();
    if (!q || !ready || busy) return;
    setInput("");
    setBusy(true);
    onTurn?.();
    messagesRef.current.push({ role: "user", content: q });
    setBubbles((b) => [...b, { role: "user", text: q }, { role: "assistant", text: "" }]);
    try {
      const text = await llm.chat(messagesRef.current, (t) =>
        setBubbles((b) => [...b.slice(0, -1), { role: "assistant", text: t }]),
      );
      messagesRef.current.push({ role: "assistant", content: text });
    } catch (err) {
      setBubbles((b) => [
        ...b.slice(0, -1),
        { role: "assistant", text: "The model could not answer: " + (err instanceof Error ? err.message : String(err)) },
      ]);
    } finally {
      setBusy(false);
    }
  };

  if (!gpuOk) {
    return (
      <ExplanationCard title="Ask the advisor">
        <p className="text-muted-foreground">
          This browser does not expose WebGPU, which the in-browser language model needs. Use a recent Chrome or Edge on
          a laptop with a GPU. All other explanation styles work everywhere.
        </p>
      </ExplanationCard>
    );
  }

  return (
    <ExplanationCard title="Ask the advisor">
      {showModelPicker && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger className="w-full max-w-md" aria-label="Language model">
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
            {ready && llm.loadedModelId() === modelId ? "Restart" : "Load model"}
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
              {b.text || <span className="italic text-muted-foreground">Thinking</span>}
            </div>
          ))}
        </div>
      )}

      {ready && (
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
            placeholder="Ask a follow-up question"
            aria-label="Your question"
          />
          <Button onClick={ask} disabled={busy || !input.trim()}>
            Ask
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        The language model only sees the facts computed by the advisor and is instructed to explain those. Its text is
        recorded in the study log. The model downloads once (about 1 GB) and is cached by your browser, then runs on
        your device&apos;s GPU. Nothing you type here leaves your device.
      </p>
    </ExplanationCard>
  );
}
