import type { AIServiceInterface, AIResponse, AIProviderType, TaskType, EmbeddingServiceInterface, EmbeddingResult } from "./types";
import { ollamaService, ollamaEmbeddingService } from "./ollama";
import { openaiService, openaiEmbeddingService } from "./openai";
import { groqService, groqEmbeddingService } from "./groq";

function getProviderType(): AIProviderType {
  return (process.env.AI_PROVIDER as AIProviderType) || "ollama";
}

function hasOpenAI(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function hasGroq(): boolean {
  return !!process.env.GROQ_API_KEY;
}

function isCloud(): boolean {
  return !!process.env.VERCEL || !!process.env.RAILWAY || !!process.env.RENDER;
}

function selectProvider(taskType: TaskType, textLength: number = 0): AIServiceInterface {
  const providerType = getProviderType();

  if (providerType === "groq" && hasGroq()) return groqService;
  if (providerType === "openai" && hasOpenAI()) return openaiService;

  if (providerType === "smart") {
    if (taskType === "weekly_report" || taskType === "insights" || taskType === "search_answer" ||
        taskType === "action_items" || (taskType === "summarize" && textLength > 4000)) {
      if (hasOpenAI()) return openaiService;
      if (hasGroq()) return groqService;
    }
    if (hasGroq()) return groqService;
    if (hasOpenAI()) return openaiService;
  }

  if (isCloud()) {
    if (hasGroq()) return groqService;
    if (hasOpenAI()) return openaiService;
    throw new Error("No cloud AI provider configured. Set GROQ_API_KEY or OPENAI_API_KEY.");
  }

  return ollamaService;
}

function selectEmbeddingProvider(): EmbeddingServiceInterface {
  const providerType = getProviderType();

  if ((providerType === "openai" || providerType === "smart") && hasOpenAI()) {
    return openaiEmbeddingService;
  }
  if (providerType === "groq" && hasGroq()) {
    return groqEmbeddingService;
  }
  if (hasOpenAI()) return openaiEmbeddingService;
  if (hasGroq()) return groqEmbeddingService;

  if (isCloud()) {
    throw new Error("No cloud embedding provider configured. Set GROQ_API_KEY or OPENAI_API_KEY.");
  }

  return ollamaEmbeddingService;
}

function getFallbackProvider(primary: AIServiceInterface): AIServiceInterface | null {
  if (primary === groqService && hasOpenAI()) return openaiService;
  if (primary === openaiService && hasGroq()) return groqService;

  if (!isCloud()) {
    if (primary !== ollamaService) return ollamaService;
    if (hasGroq()) return groqService;
    if (hasOpenAI()) return openaiService;
  }

  return null;
}

function getFallbackEmbeddingProvider(primary: EmbeddingServiceInterface): EmbeddingServiceInterface | null {
  if (primary === groqEmbeddingService && hasOpenAI()) return openaiEmbeddingService;
  if (primary === openaiEmbeddingService && hasGroq()) return groqEmbeddingService;

  if (!isCloud()) {
    if (primary !== ollamaEmbeddingService) return ollamaEmbeddingService;
    if (hasGroq()) return groqEmbeddingService;
    if (hasOpenAI()) return openaiEmbeddingService;
  }

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
