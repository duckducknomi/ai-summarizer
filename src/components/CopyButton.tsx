"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast"; // optional; safe no-op if you remove below usage
import { Button } from "@/components/Button";

type Props = {
  text: string;
  label?: string; // default: "Copy"
  copiedLabel?: string; // default: "Copied!"
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export default function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  size = "sm",
  variant = "secondary",
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);

  const toast = (() => {
    try {
      const { success, error } = useToast();
      return { success, error };
    } catch {
      return { success: (_: string) => {}, error: (_: string) => {} };
    }
  })();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success?.("Copied to clipboard");
      setTimeout(() => setCopied(false), 1200);
    } catch (e: unknown) {
      toast.error?.(e instanceof Error ? e.message : "Failed to copy");
    }
  }

  return (
    <Button
      onClick={handleCopy}
      disabled={copied}
      size={size}
      variant={variant}
      className={className}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
