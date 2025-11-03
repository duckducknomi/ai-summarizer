import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  text: z.string().min(20, "Text must be at least 20 characters"),
});

function mockSummarize(input: string) {
  const trimmed = input.trim().replace(/\s+/g, " ");
  const firstSentence = trimmed.split(/[.!?]\s/)[0];
  const base =
    firstSentence.length >= 40 ? firstSentence : trimmed.slice(0, 160);
  return base.replace(/\s+/g, " ").trim() + (/[.!?]$/.test(base) ? "" : "…");
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message ?? "Invalid input";
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message } },
      { status: 400 }
    );
  }

  const { text } = parsed.data;
  const summary = mockSummarize(text);

  // Keep the shape simple; we can extend later without breaking clients.
  return NextResponse.json({ summary });
}

// Keep Node runtime for now
export const runtime = "nodejs";
