import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../server/prisma";

const Body = z.object({
  originalText: z
    .string()
    .min(20, "Original text must be at least 20 characters"),
  summary: z.string().min(1, "Summary is required"),
});

export async function POST(request: NextRequest) {
  // Parse and validate request body
  const json = await request.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message ?? "Invalid input";
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message } },
      { status: 400 }
    );
  }

  const { originalText, summary } = parsed.data;

  try {
    const record = await prisma.summary.create({
      data: { originalText, summary },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[API/save-summary] Failed to persist summary:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to save summary" } },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
