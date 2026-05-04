import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateAndStoreEmbedding, getEmbeddingStats } from "@/lib/ai/embeddings";
import { stripHtml } from "@/lib/utils/text";

function buildBookmarkText(b: { title: string; summary: string; content: string }): string {
  return [b.title, b.summary, b.content.slice(0, 3000)].filter(Boolean).join("\n");
}

function buildNoteText(n: { title: string; summary: string | null; content: string }): string {
  const plain = stripHtml(n.content);
  return [n.title, n.summary ?? "", plain.slice(0, 3000)].filter(Boolean).join("\n");
}

export async function GET() {
  const stats = await getEmbeddingStats();
  const [bookmarkCount, noteCount] = await Promise.all([
    prisma.bookmark.count(),
    prisma.note.count(),
  ]);

  return NextResponse.json({
    ...stats,
    totalSources: bookmarkCount + noteCount,
    coverage: (bookmarkCount + noteCount) > 0
      ? Math.round((stats.indexed / (bookmarkCount + noteCount)) * 100)
      : 100,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const forceRecompute = (body as { force?: boolean }).force === true;

  const existingEmbeddings = await prisma.embedding.findMany({
    select: { sourceId: true },
  });
  const embeddedIds = new Set(existingEmbeddings.map((e) => e.sourceId));

  const [bookmarks, notes] = await Promise.all([
    prisma.bookmark.findMany({
      select: { id: true, title: true, summary: true, content: true },
    }),
    prisma.note.findMany({
      select: { id: true, title: true, summary: true, content: true },
    }),
  ]);

  const pendingBookmarks = forceRecompute
    ? bookmarks
    : bookmarks.filter((b) => !embeddedIds.has(b.id));
  const pendingNotes = forceRecompute
    ? notes
    : notes.filter((n) => !embeddedIds.has(n.id));

  let processed = 0;
  const errors: string[] = [];

  for (const bookmark of pendingBookmarks) {
    try {
      await generateAndStoreEmbedding(
        bookmark.id,
        "BOOKMARK",
        buildBookmarkText(bookmark)
      );
      processed++;
    } catch (err) {
      errors.push(`Bookmark "${bookmark.title}": ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  for (const note of pendingNotes) {
    try {
      await generateAndStoreEmbedding(
        note.id,
        "NOTE",
        buildNoteText(note)
      );
      processed++;
    } catch (err) {
      errors.push(`Note "${note.title}": ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  const stats = await getEmbeddingStats();

  return NextResponse.json({
    processed,
    pending: pendingBookmarks.length + pendingNotes.length,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
    stats,
  });
}
