"use client";
import { useEffect } from "react";

export function useAutosizeTextArea(
  textarea: HTMLTextAreaElement | null,
  value: string
) {
  useEffect(() => {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }, [textarea, value]);
}
