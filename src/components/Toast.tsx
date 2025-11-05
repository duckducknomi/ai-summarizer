"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};
type Ctx = {
  toast: (msg: string, type?: Toast["type"]) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);
export const useToast = () => {
  const v = useContext(ToastCtx);
  if (!v) throw new Error("useToast must be used within <ToastProvider>");
  return v;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2200);
  }, []);

  const api = useMemo<Ctx>(
    () => ({
      toast: push,
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error"),
      info: (m) => push(m, "info"),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {/* Stack - bottom right */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-100 flex w-[min(92vw,360px)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto rounded-xl border p-3 text-sm shadow-sm",
              "bg-white",
              t.type === "success" && "border-green-500/30",
              t.type === "error" && "border-red-500/30",
              t.type === "info" && "border-[var(--brand)/25]",
            ].join(" ")}
          >
            <span
              className={[
                "font-medium",
                t.type === "success" && "text-green-700",
                t.type === "error" && "text-red-700",
                t.type === "info" && "text-foreground",
              ].join(" ")}
            >
              {t.message}
            </span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
