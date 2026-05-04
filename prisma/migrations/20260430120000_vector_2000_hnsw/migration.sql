-- Recreate embedding column with fixed 2000 dimensions for index support
DELETE FROM "Embedding";
ALTER TABLE "Embedding" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "Embedding" ADD COLUMN "embedding" vector(2000);

-- HNSW index for fast approximate nearest neighbor cosine search
CREATE INDEX "embedding_hnsw_idx" ON "Embedding" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);
