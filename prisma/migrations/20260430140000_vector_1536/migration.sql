-- Switch to 1536 dimensions to match qwen2.5:1.5b embedding output exactly.
-- Zero-padding to 2000 dims was causing all vectors to look artificially similar.

DROP INDEX IF EXISTS "embedding_hnsw_idx";

DELETE FROM "Embedding";

ALTER TABLE "Embedding" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "Embedding" ADD COLUMN "embedding" vector(1536);

CREATE INDEX "embedding_hnsw_idx"
  ON "Embedding" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
