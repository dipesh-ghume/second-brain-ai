import type { AIServiceInterface, AIResponse, AIProviderType, TaskType, EmbeddingServiceInterface, EmbeddingResult } from "./types";
import { ollamaService, ollamaEmbeddingService } from "./ollama";
import { openaiService, openaiEmbeddingService } from "./openai";

function getProviderType(): AIProviderType {
  return (process.env.AI_PROVIDER as AIProviderType) || "ollama";
}

function hasOpenAI(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function selectProvider(taskType: TaskType, textLength: number = 0): AIServiceInterface {
  const providerType = getProviderType();

  if (providerType === "openai" && hasOpenAI()) return openaiService;
  if (providerType === "openai") return ollamaService;
  if (providerType === "ollama") return ollamaService;

  // "smart" mode: use OpenAI for complex tasks if available
  if (taskType === "weekly_report" || taskType === "insights" || taskType === "search_answer") {
    if (hasOpenAI()) return openaiService;
  }
  if (taskType === "action_items" || (taskType === "summarize" && textLength > 4000)) {
    if (hasOpenAI()) return openaiService;
  }
  return ollamaService;
}

function selectEmbeddingProvider(): EmbeddingServiceInterface {
  const providerType = getProviderType();
  if ((providerType === "openai" || providerType === "smart") && hasOpenAI()) {
    return openaiEmbeddingService;
  }
  return ollamaEmbeddingService;
}

function getFallbackProvider(primary: AIServiceInterface): AIServiceInterface | null {
  if (primary === ollamaService && hasOpenAI()) return openaiService;
  if (primary === openaiService) return ollamaService;
  return null;
}

function getFallbackEmbeddingProvider(primary: EmbeddingServiceInterface): EmbeddingServiceInterface | null {
  if (primary === ollamaEmbeddingService && hasOpenAI()) return openaiEmbeddingService;
  if (primary === openaiEmbeddingService) return ollamaEmbeddingService;
  return null;
}

async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: (() => Promise<T>) | null
): Promise<T> {
  try {
    return await primary();
  } catch (err) {
    console.error("Primary AI provider failed:", err instanceof Error ? err.message : err);
    if (fallback) {
      console.error("Trying fallback provider...");
      return fallback();
    }
    throw err;
  }
}

export const ai = {
  async generateText(prompt: string, systemPrompt?: string, taskType: TaskType = "general"): Promise<string> {
    const provider = selectProvider(taskType, prompt.length);
    const fb = getFallbackProvider(provider);
    return withFallback(
      () => provider.generateText(prompt, systemPrompt),
      fb ? () => fb.generateText(prompt, systemPrompt) : null
    );
  },

  async summarizeText(text: string): Promise<AIResponse> {
    const provider = selectProvider("summarize", text.length);
    const fb = getFallbackProvider(provider);
    return withFallback(
      () => provider.summarizeText(text),
      fb ? () => fb.summarizeText(text) : null
    );
  },

  async extractTags(text: string): Promise<string[]> {
    const provider = selectProvider("extract_tags", text.length);
    const fb = getFallbackProvider(provider);
    return withFallback(
      () => provider.extractTags(text),
      fb ? () => fb.extractTags(text) : null
    );
  },

  async generateInsights(text: string): Promise<string[]> {
    const provider = selectProvider("insights", text.length);
    const fb = getFallbackProvider(provider);
    return withFallback(
      () => provider.generateInsights(text),
      fb ? () => fb.generateInsights(text) : null
    );
  },

  async extractActionItems(text: string): Promise<string[]> {
    const provider = selectProvider("action_items", text.length);
    const fb = getFallbackProvider(provider);
    return withFallback(
      () => provider.extractActionItems(text),
      fb ? () => fb.extractActionItems(text) : null
    );
  },
};

export const embeddings = {
  async generate(text: string): Promise<EmbeddingResult> {
    const provider = selectEmbeddingProvider();
    const fb = getFallbackEmbeddingProvider(provider);
    return withFallback(
      () => provider.generateEmbedding(text),
      fb ? () => fb.generateEmbedding(text) : null
    );
  },
};
