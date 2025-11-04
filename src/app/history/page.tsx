import Link from "next/link";

import { CopyButton } from "@/components/CopyButton";
import { LocalHistoryFallback } from "@/components/LocalHistoryFallback";
import { prisma } from "@/server/prisma";

type SearchParams = Record<string, string | string[] | undefined>;

type HistoryPageProps = {
  searchParams?: SearchParams;
};

const DEFAULT_TAKE = 10;
const MAX_TAKE = 50;

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildSearchForm({
  q,
  limit,
}: {
  q?: string;
  limit: number;
}) {
  return (
    <form method="GET" className="flex gap-3">
      <label htmlFor="history-search" className="sr-only">
        Search summaries
      </label>
      <input
        id="history-search"
        name="q"
        defaultValue={q ?? ""}
        placeholder="Search summaries..."
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      />
      <input type="hidden" name="take" value={limit} />
      <button
        type="submit"
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      >
        Search
      </button>
    </form>
  );
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const q = getParam(searchParams?.q);
  const cursor = getParam(searchParams?.cursor);
  const takeParam = getParam(searchParams?.take);

  const parsedTake = Number.parseInt(takeParam ?? "", 10);
  const limit = Number.isNaN(parsedTake)
    ? DEFAULT_TAKE
    : Math.min(Math.max(parsedTake, 1), MAX_TAKE);

  const where = q
    ? {
        OR: [
          {
            summary: {
              contains: q,
              mode: "insensitive" as const,
            },
          },
          {
            originalText: {
              contains: q,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : undefined;

  const queryArgs = {
    where,
    orderBy: { createdAt: "desc" as const },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };

  let items:
    | Awaited<ReturnType<typeof prisma.summary.findMany>>
    | undefined;
  let nextCursor: string | null = null;
  let dbError = false;

  try {
    const results = await prisma.summary.findMany(queryArgs);
    items = results.slice(0, limit);
    nextCursor = results.length > limit ? results[limit].id : null;
  } catch (error) {
    console.error("Failed to load history from database", error);
    dbError = true;
  }

  const formatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("take", String(limit));

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">History</h1>
        <p className="text-sm text-gray-600">
          Search and browse summaries saved to the database.
        </p>
      </header>

      {buildSearchForm({ q, limit })}

      {dbError ? (
        <LocalHistoryFallback query={q} />
      ) : (
        <>
          <section className="space-y-4">
            {!items || items.length === 0 ? (
              <p className="text-sm text-gray-500">
                {q
                  ? "No summaries match your search."
                  : "No summaries found yet."}
              </p>
            ) : (
              <ul className="space-y-4">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatter.format(item.createdAt)}</span>
                      <span className="font-mono text-[11px] text-gray-400">
                        {item.id}
                      </span>
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Summary
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {item.summary}
                        </p>
                      </div>
                      <CopyButton
                        text={item.summary}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </div>
                    <p className="mt-3 text-sm font-medium text-gray-900">
                      Original
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      {item.originalText}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {nextCursor && (
            <Link
              href={`/history?${(() => {
                const nextParams = new URLSearchParams(params);
                nextParams.set("cursor", nextCursor as string);
                return nextParams.toString();
              })()}`}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              Next
            </Link>
          )}
        </>
      )}
    </div>
  );
}
