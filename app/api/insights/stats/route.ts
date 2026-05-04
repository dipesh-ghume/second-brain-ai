import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const [
    totalNotes,
    totalBookmarks,
    totalTags,
    totalEmbeddings,
    recentBookmarks,
    recentNotes,
  ] = await Promise.all([
    prisma.note.count(),
    prisma.bookmark.count(),
    prisma.tag.count(),
    prisma.embedding.count(),
    prisma.bookmark.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, url: true, category: true, createdAt: true },
    }),
    prisma.note.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  const recentActivity = [
    ...recentBookmarks.map((b) => ({
      id: b.id,
      title: b.title,
      type: "bookmark" as const,
      createdAt: b.createdAt.toISOString(),
    })),
    ...recentNotes.map((n) => ({
      id: n.id,
      title: n.title,
      type: "note" as const,
      createdAt: n.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, 8);

  return NextResponse.json({
    stats: {
      notes: totalNotes,
      bookmarks: totalBookmarks,
      tags: totalTags,
      embeddings: totalEmbeddings,
    },
    recentActivity,
  });
}
