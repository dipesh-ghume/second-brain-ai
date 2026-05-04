import type { AIServiceInterface, AIResponse, EmbeddingResult, EmbeddingServiceInterface } from "./types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_FAST_MODEL = process.env.OLLAMA_FAST_MODEL || "qwen2.5:1.5b";

function getModel(): string {
  return OLLAMA_FAST_MODEL;
}

async function ollamaChat(prompt: string, system?: string, model?: string): Promise<string> {
  const messages: { role: string; content: string }[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const useModel = model ?? getModel();
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: useModel, messages, stream: false }),
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.message?.content ?? "";
}

/**
 * Stream chat response from Ollama. Returns a ReadableStream of text chunks.
 */
export function ollamaChatStream(
  prompt: string,
  system?: string,
  model?: string
): ReadableStream<string> {
  return new ReadableStream({
    async start(controller) {
      const messages: { role: string; content: string }[] = [];
      if (system) messages.push({ role: "system", content: system });
      messages.push({ role: "user", content: prompt });

      try {
        const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model ?? OLLAMA_FAST_MODEL,
            messages,
            stream: true,
            options: { num_predict: 256 },
          }),
        });

        if (!res.ok || !res.body) {
          const text = await res.text();
          controller.enqueue(`Error: Ollama API ${res.status} - ${text}`);
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              const token = parsed.message?.content;
              if (token) controller.enqueue(token);
            } catch {
              // partial JSON line, skip
            }
          }
        }

        controller.close();
      } catch (err) {
        controller.enqueue(`Error: ${err instanceof Error ? err.message : "stream failed"}`);
        controller.close();
      }
    },
  });
}

export function getOllamaFastModel(): string {
  return OLLAMA_FAST_MODEL;
}

function parseJsonResponse<T>(raw: string, fallback: T): T {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    // Try fixing common issues: trailing commas, single quotes
    try {
      const fixed = match[0]
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/'/g, '"');
      return JSON.parse(fixed) as T;
    } catch {
      return fallback;
    }
  }
}

function parseArrayResponse(raw: string): string[] {
  const match = raw.match(/\[[\s\S]*?\]/);
  if (!match) {
    return raw
      .split("\n")
      .map((l) => l.replace(/^[-*\d.]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 10);
  }
  try {
    return JSON.parse(match[0]) as string[];
  } catch {
    return [];
  }
}

export const ollamaService: AIServiceInterface = {
  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    return ollamaChat(prompt, systemPrompt);
  },

  async summarizeText(text: string): Promise<AIResponse> {
    const truncated = text.slice(0, 6000);
    const system = `You are a knowledge assistant. Respond ONLY with valid JSON matching this schema:
{"summary": "string", "tags": ["string"], "insights": ["string"]}
No extra text before or after the JSON.`;

    const prompt = `Analyze the following content and return:
- summary: A concise 2-3 sentence summary
- tags: 3-6 relevant topic tags (lowercase, single words or short phrases)
- insights: 2-3 key takeaways or interesting points

Content:
${truncated}`;

    const raw = await ollamaChat(prompt, system);
    return parseJsonResponse<AIResponse>(raw, {
      summary: raw.slice(0, 500),
      tags: [],
      insights: [],
    });
  },

  async extractTags(text: string): Promise<string[]> {
    const truncated = text.slice(0, 4000);
    const system = "Respond ONLY with a JSON array of strings. No extra text.";
    const prompt = `Extract 3-6 relevant topic tags from the following text. Return as a JSON array of lowercase strings.

Text:
${truncated}`;

    const raw = await ollamaChat(prompt, system);
    return parseArrayResponse(raw);
  },

  async generateInsights(text: string): Promise<string[]> {
    const truncated = text.slice(0, 6000);
    const system = "Respond ONLY with a JSON array of strings. No extra text.";
    const prompt = `Analyze this content and provide 3-5 key insights, patterns, or actionable observations. Return as a JSON array of strings.

Content:
${truncated}`;

    const raw = await ollamaChat(prompt, system);
    return parseArrayResponse(raw);
  },

  async extractActionItems(text: string): Promise<string[]> {
    const truncated = text.slice(0, 4000);
    const system = "Respond ONLY with a JSON array of strings. No extra text.";
    const prompt = `Extract actionable items or tasks from the following text. Return as a JSON array of strings. If there are no action items, return an empty array.

Text:
${truncated}`;

    const raw = await ollamaChat(prompt, system);
    return parseArrayResponse(raw);
  },
};

const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

export const ollamaEmbeddingService: EmbeddingServiceInterface = {
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const truncated = text.slice(0, 4000);
    const res = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input: truncated }),
    });

    if (!res.ok) {
      throw new Error(`Ollama embedding error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const embedding: number[] = data.embeddings?.[0] ?? [];
    return { embedding, dimensions: embedding.length };
  },
};
