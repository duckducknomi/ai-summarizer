import { prisma } from "@/server/prisma";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import { Button } from "@/components/Button";
import { Summary } from "@/generated/prisma/client";


export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    take?: string;
    cursor?: string;
    direction?: "next" | "prev";
  }>;
}) {
  const sp = await searchParams;

  const q = (sp?.q ?? "").trim();
  const takeParam = Number(sp?.take);
  const take = Number.isFinite(takeParam)
    ? Math.max(1, Math.min(50, takeParam))
    : 10;

  const cursor = sp?.cursor || undefined;
  const direction = (sp?.direction as "next" | "prev" | undefined) ?? "next";

  // Optional search
  const where =
    q.length > 0
      ? {
          OR: [
            { summary: { contains: q, mode: "insensitive" as const } },
            { originalText: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : undefined;

  // When going "prev", we fetch ascending (older -> newer), then reverse
  const orderBy =
    direction === "prev"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  // Fetch one extra to know if there's a next page in that direction
  let results: Summary[] = await prisma.summary.findMany({
    where,
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy,
    select: { id: true, originalText: true, summary: true, createdAt: true },
  });

  // If  fetched in ascending for "prev", reverse to display newest → oldest
  if (direction === "prev") {
    results = results.reverse();
  }

  const hasNext = results.length > take;
  if (hasNext) results = results.slice(0, take);

  const firstId = results[0]?.id;
  const lastId = results[results.length - 1]?.id;
  const nextCursor = hasNext ? lastId : undefined;

  const showPrev = Boolean(cursor && firstId);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-4 space-y-1">
        <h1 className="text-3xl font-bold text-foreground">History</h1>
        <p className="text-sm text-(--ink)/70">
          Search and browse summaries saved to the database.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_420px]">
        {/* LEFT: search + results */}
        <section className="space-y-4">
          {/* Search */}
          <form
            action="/history"
            className="rounded-2xl border border-[var(--brand)/15] bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search summaries…"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-ink"
              />
              {/* Preserve page size; reset cursor/direction on new searches */}
              <input type="hidden" name="take" value={take} />
              <Button type="submit" variant="primary">
                Search
              </Button>
              {q && (
                <Link
                  href={{ pathname: "/history", query: { take } }}
                  className="text-sm text-brand hover:opacity-90"
                >
                  Clear search
                </Link>
              )}
            </div>
          </form>

          {/* Results */}
          {results.length === 0 ? (
            <p className="text-sm text-(--ink)/60">No summaries found.</p>
          ) : (
            <div className="space-y-4">
              {results.map((s) => (
                <article
                  key={s.id}
                  className="rounded-2xl border border-[var(--brand)/15] bg-white p-6 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <time className="text-xs text-(--ink)/60">
                      {new Date(s.createdAt).toLocaleString()}
                    </time>
                    <CopyButton
                      text={s.summary}
                      size="sm"
                      variant="secondary"
                    />
                  </div>

                  <h3 className="text-sm font-semibold text-foreground">
                    Summary
                  </h3>
                  <p className="mt-1 max-w-prose leading-7 text-ink">
                    {s.summary}
                  </p>

                  <h4 className="mt-4 text-sm font-semibold text-foreground">
                    Original
                  </h4>
                  <p className="mt-1 leading-7 text-ink">{s.originalText}</p>

                  <div className="mt-3 text-[11px] text-(--ink)/60">
                    id: {s.id}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination (Prev / Next) */}
          <div className="mt-2 flex items-center justify-between">
            {/* Prev: show when we navigated via cursor (we're not at the very beginning) */}
            {showPrev ? (
              <Link
                className="rounded-lg border px-3 py-1.5 text-sm text-foreground hover:bg-[var(--brand)/10]"
                href={{
                  pathname: "/history",
                  query: {
                    q,
                    take,
                    cursor: firstId, // navigate back using the first visible item
                    direction: "prev",
                  },
                }}
              >
                ← Prev
              </Link>
            ) : (
              <span />
            )}

            {/* Next */}
            {hasNext && nextCursor ? (
              <Link
                className="rounded-lg border px-3 py-1.5 text-sm text-foreground hover:bg-[var(--brand)/10]"
                href={{
                  pathname: "/history",
                  query: {
                    q,
                    take,
                    cursor: nextCursor,
                    direction: "next",
                  },
                }}
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </section>

        {/* RIGHT: sticky aside */}
        <aside className="space-y-4 md:sticky md:top-20 h-fit">
          <section className="rounded-2xl border border-[var(--brand)/15] bg-white p-6 shadow-sm">
            <h3 className="font-medium text-foreground">About</h3>
            <p className="mt-1 text-sm text-(--ink)/75">
              This page lists summaries saved to the database. Use the search
              box to filter by content. Use Prev / Next to paginate between
              result pages. Click the Copy button to quickly copy any summary.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
