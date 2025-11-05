"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/summarize", label: "Summarize" },
  { href: "/history", label: "History" },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--brand)/15] bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <span className="font-semibold text-brand">
          AI Summarizer
        </span>
        <div className="ml-auto flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-brand text-white"
                    : "text-foreground hover:bg-[var(--brand)/10]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
