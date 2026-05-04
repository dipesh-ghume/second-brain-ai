import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ai } from "@/lib/ai/provider";
import { generateAndStoreEmbedding, deleteEmbedding } from "@/lib/ai/embeddings";
import { stripHtml } from "@/lib/utils/text";

function buildEmbeddingText(title: string, summary: string | null, plainContent: string): string {
  return [title, summary ?? "", plainContent.slice(0, 3000)].filter(Boolean).join("\n");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(note);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, content } = body as { title: string; content: string };

  const plainText = stripHtml(content);
  const aiResult = await ai.summarizeText(plainText);
  const actionItems = await ai.extractActionItems(plainText);

  const tagRecords = await Promise.all(
    aiResult.tags.slice(0, 6).map(async (name) => {
      const normalized = name.toLowerCase().trim().slice(0, 100);
      if (!normalized) return null;
      return prisma.tag.upsert({
        where: { name: normalized },
        update: {},
        create: { name: normalized },
      });
    })
  );

  const validTags = tagRecords.filter(Boolean) as { id: string; name: string }[];

  const note = await prisma.note.update({
    where: { id },
    data: {
      title: title.trim(),
      content,
      summary: aiResult.summary,
      actionItems: actionItems.length > 0 ? actionItems : undefined,
      tags: { set: [], connect: validTags.map((t) => ({ id: t.id })) },
    },
    include: { tags: true },
  });

  // Recompute embedding on update (upsert handles overwrite)
  generateAndStoreEmbedding(
    note.id,
    "NOTE",
    buildEmbeddingText(note.title, note.summary, plainText)
  ).catch((err) => console.error("Embedding recompute failed:", err));

  return NextResponse.json(note);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteEmbedding(id);
  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
