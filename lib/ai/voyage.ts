import type { EmbeddingResult, EmbeddingServiceInterface } from "./types";

const VOYAGE_MODEL = "voyage-4-lite";
const VOYAGE_DIMENSIONS = 768;

interface VoyageEmbeddingResponse {
  data: Array<{ embedding: number[] }>;
  usage: { total_tokens: number };
}

export const voyageEmbeddingService: EmbeddingServiceInterface = {
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const apiKey = process.env.VOYAGE_API_KEY;
    if (!apiKey) throw new Error("VOYAGE_API_KEY is not set");

    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text.slice(0, 8000),
        model: VOYAGE_MODEL,
        input_type: "query",
        output_dimension: VOYAGE_DIMENSIONS,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Voyage API error: ${res.status} ${body}`);
    }

    const data: VoyageEmbeddingResponse = await res.json();
    const embedding = data.data[0]?.embedding ?? [];
    return { embedding, dimensions: embedding.length };
  },
};
