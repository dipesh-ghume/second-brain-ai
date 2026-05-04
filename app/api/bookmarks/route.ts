import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ai } from "@/lib/ai/provider";
import { fetchUrlContent } from "@/lib/utils/content-fetcher";
import { generateAndStoreEmbedding } from "@/lib/ai/embeddings";
import { isYouTubeUrl, fetchYouTubeContent } from "@/lib/utils/youtube";

export async function GET() {
  const bookmarks = await prisma.bookmark.findMany({
    include: { tags: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bookmarks);
}

interface CreateBookmarkBody {
  url: string;
  title?: string;
  tags?: string[];
  notes?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateBookmarkBody;
  const { url, title: userTitle, tags: userTags, notes: userNotes } = body;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let fetched;
  try {
    if (isYouTubeUrl(url)) {
      fetched = { ...(await fetchYouTubeContent(url)), url };
    } else {
      fetched = await fetchUrlContent(url);
    }
  } catch {
    return NextResponse.json({ error: "Could not fetch content from URL" }, { status: 422 });
  }

  // Append user notes to content so AI can consider them
  const contentForAI = userNotes
    ? `${fetched.content || fetched.description}\n\nUser Notes:\n${userNotes}`
    : fetched.content || fetched.description;

  const aiResult = await ai.summarizeText(contentForAI);

  // Merge AI-generated tags with user-provided tags (user tags first)
  const allTagNames = new Set<string>();
  if (userTags?.length) {
    for (const t of userTags) {
      const normalized = t.toLowerCase().trim().slice(0, 100);
      if (normalized) allTagNames.add(normalized);
    }
  }
  for (const t of aiResult.tags.slice(0, 6)) {
    const normalized = t.toLowerCase().trim().slice(0, 100);
    if (normalized) allTagNames.add(normalized);
  }

  const tagRecords = await Promise.all(
    Array.from(allTagNames).slice(0, 10).map(async (name) => {
      return prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    })
  );

  const finalTitle = userTitle?.trim() || fetched.title;
  const category = aiResult.tags[0] ?? "uncategorized";

  // If user added notes, append to stored content
  const storedContent = userNotes
    ? `${fetched.content}\n\n--- User Notes ---\n${userNotes}`
    : fetched.content;

  const bookmark = await prisma.bookmark.create({
    data: {
      url,
      title: finalTitle,
      content: storedContent,
      summary: aiResult.summary,
      category,
      favicon: fetched.favicon,
      tags: { connect: tagRecords.map((t) => ({ id: t.id })) },
    },
    include: { tags: true },
  });

  generateAndStoreEmbedding(
    bookmark.id,
    "BOOKMARK",
    `${bookmark.title}\n${bookmark.summary}\n${storedContent.slice(0, 3000)}`
  ).catch((err) => console.error("Embedding generation failed:", err));

  return NextResponse.json({
    ...bookmark,
    insights: aiResult.insights,
  }, { status: 201 });
}
