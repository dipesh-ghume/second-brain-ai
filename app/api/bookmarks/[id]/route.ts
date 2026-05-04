import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { deleteEmbedding } from "@/lib/ai/embeddings";
import { getRequiredUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try { user = await getRequiredUser(); } catch (e) { return handleApiError(e); }
  const { id } = await params;
  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId: user.id },
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
  let user;
  try { user = await getRequiredUser(); } catch (e) { return handleApiError(e); }
  const { id } = await params;

  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId: user.id },
  });

  if (!bookmark) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }

  await deleteEmbedding(id);
  await prisma.bookmark.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
