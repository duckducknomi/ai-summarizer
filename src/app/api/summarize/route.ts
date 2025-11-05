import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { summarizeText } from "@/lib/ai";

const Body = z.object({
  text: z.string().min(20, "Text must be at least 20 characters"),
});

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
  const summary = await summarizeText(text);

  // Keep the shape simple; we can extend later without breaking clients.
  return NextResponse.json({ summary });
}

// Keep Node runtime for now
export const runtime = "nodejs";
