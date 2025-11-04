"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import {
  add,
  attachId,
  clear as clearHistory,
  load,
  type LocalSummary,
} from "@/lib/localHistory";

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

  const minLen = 20;
  const canSubmit = !loading && text.trim().length >= minLen;

  useEffect(() => {
    setRecent(load());

    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

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

      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to summarize");
      }

      const summaryText = (data as ApiOk).summary;
      const createdAt = new Date().toISOString();

      setSummary(summaryText);
      add({ originalText: text, summary: summaryText, createdAt });
      lastCreatedAtRef.current = createdAt;
      setRecent(load());
    } catch (e: any) {
      setError(e?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }, [text]);

  const handleRetry = useCallback(() => {
    setCopied(false);
    handleSummarize();
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

      alert("Summary saved!");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save summary");
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
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch (e: any) {
      setError(e?.message ?? "Unable to copy summary");
    }
  }, [summary]);

  const handleClearRecent = useCallback(() => {
    clearHistory();
    setRecent([]);
    lastCreatedAtRef.current = null;
  }, []);

  const recentEntries = recent.slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Summarize Text</h1>
        <p className="text-sm text-gray-600">
          Paste or type the content you want summarized and we'll generate a
          concise overview for you.
        </p>
      </header>

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
        <div className="space-y-2">
          <label htmlFor="input" className="text-sm font-medium text-gray-700">
            Source Text
          </label>
          <textarea
            id="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter at least 20 characters..."
            className="h-48 w-full rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            aria-invalid={Boolean(error)}
            aria-busy={loading}
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{text.trim().length} characters</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-indigo-600 transition hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={loading || (!text && !summary)}
            >
              Clear text
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSummarize}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {activeAction === "summarize" ? "Summarizing..." : "Summarize"}
          </button>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={loading || !summary}
          >
            Retry
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!summary || loading}
            title="Save this summary to your account"
          >
            {activeAction === "save" ? "Saving..." : "Confirm & Save"}
          </button>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      {summary && (
        <section className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 text-gray-900 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={copied}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">
            {summary}
          </p>
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Recent (local)</h2>
          <button
            type="button"
            onClick={handleClearRecent}
            className="text-xs font-medium text-indigo-600 transition hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={recentEntries.length === 0}
          >
            Clear
          </button>
        </div>

        {recentEntries.length === 0 ? (
          <p className="text-sm text-gray-500">
            Generate a summary to start building your local history.
          </p>
        ) : (
          <ul className="space-y-3">
            {recentEntries.map((item) => {
              const timestamp = new Date(item.createdAt);
              const formatted = Number.isNaN(timestamp.getTime())
                ? item.createdAt
                : timestamp.toLocaleString();

              return (
                <li
                  key={`${item.createdAt}-${item.id ?? "local"}`}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{formatted}</span>
                    {item.id && (
                      <span className="font-medium text-green-600">Saved</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-700" title={item.summary}>
                    {item.summary}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
