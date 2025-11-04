"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CopyButtonProps = {
  text: string;
  className?: string;
  copiedLabel?: string;
  copyLabel?: string;
};

const RESET_DELAY = 1500;

export function CopyButton({
  text,
  className,
  copiedLabel = "Copied!",
  copyLabel = "Copy",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), RESET_DELAY);
    } catch (error) {
      console.error("Failed to copy text", error);
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className}
      disabled={copied}
    >
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}
