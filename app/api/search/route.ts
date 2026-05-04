import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { findSimilar } from "@/lib/ai/embeddings";
import { ollamaChatStream, getOllamaFastModel } from "@/lib/ai/ollama";
import { getRequiredUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

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
  similar: Awaited<ReturnType<typeof findSimilar>>,
  userId: string
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
          where: { id: { in: bookmarkIds }, userId },
          select: { id: true, title: true, url: true, summary: true },
        })
      : Promise.resolve([]),
    noteIds.length
      ? prisma.note.findMany({
          where: { id: { in: noteIds }, userId },
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
  let user;
  try { user = await getRequiredUser(); } catch (e) { return handleApiError(e); }
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

  const similar = await findSimilar(q, limit, 0.05, user.id!);

  if (similar.length === 0) {
    return NextResponse.json({
      answer:
        "I couldn't find any relevant content in your knowledge base. Try adding more notes or bookmarks first.",
      sources: [],
      query: q,
      totalMatches: 0,
    });
  }

  const enrichedSources = await enrichSources(similar, user.id!);

  if (mode === "sources") {
    return NextResponse.json({
      answer: "",
      sources: enrichedSources,
      query: q,
      totalMatches: similar.length,
    });
  }

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
      const sourcesEvent = `data: ${JSON.stringify({
        type: "sources",
        sources: enrichedSources,
        query: q,
        totalMatches: similar.length,
      })}\n\n`;
      controller.enqueue(encoder.encode(sourcesEvent));

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
