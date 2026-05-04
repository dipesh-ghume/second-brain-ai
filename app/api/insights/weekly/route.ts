import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ai } from "@/lib/ai/provider";
import { getRequiredUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  let user;
  try { user = await getRequiredUser(); } catch (e) { return handleApiError(e); }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [recentBookmarks, recentNotes, topTags] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: user.id, createdAt: { gte: oneWeekAgo } },
      select: { title: true, summary: true, category: true },
    }),
    prisma.note.findMany({
      where: { userId: user.id, createdAt: { gte: oneWeekAgo } },
      select: { title: true, summary: true },
    }),
    prisma.tag.findMany({
      where: {
        OR: [
          { bookmarks: { some: { userId: user.id } } },
          { notes: { some: { userId: user.id } } },
        ],
      },
      include: { _count: { select: { bookmarks: true, notes: true } } },
      orderBy: { bookmarks: { _count: "desc" } },
      take: 10,
    }),
  ]);

  if (recentBookmarks.length === 0 && recentNotes.length === 0) {
    return NextResponse.json({
      report: "No activity this week. Start saving bookmarks or writing notes to get AI-powered weekly insights.",
      stats: { bookmarks: 0, notes: 0 },
      topTopics: [],
    });
  }

  const summaryContext = [
    ...recentBookmarks.map((b) => `[Bookmark] ${b.title}: ${b.summary}`),
    ...recentNotes.map((n) => `[Note] ${n.title}: ${n.summary ?? "No summary"}`),
  ].join("\n");

  const topTopics = topTags
    .map((t) => ({ name: t.name, count: t._count.bookmarks + t._count.notes }))
    .filter((t) => t.count > 0)
    .slice(0, 5);

  const prompt = `You are a personal knowledge assistant. Analyze this week's brain activity and provide a personalized weekly report.

This week's activity:
- ${recentBookmarks.length} bookmarks saved
- ${recentNotes.length} notes created
- Top topics: ${topTopics.map((t) => t.name).join(", ") || "none"}

Content summaries:
${summaryContext}

Write a brief, engaging "Your Brain This Week" report (3-5 paragraphs). Include:
1. What the user focused on this week
2. Patterns or themes you notice
3. Connections between different pieces of knowledge
4. A suggestion for what to explore next`;

  let report: string;
  try {
    report = await ai.generateText(prompt, undefined, "weekly_report");
  } catch (err) {
    console.error("Weekly report generation failed:", err);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    report,
    stats: {
      bookmarks: recentBookmarks.length,
      notes: recentNotes.length,
    },
    topTopics,
  });
}
