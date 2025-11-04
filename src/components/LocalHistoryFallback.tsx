"use client";

import { useEffect, useMemo, useState } from "react";

import type { LocalSummary } from "@/lib/localHistory";

const STORAGE_KEY = "ai-summarizer:history";

type LocalHistoryFallbackProps = {
  query?: string;
};

export function LocalHistoryFallback({ query }: LocalHistoryFallbackProps) {
  const [items, setItems] = useState<LocalSummary[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalSummary[];
        setItems(parsed);
      }
    } catch (error) {
      console.warn("Failed to load local history", error);
    }
  }, []);

  const filtered = useMemo(() => {
    if (!query) return items;
    const term = query.toLowerCase();
    return items.filter((item) => {
      const summaryMatch = item.summary.toLowerCase().includes(term);
      const originalMatch = item.originalText.toLowerCase().includes(term);
      return summaryMatch || originalMatch;
    });
  }, [items, query]);

  return (
    <section className="space-y-4">
      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
        Showing local data (DB unavailable)
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">
          {items.length === 0
            ? "No local summaries found."
            : "No local summaries match your search."}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.slice(0, 20).map((item) => {
            const date = new Date(item.createdAt);
            const formatted = Number.isNaN(date.getTime())
              ? item.createdAt
              : date.toLocaleString();

            return (
              <li
                key={`${item.createdAt}-${item.id ?? "local"}`}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatted}</span>
                  {item.id && (
                    <span className="font-mono text-[11px] text-gray-400">
                      {item.id}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  Summary
                </p>
                <p className="mt-1 text-sm text-gray-700">{item.summary}</p>
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  Original
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  {item.originalText}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
