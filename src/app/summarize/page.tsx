"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/components/Toast";
import {
  add,
  attachId,
  clear as clearHistory,
  load,
  type LocalSummary,
} from "@/lib/localHistory";
import { useAutosizeTextArea } from "@/lib/useAutosize";

type ApiOk = { summary: string };
type ApiErr = { error?: { code?: string; message?: string } };
type SaveOk = { id: string; createdAt: string };

export default function SummarizePage() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<LocalSummary[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeAction, setActiveAction] = useState<"summarize" | "save" | null>(
    null
  );

  const lastCreatedAtRef = useRef<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { success, error: toastError } = useToast();

  const minLen = 20;
  const canSubmit = !loading && text.trim().length >= minLen;

  useEffect(() => {
    setRecent(load());
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useAutosizeTextArea(textareaRef.current, text);

  const handleSummarize = useCallback(async () => {
    setLoading(true);
    setActiveAction("summarize");
    setError(null);
    setSummary(null);
    setCopied(false);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data: ApiOk & ApiErr = await res.json();
      if (!res.ok)
        throw new Error(data?.error?.message || "Failed to summarize");

      const summaryText = (data as ApiOk).summary;
      const createdAt = new Date().toISOString();

      setSummary(summaryText);
      add({ originalText: text, summary: summaryText, createdAt });
      lastCreatedAtRef.current = createdAt;
      setRecent(load());
    } catch (e: any) {
      const message = e?.message ?? "Unexpected error";
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }, [text]);

  const handleRetry = useCallback(() => {
    setCopied(false);
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
        throw new Error(
          payload?.error?.message ||
            (typeof (payload as any)?.message === "string"
              ? (payload as any).message
              : "") ||
            "Failed to save summary"
        );
      }

      const { id } = (payload ?? {}) as SaveOk;
      if (id && lastCreatedAtRef.current) {
        attachId(lastCreatedAtRef.current, id);
        setRecent(load());
      }
      success("Summary saved!");
    } catch (e: any) {
      const message = e?.message ?? "Failed to save summary";
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }, [summary, text]);

  const handleClear = useCallback(() => {
    setText("");
    setSummary(null);
    setError(null);
    setCopied(false);
    lastCreatedAtRef.current = null;
  }, []);

  const handleCopy = useCallback(async () => {
    if (!summary || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch (e: any) {
      const message = e?.message ?? "Unable to copy summary";
      setError(message);
      toastError(message);
    }
  }, [summary]);

  const handleClearRecent = useCallback(() => {
    clearHistory();
    setRecent([]);
    lastCreatedAtRef.current = null;
  }, []);

  const recentEntries = recent.slice(0, 3);

  const Spinner = () => (
    <svg
      className="mr-2 h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">
          Summarize Text
        </h1>
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
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-medium text-brand hover:opacity-90 disabled:opacity-40"
                  disabled={loading || (!text && !summary)}
                >
                  Clear text
                </button>
              </div>
            </div>

            {/* Buttons row */}
            <div className="flex flex-wrap gap-2">
              {/* Summarize (primary) */}
              <button
                type="button"
                onClick={handleSummarize}
                disabled={!canSubmit}
                className={[
                  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition",
                  "bg-[#9A2839] text-white hover:bg-[#7f2230] focus-visible:ring-[#9A2839]/40",
                  "disabled:opacity-50 disabled:hover:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {activeAction === "summarize" ? (
                  <>
                    <Spinner />
                    Summarizing…
                  </>
                ) : (
                  "Summarize"
                )}
              </button>

              {/* Retry */}
              <button
                type="button"
                onClick={handleRetry}
                disabled={loading || !summary}
                className={[
                  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition",
                  "border border-gray-300 bg-gray-100 text-ink hover:bg-gray-200",
                  "disabled:opacity-50 disabled:hover:bg-gray-100 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                Retry
              </button>

              {/* Save */}
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={!summary || loading}
                title="Save this summary to your account"
                className={[
                  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition",
                  "border border-gray-300 bg-white text-ink hover:bg-gray-50",
                  "disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {activeAction === "save" ? (
                  <>
                    <Spinner />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </button>
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
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-ink transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={copied}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
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
              <button
                type="button"
                onClick={handleClearRecent}
                className="text-xs font-medium text-brand hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={recentEntries.length === 0}
              >
                Clear
              </button>
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
                      <p
                        className="mt-2 text-sm text-ink"
                        title={item.summary}
                      >
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
