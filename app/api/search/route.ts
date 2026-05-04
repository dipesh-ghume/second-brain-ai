import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { findSimilar } from "@/lib/ai/embeddings";
import { ollamaChatStream, getOllamaFastModel } from "@/lib/ai/ollama";

interface EnrichedSource {
  id: string;
  title: string;
  summary: string | null;
  url: string | null;
  type: "bookmark" | "note";
  similarity: number;
  snippet: string;
}

async function enrichSources(
  similar: Awaited<ReturnType<typeof findSimilar>>
): Promise<EnrichedSource[]> {
  const bookmarkIds = similar
    .filter((h) => h.sourceType === "BOOKMARK")
    .map((h) => h.sourceId);
  const noteIds = similar
    .filter((h) => h.sourceType === "NOTE")
    .map((h) => h.sourceId);

  const [bookmarks, notes] = await Promise.all([
    bookmarkIds.length
      ? prisma.bookmark.findMany({
          where: { id: { in: bookmarkIds } },
          select: { id: true, title: true, url: true, summary: true },
        })
      : Promise.resolve([]),
    noteIds.length
      ? prisma.note.findMany({
          where: { id: { in: noteIds } },
          select: { id: true, title: true, summary: true },
        })
      : Promise.resolve([]),
  ]);

  const bmMap = new Map(bookmarks.map((b) => [b.id, b]));
  const noteMap = new Map(notes.map((n) => [n.id, n]));

  const enriched: EnrichedSource[] = [];
  for (const hit of similar) {
    if (hit.sourceType === "BOOKMARK") {
      const bm = bmMap.get(hit.sourceId);
      if (bm) {
        enriched.push({
          id: bm.id,
          title: bm.title,
          summary: bm.summary,
          url: bm.url,
          type: "bookmark",
          similarity: hit.similarity,
          snippet: hit.content.slice(0, 300),
        });
      }
    } else {
      const note = noteMap.get(hit.sourceId);
      if (note) {
        enriched.push({
          id: note.id,
          title: note.title,
          summary: note.summary,
          url: null,
          type: "note",
          similarity: hit.similarity,
          snippet: hit.content.slice(0, 300),
        });
      }
    }
  }
  return enriched;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(limitParam ? parseInt(limitParam, 10) : 10, 20);
  const mode = req.nextUrl.searchParams.get("mode") ?? "stream";

  if (!q?.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const similar = await findSimilar(q, limit, 0.05);

  if (similar.length === 0) {
    return NextResponse.json({
      answer:
        "I couldn't find any relevant content in your knowledge base. Try adding more notes or bookmarks first.",
      sources: [],
      query: q,
      totalMatches: 0,
    });
  }

  const enrichedSources = await enrichSources(similar);

  // "sources" mode — return JSON immediately, no AI synthesis
  if (mode === "sources") {
    return NextResponse.json({
      answer: "",
      sources: enrichedSources,
      query: q,
      totalMatches: similar.length,
    });
  }

  // "stream" mode — SSE: emit sources as JSON event, then stream AI answer tokens
  // Use compact summaries instead of full content to keep prompts small and fast
  const contextParts = enrichedSources.slice(0, 5).map((src) => {
    const text = src.summary || src.snippet || "";
    return `[${src.type}: "${src.title}"]\n${text}`;
  });
  const contextText = contextParts.join("\n\n");

  const systemPrompt = `You are a knowledge assistant. Answer using ONLY the provided context. Be concise. Reference sources by title.`;

  const prompt = `Question: ${q}\n\nContext:\n${contextText}\n\nAnswer concisely.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Emit sources immediately so the UI can render them
      const sourcesEvent = `data: ${JSON.stringify({
        type: "sources",
        sources: enrichedSources,
        query: q,
        totalMatches: similar.length,
      })}\n\n`;
      controller.enqueue(encoder.encode(sourcesEvent));

      // 2. Stream AI answer tokens
      const llmStream = ollamaChatStream(prompt, systemPrompt, getOllamaFastModel());
      const reader = llmStream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const tokenEvent = `data: ${JSON.stringify({ type: "token", token: value })}\n\n`;
          controller.enqueue(encoder.encode(tokenEvent));
        }
      } finally {
        reader.releaseLock();
      }

      // 3. Signal completion
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
