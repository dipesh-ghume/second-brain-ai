export interface AIResponse {
  summary: string;
  tags: string[];
  insights: string[];
}

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
}

export type AIProviderType = "openai" | "ollama" | "groq" | "smart";
export type TaskType = "summarize" | "extract_tags" | "insights" | "weekly_report" | "search_answer" | "action_items" | "general";
export type TaskComplexity = "simple" | "moderate" | "complex";

export interface AIServiceInterface {
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  summarizeText(text: string): Promise<AIResponse>;
  extractTags(text: string): Promise<string[]>;
  generateInsights(text: string): Promise<string[]>;
  extractActionItems(text: string): Promise<string[]>;
}

export interface EmbeddingServiceInterface {
  generateEmbedding(text: string): Promise<EmbeddingResult>;
}
