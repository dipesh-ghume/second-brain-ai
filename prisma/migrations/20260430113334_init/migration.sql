-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('BOOKMARK', 'NOTE');

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL DEFAULT 'uncategorized',
    "favicon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "actionItems" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector,
    "sourceType" "SourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BookmarkTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookmarkTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_NoteTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NoteTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_sourceId_key" ON "Embedding"("sourceId");

-- CreateIndex
CREATE INDEX "Embedding_sourceType_idx" ON "Embedding"("sourceType");

-- CreateIndex
CREATE INDEX "_BookmarkTags_B_index" ON "_BookmarkTags"("B");

-- CreateIndex
CREATE INDEX "_NoteTags_B_index" ON "_NoteTags"("B");

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_bookmark_fkey" FOREIGN KEY ("sourceId") REFERENCES "Bookmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_note_fkey" FOREIGN KEY ("sourceId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookmarkTags" ADD CONSTRAINT "_BookmarkTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Bookmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookmarkTags" ADD CONSTRAINT "_BookmarkTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NoteTags" ADD CONSTRAINT "_NoteTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NoteTags" ADD CONSTRAINT "_NoteTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
