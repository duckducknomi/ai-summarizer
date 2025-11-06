"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/components/Toast";
import {
  add,
  attachId,
  clear as clearHistory,
  load,
  type LocalSummary,
} from "@/lib/localHistory";
import { useAutosizeTextArea } from "@/lib/useAutosize";
import { Button } from "@/components/Button";
import CopyButton from "@/components/CopyButton";

type ApiOk = { summary: string };
type ApiErr = { error?: { code?: string; message?: string } };
type SaveOk = { id: string; createdAt: string };

const MIN_LEN = 20;

export default function SummarizePage() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<LocalSummary[]>([]);
  const [activeAction, setActiveAction] = useState<"summarize" | "save" | null>(
    null
  );
  /** Prevent duplicate saves of the same summary */
  const [savedId, setSavedId] = useState<string | null>(null);

  const lastCreatedAtRef = useRef<string | null>(null);
  const lastSummarizedTextRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { success, error: toastError } = useToast();

  // Enable Summarize only if: not loading, long enough, AND text changed since last summarize
  const canSubmit =
    !loading &&
    text.trim().length >= MIN_LEN &&
    text !== lastSummarizedTextRef.current;

  // Load recent local history 
  useEffect(() => {
    setRecent(load());
  }, []);

  useAutosizeTextArea(textareaRef.current, text);

  const recentEntries = useMemo(() => recent.slice(0, 3), [recent]);

  // Map API error payloads to friendly messages
  const messageFromApiError = (status: number, payload?: ApiErr) => {
    const msg = payload?.error?.message;
    if (status === 429)
      return msg || "Too many requests. Please try again shortly.";
    if (status === 413) return msg || "Your input is too long.";
    if (status >= 500)
      return "Service is temporarily unavailable. Please retry.";
    return msg || "Unexpected error";
  };

  const handleSummarize = useCallback(async () => {
    setLoading(true);
    setActiveAction("summarize");
    setError(null);
    setSummary(null);
    setSavedId(null); // new run -> allow saving again when we get a fresh summary

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        const friendly = messageFromApiError(res.status, data as ApiErr);
        throw new Error(friendly);
      }

      const summaryText = (data as ApiOk).summary ?? "";
      const createdAt = new Date().toISOString();

      setSummary(summaryText);
      setSavedId(null); // fresh summary -> not saved yet
      add({ originalText: text, summary: summaryText, createdAt });
      lastCreatedAtRef.current = createdAt;
      lastSummarizedTextRef.current = text;
      setRecent(load());
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }, [text, toastError]);

  const handleRetry = useCallback(() => {
    setSavedId(null); // retry means we'll produce a new summary
    void handleSummarize();
  }, [handleSummarize]);

  const handleConfirmSave = useCallback(async () => {
    if (!summary) return;
    setLoading(true);
    setActiveAction("save");
    setError(null);

    try {
      const res = await fetch("/api/save-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText: text, summary }),
      });

      const payload: (ApiErr & Partial<SaveOk>) | undefined = await res
        .json()
        .catch(() => undefined);

      if (!res.ok) {
        const friendly = messageFromApiError(res.status, payload);
        throw new Error(friendly);
      }

      const { id } = (payload ?? {}) as SaveOk;
      if (id && lastCreatedAtRef.current) {
        attachId(lastCreatedAtRef.current, id);
        setRecent(load());
      }
      if (id) setSavedId(id); // lock the Save button for this summary
      success("Summary saved!");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save summary";
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }, [summary, text, success, toastError]);

  const handleClear = useCallback(() => {
    setText("");
    setSummary(null);
    setError(null);
    setSavedId(null);
    lastCreatedAtRef.current = null;
    lastSummarizedTextRef.current = null;
  }, []);

  const handleClearRecent = useCallback(() => {
    clearHistory();
    setRecent([]);
    lastCreatedAtRef.current = null;
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Summarize Text</h1>
        <p className="text-sm text-(--ink)/70">
          Paste or type the content you want summarized and we&apos;ll generate
          a concise overview for you.
        </p>
      </header>

      {/* Split view: left editor, right sticky aside */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_420px]">
        {/* LEFT: Editor */}
        <section className="space-y-2">
          <div className="space-y-4 rounded-2xl border border-[var(--brand)/15] bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <label
                htmlFor="input"
                className="text-sm font-medium text-foreground"
              >
                Source Text
              </label>
              <textarea
                id="input"
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter at least 20 characters..."
                className="w-full rounded-xl border border-gray-300 p-3 text-ink"
                aria-invalid={Boolean(error)}
                aria-busy={loading}
              />
              <div className="flex items-center justify-between text-xs text-(--ink)/60">
                <span>{text.trim().length} characters</span>
                <Button
                  onClick={handleClear}
                  variant="ghost"
                  size="sm"
                  className="text-brand"
                  disabled={loading || (!text && !summary)}
                >
                  Clear text
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSummarize}
                disabled={!canSubmit}
                loading={activeAction === "summarize"}
                variant="primary"
              >
                {activeAction === "summarize" ? "Summarizing…" : "Summarize"}
              </Button>

              <Button
                onClick={handleRetry}
                disabled={loading || !summary}
                variant="secondary"
              >
                Retry
              </Button>

              <Button
                onClick={handleConfirmSave}
                disabled={!summary || loading || !!savedId}
                title="Save this summary to your account"
                loading={activeAction === "save"}
                variant="ghost"
              >
                {savedId
                  ? "Saved"
                  : activeAction === "save"
                  ? "Saving…"
                  : "Save"}
              </Button>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </section>

        {/* RIGHT: Sticky aside */}
        <aside className="space-y-4 md:sticky md:top-20 h-fit">
          {summary && (
            <section className="space-y-3 rounded-2xl border border-[var(--brand)/15] bg-white p-6 text-ink shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Summary
                </h2>
                <CopyButton text={summary} size="sm" variant="secondary" />
              </div>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-ink">
                {summary}
              </p>
            </section>
          )}

          <section className="space-y-4 rounded-2xl border border-[var(--brand)/15] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Recent (local)
              </h2>
              <Button
                onClick={handleClearRecent}
                variant="ghost"
                size="sm"
                className="text-brand"
                disabled={loading || recentEntries.length === 0}
              >
                Clear Recent
              </Button>
            </div>

            {recentEntries.length === 0 ? (
              <p className="text-sm text-(--ink)/60">
                Generate a summary to start building your local history.
              </p>
            ) : (
              <ul className="max-h-[360px] space-y-2 overflow-auto pr-1">
                {recentEntries.map((item) => {
                  const ts = new Date(item.createdAt);
                  const formatted = Number.isNaN(ts.getTime())
                    ? item.createdAt
                    : ts.toLocaleString();
                  return (
                    <li
                      key={`${item.createdAt}-${item.id ?? "local"}`}
                      className="rounded-xl border border-[var(--brand)/15] bg-gray-50 p-3"
                    >
                      <div className="flex items-center justify-between text-[11px] text-(--ink)/60">
                        <span>{formatted}</span>
                        {item.id && (
                          <span className="font-medium text-green-600">
                            Saved
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-ink" title={item.summary}>
                        {item.summary}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
