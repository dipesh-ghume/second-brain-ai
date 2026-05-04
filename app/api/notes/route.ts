import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ai } from "@/lib/ai/provider";
import { generateAndStoreEmbedding } from "@/lib/ai/embeddings";
import { stripHtml } from "@/lib/utils/text";
import { getRequiredUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  let user;
  try { user = await getRequiredUser(); } catch (e) { return handleApiError(e); }
  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    include: { tags: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await getRequiredUser(); } catch (e) { return handleApiError(e); }
  const body = await req.json();
  const { title, content } = body as { title: string; content: string };

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const plainText = stripHtml(content);

  const [aiResult, actionItems] = await Promise.all([
    ai.summarizeText(plainText),
    ai.extractActionItems(plainText),
  ]);

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

  const note = await prisma.note.create({
    data: {
      title: title.trim(),
      content,
      summary: aiResult.summary,
      actionItems: actionItems.length > 0 ? actionItems : undefined,
      userId: user.id!,
      tags: { connect: validTags.map((t) => ({ id: t.id })) },
    },
    include: { tags: true },
  });

  generateAndStoreEmbedding(
    note.id,
    "NOTE",
    `${note.title}\n${note.summary}\n${plainText.slice(0, 3000)}`,
    user.id!
  ).catch((err) => console.error("Embedding generation failed:", err));

  return NextResponse.json(note, { status: 201 });
}
