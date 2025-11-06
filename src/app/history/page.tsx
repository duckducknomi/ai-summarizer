// app/history/page.tsx
import CopyButton from "@/components/CopyButton";
import { prisma } from "@/server/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TAKE_DEFAULT = 10;

type SearchParams = {
  q?: string;
  take?: string;
  cursor?: string;
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // ✅ unwrap the Promise
  const sp = await searchParams;

  // Parse values safely
  const qRaw = (sp?.q ?? "").toString();
  const q = qRaw.trim();

  const takeRaw = Number(sp?.take);
  const take = Math.min(
    50,
    Math.max(1, Number.isFinite(takeRaw) ? takeRaw : TAKE_DEFAULT)
  );

  const cursor = sp?.cursor || undefined;

  // Build where clause
  const where =
    q.length > 0
      ? {
          OR: [
            { summary: { contains: q, mode: "insensitive" as const } },
            { originalText: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : undefined;

  // Fetch one extra to detect "hasNext"
  let results = await prisma.summary.findMany({
    where,
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    select: { id: true, originalText: true, summary: true, createdAt: true },
  });

  const hasNext = results.length > take;
  if (hasNext) results = results.slice(0, take);
  const nextCursor = hasNext ? results[results.length - 1]?.id : undefined;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-4 space-y-1">
        <h1 className="text-3xl font-bold text-foreground">History</h1>
        <p className="text-sm text-(--ink)/70">
          Search and browse summaries saved to the database.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_420px]">
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
              {/* Preserve page size */}
              <input type="hidden" name="take" value={take} />
              <button type="submit" className="btn btn-primary btn-sm">
                Search
              </button>
              {q.length > 0 && (
                <Link
                  href={{ pathname: "/history", query: { take } }} // omit `q` to reset
                  className="btn btn-ghost btn-sm"
                >
                  Clear
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

          {/* Pagination (Next) */}
          <div className="flex items-center justify-end">
            {hasNext && nextCursor && (
              <Link
                href={{
                  pathname: "/history",
                  query: { q, take, cursor: nextCursor },
                }}
                className="btn btn-ghost btn-sm"
              >
                Next →
              </Link>
            )}
          </div>
        </section>

        {/* RIGHT: sticky aside */}
        <aside className="space-y-4 md:sticky md:top-20 h-fit">
          <section className="rounded-2xl border border-[var(--brand)/15] bg-white p-6 shadow-sm">
            <h3 className="font-medium text-foreground">About</h3>
            <p className="mt-1 text-sm text-(--ink)/75">
              This page lists summaries saved to the database. Use the search
              box to filter by content. Click “Next” to fetch more results. Use
              the Copy button to quickly copy any summary.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
