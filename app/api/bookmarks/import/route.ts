import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ai } from "@/lib/ai/provider";
import { generateAndStoreEmbedding } from "@/lib/ai/embeddings";
import { fetchUrlContent } from "@/lib/utils/content-fetcher";
import { isYouTubeUrl, fetchYouTubeContent } from "@/lib/utils/youtube";
import { parseBookmarkHtml } from "@/lib/utils/bookmark-parser";

interface ImportedItem {
  url: string;
  title: string;
  status: "imported" | "duplicate" | "failed";
  error?: string;
}

/**
 * POST /api/bookmarks/import
 * Accepts raw bookmark HTML (exported from any browser) in the request body.
 * Parses it, deduplicates against existing bookmarks, and imports new ones.
 * AI summarization runs in the background so the response returns quickly.
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  let html: string;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    html = await file.text();
  } else {
    html = await req.text();
  }

  if (!html.trim()) {
    return NextResponse.json({ error: "Empty bookmark file" }, { status: 400 });
  }

  const parsed = parseBookmarkHtml(html);

  if (parsed.bookmarks.length === 0) {
    return NextResponse.json({
      error: "No valid bookmarks found in the file. Make sure you exported bookmarks from your browser (HTML format).",
    }, { status: 422 });
  }

  // Get all existing URLs to detect duplicates in one query
  const existingBookmarks = await prisma.bookmark.findMany({
    select: { url: true },
  });
  const existingUrls = new Set(existingBookmarks.map((b) => normalizeUrl(b.url)));

  const results: ImportedItem[] = [];
  let imported = 0;
  let duplicates = 0;
  let failed = 0;

  for (const entry of parsed.bookmarks) {
    const normalized = normalizeUrl(entry.url);

    if (existingUrls.has(normalized)) {
      results.push({ url: entry.url, title: entry.title, status: "duplicate" });
      duplicates++;
      continue;
    }

    try {
      // Save with browser title immediately (no AI wait)
      const bookmark = await prisma.bookmark.create({
        data: {
          url: entry.url,
          title: entry.title || entry.url,
          content: "",
          summary: "Processing...",
          category: entry.folder?.split(" / ").pop() ?? "imported",
          favicon: null,
        },
      });

      existingUrls.add(normalized);

      results.push({ url: entry.url, title: entry.title, status: "imported" });
      imported++;

      // Queue AI enrichment in background — don't block the response
      enrichBookmarkInBackground(bookmark.id, entry.url);
    } catch (err) {
      results.push({
        url: entry.url,
        title: entry.title,
        status: "failed",
        error: err instanceof Error ? err.message : "unknown",
      });
      failed++;
    }
  }

  return NextResponse.json({
    total: parsed.bookmarks.length,
    imported,
    duplicates,
    failed,
    folders: parsed.folders,
    results,
  });
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Strip trailing slash, www prefix, and fragment for dedup
    let host = u.hostname.replace(/^www\./, "");
    let path = u.pathname.replace(/\/+$/, "");
    return `${u.protocol}//${host}${path}${u.search}`.toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

/**
 * Runs in the background after the import response is sent.
 * Fetches content, generates AI summary/tags, and creates embeddings.
 */
function enrichBookmarkInBackground(bookmarkId: string, url: string): void {
  (async () => {
    try {
      let fetched;
      try {
        if (isYouTubeUrl(url)) {
          fetched = await fetchYouTubeContent(url);
        } else {
          fetched = await fetchUrlContent(url);
        }
      } catch {
        fetched = { title: url, content: url, description: url, favicon: null };
      }

      const contentForAI = fetched.content || fetched.description || url;
      let summary = contentForAI.slice(0, 300);
      let tags: string[] = [];
      let category = "imported";

      try {
        const aiResult = await ai.summarizeText(contentForAI);
        summary = aiResult.summary;
        tags = aiResult.tags;
        category = aiResult.tags[0] ?? "imported";
      } catch (err) {
        console.error(`AI summarization failed for ${url}:`, err);
      }

      const tagRecords = await Promise.all(
        tags.slice(0, 6).map(async (name) => {
          const normalized = name.toLowerCase().trim().slice(0, 100);
          if (!normalized) return null;
          return prisma.tag.upsert({
            where: { name: normalized },
            update: {},
            create: { name: normalized },
          });
        })
      );
      const validTags = tagRecords.filter(Boolean) as { id: string }[];

      await prisma.bookmark.update({
        where: { id: bookmarkId },
        data: {
          title: fetched.title || url,
          content: fetched.content || "",
          summary,
          category,
          favicon: fetched.favicon,
          tags: validTags.length > 0 ? { connect: validTags.map((t) => ({ id: t.id })) } : undefined,
        },
      });

      await generateAndStoreEmbedding(
        bookmarkId,
        "BOOKMARK",
        `${fetched.title}\n${summary}\n${(fetched.content || "").slice(0, 3000)}`
      );
    } catch (err) {
      console.error(`Background enrichment failed for bookmark ${bookmarkId}:`, err);
      // Update the bookmark to show the error state
      await prisma.bookmark.update({
        where: { id: bookmarkId },
        data: { summary: "AI processing failed. Content may be unavailable." },
      }).catch(() => {});
    }
  })();
}
