import Link from "next/link";

export default function Home() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl border border-[var(--brand)/15] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">
          Summarize Text
        </h2>
        <p className="mt-2 text-sm text-(--ink)/80">
          Paste long text and generate a concise summary, then confirm & save.
        </p>
        <Link
          href="/summarize"
          className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-white hover:opacity-90"
        >
          Go to Summarize
        </Link>
      </section>

      <section className="rounded-2xl border border-[var(--brand)/15] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">
          History
        </h2>
        <p className="mt-2 text-sm text-(--ink)/80">
          Browse saved summaries from the database. Search and copy quickly.
        </p>
        <Link
          href="/history"
          className="mt-4 inline-block rounded-xl border px-4 py-2 text-foreground hover:bg-[var(--brand)/10]"
        >
          View History
        </Link>
      </section>
    </div>
  );
}
