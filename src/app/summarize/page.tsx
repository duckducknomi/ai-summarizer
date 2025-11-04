"use client";

import { useState, useCallback } from "react";

type ApiOk = { summary: string };
type ApiErr = { error?: { code?: string; message?: string } };

export default function SummarizePage() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minLen = 20;
  const canSubmit = !loading && text.trim().length >= minLen;

  const handleSummarize = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data: ApiOk & ApiErr = await res.json();
      if (!res.ok)
        throw new Error(data?.error?.message || "Failed to summarize");
      setSummary((data as ApiOk).summary);
    } catch (e: any) {
      setError(e.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [text]);

  const handleRetry = useCallback(() => {
    handleSummarize();
  }, [handleSummarize]);

  const handleConfirmSave = useCallback(async () => {
    alert("Save will be enabled in the next step.");
  }, []);

  const handleClear = useCallback(() => {
    setText("");
    setSummary(null);
    setError(null);
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Summarize Text</h1>
        <p className="text-sm text-gray-600">
          Paste or type the content you want summarized and we’ll generate a
          concise overview for you.
        </p>
      </header>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-md p-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="input" className="text-sm font-medium text-gray-700">
            Source Text
          </label>
          <textarea
            id="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter at least 20 characters..."
            className="w-full h-48 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
            aria-invalid={Boolean(error)}
            aria-busy={loading}
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{text.trim().length} characters</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-indigo-500 hover:underline"
              disabled={loading || (!text && !summary)}
            >
              Clear text
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSummarize}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Summarizing…" : "Summarize"}
          </button>
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            disabled={loading || !summary}
          >
            Retry
          </button>
          <button
            onClick={handleConfirmSave}
            className="px-4 py-2 rounded-xl bg-green-600 text-white disabled:opacity-40"
            disabled={!summary || loading}
            title="Will save to DB in the next section"
          >
            Confirm & Save
          </button>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>

      {summary && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
          <h2 className="font-medium text-gray-900">Summary</h2>
          <p className="whitespace-pre-wrap text-gray-700">{summary}</p>
        </section>
      )}
    </div>
  );
}
