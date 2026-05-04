import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ai } from "@/lib/ai/provider";
import { getRequiredUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  let user;
  try { user = await getRequiredUser(); } catch (e) { return handleApiError(e); }

  const [bookmarks, notes] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: user.id },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: { title: true, summary: true, category: true },
    }),
    prisma.note.findMany({
      where: { userId: user.id },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: { title: true, summary: true },
    }),
  ]);

  if (bookmarks.length === 0 && notes.length === 0) {
    return NextResponse.json({ insights: [] });
  }

  const context = [
    ...bookmarks.map((b) => `[Bookmark] ${b.title}: ${b.summary}`),
    ...notes.map((n) => `[Note] ${n.title}: ${n.summary ?? "No summary"}`),
  ].join("\n");

  let insights: string[];
  try {
    insights = await ai.generateInsights(context);
  } catch (err) {
    console.error("Insight generation failed:", err);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ insights });
}
