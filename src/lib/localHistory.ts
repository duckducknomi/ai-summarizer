export type LocalSummary = {
  id?: string;
  originalText: string;
  summary: string;
  createdAt: string; // ISO
};

const KEY = "ai-summarizer:history";

function read(): LocalSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalSummary[]) : [];
  } catch {
    return [];
  }
}

function write(items: LocalSummary[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function load(): LocalSummary[] {
  if (typeof window === "undefined") return [];
  return read();
}

export function add(item: LocalSummary) {
  const items = read();
  write([item, ...items].slice(0, 50)); // keep it bounded
}

export function attachId(createdAt: string, id: string) {
  const items = read();
  const idx = items.findIndex((i) => i.createdAt === createdAt);
  if (idx >= 0) {
    items[idx] = { ...items[idx], id };
    write(items);
  }
}

export function clear() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
