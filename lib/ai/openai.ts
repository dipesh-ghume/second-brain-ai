import OpenAI from "openai";
import type { AIServiceInterface, AIResponse, EmbeddingResult, EmbeddingServiceInterface } from "./types";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

function parseJsonResponse<T>(raw: string, fallback: T): T {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return fallback;
  }
}

function parseArrayResponse(raw: string): string[] {
  const match = raw.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try {
    return JSON.parse(match[0]) as string[];
  } catch {
    return [];
  }
}

export const openaiService: AIServiceInterface = {
  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const client = getClient();
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 2000,
    });

    return res.choices[0]?.message?.content ?? "";
  },

  async summarizeText(text: string): Promise<AIResponse> {
    const truncated = text.slice(0, 8000);
    const client = getClient();
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a knowledge assistant. Respond ONLY with valid JSON matching this schema:
{"summary": "string", "tags": ["string"], "insights": ["string"]}`,
        },
        {
          role: "user",
          content: `Analyze the following content and return:
- summary: A concise 2-3 sentence summary
- tags: 3-6 relevant topic tags (lowercase, single words or short phrases)
- insights: 2-3 key takeaways

Content:
${truncated}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const raw = res.choices[0]?.message?.content ?? "";
    return parseJsonResponse<AIResponse>(raw, {
      summary: raw.slice(0, 500),
      tags: [],
      insights: [],
    });
  },

  async extractTags(text: string): Promise<string[]> {
    const truncated = text.slice(0, 4000);
    const client = getClient();
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Respond ONLY with a JSON array of strings." },
        {
          role: "user",
          content: `Extract 3-6 relevant topic tags from this text. Return as a JSON array of lowercase strings.\n\nText:\n${truncated}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 200,
    });

    return parseArrayResponse(res.choices[0]?.message?.content ?? "");
  },

  async generateInsights(text: string): Promise<string[]> {
    const truncated = text.slice(0, 8000);
    const client = getClient();
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Respond ONLY with a JSON array of strings." },
        {
          role: "user",
          content: `Provide 3-5 deep insights, patterns, or actionable observations from this content. Return as a JSON array.\n\nContent:\n${truncated}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });

    return parseArrayResponse(res.choices[0]?.message?.content ?? "");
  },

  async extractActionItems(text: string): Promise<string[]> {
    const truncated = text.slice(0, 4000);
    const client = getClient();
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Respond ONLY with a JSON array of strings." },
        {
          role: "user",
          content: `Extract actionable items from this text. Return as a JSON array of strings. If none, return [].\n\nText:\n${truncated}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    return parseArrayResponse(res.choices[0]?.message?.content ?? "");
  },
};

export const openaiEmbeddingService: EmbeddingServiceInterface = {
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const client = getClient();
    const truncated = text.slice(0, 8000);
    const res = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: truncated,
      dimensions: 1536,
    });

    const embedding = res.data[0]?.embedding ?? [];
    return { embedding, dimensions: embedding.length };
  },
};
