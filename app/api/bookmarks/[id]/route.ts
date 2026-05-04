import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { deleteEmbedding } from "@/lib/ai/embeddings";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bookmark = await prisma.bookmark.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!bookmark) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }

  return NextResponse.json(bookmark);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await deleteEmbedding(id);
  await prisma.bookmark.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
