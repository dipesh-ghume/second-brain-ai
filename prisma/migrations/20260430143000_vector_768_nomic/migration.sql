-- Switch to 768 dimensions to match nomic-embed-text output.
-- This dedicated embedding model produces much higher quality
-- semantic vectors than the general-purpose qwen2.5:1.5b model.

DROP INDEX IF EXISTS "embedding_hnsw_idx";

DELETE FROM "Embedding";

ALTER TABLE "Embedding" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "Embedding" ADD COLUMN "embedding" vector(768);

CREATE INDEX "embedding_hnsw_idx"
  ON "Embedding" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
