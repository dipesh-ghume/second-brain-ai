import { prisma } from "@/lib/db/prisma";
import { embeddings } from "./provider";
import type { SourceType } from "../../generated/prisma/client";

const VECTOR_DIMENSIONS = 768;

/**
 * Ensure vector matches the DB column dimension and L2-normalize
 * so cosine distance is well-defined.
 */
function prepareVector(raw: number[]): number[] {
  const vec = raw.slice(0, VECTOR_DIMENSIONS);

  // Pad only if absolutely needed (shouldn't happen with matching model)
  while (vec.length < VECTOR_DIMENSIONS) {
    vec.push(0);
  }

  // L2 normalize
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

function vectorToSql(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

export async function generateAndStoreEmbedding(
  sourceId: string,
  sourceType: SourceType,
  content: string
): Promise<void> {
  const result = await embeddings.generate(content);
  if (!result.embedding.length) {
    throw new Error("Embedding generation returned empty vector");
  }

  const prepared = prepareVector(result.embedding);
  const vecSql = vectorToSql(prepared);
  const storedContent = content.slice(0, 5000);

  // Upsert: insert or update if sourceId already exists
  await prisma.$executeRaw`
    INSERT INTO "Embedding" (id, content, embedding, "sourceType", "sourceId", "createdAt")
    VALUES (gen_random_uuid(), ${storedContent}, ${vecSql}::vector, ${sourceType}::"SourceType", ${sourceId}, NOW())
    ON CONFLICT ("sourceId") DO UPDATE SET
      content    = EXCLUDED.content,
      embedding  = EXCLUDED.embedding,
      "createdAt" = NOW()
  `;
}

export async function deleteEmbedding(sourceId: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM "Embedding" WHERE "sourceId" = ${sourceId}
  `;
}

export interface SimilarResult {
  id: string;
  content: string;
  sourceType: string;
  sourceId: string;
  similarity: number;
}

export async function findSimilar(
  queryText: string,
  limit: number = 10,
  minSimilarity: number = 0.0
): Promise<SimilarResult[]> {
  const result = await embeddings.generate(queryText);
  if (!result.embedding.length) return [];

  const prepared = prepareVector(result.embedding);
  const vecSql = vectorToSql(prepared);

  // cosine distance: <=> returns distance in [0,2], similarity = 1 - distance
  // SET hnsw.ef_search for recall quality (higher = more accurate, slower)
  await prisma.$executeRaw`SET hnsw.ef_search = 80`;

  const rows = await prisma.$queryRaw<SimilarResult[]>`
    SELECT
      id,
      content,
      "sourceType" AS "sourceType",
      "sourceId"   AS "sourceId",
      1 - (embedding <=> ${vecSql}::vector) AS similarity
    FROM "Embedding"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${vecSql}::vector
    LIMIT ${limit}
  `;

  return rows.filter((r) => r.similarity >= minSimilarity);
}

export async function getEmbeddingStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  indexed: number;
}> {
  const [countResult, typeResult, indexedResult] = await Promise.all([
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Embedding"
    `,
    prisma.$queryRaw<Array<{ sourceType: string; count: bigint }>>`
      SELECT "sourceType", COUNT(*) as count FROM "Embedding" GROUP BY "sourceType"
    `,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Embedding" WHERE embedding IS NOT NULL
    `,
  ]);

  const byType: Record<string, number> = {};
  for (const row of typeResult) {
    byType[row.sourceType] = Number(row.count);
  }

  return {
    total: Number(countResult[0].count),
    byType,
    indexed: Number(indexedResult[0].count),
  };
}
