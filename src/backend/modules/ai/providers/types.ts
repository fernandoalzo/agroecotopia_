export type Role = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  tokens: {
    input: number;
    output: number;
  };
  model: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  tokens: number;
}

export interface ModerationResult {
  isSpam: boolean;
  isOffensive: boolean;
  isHarmful: boolean;
  confidence: number;
  reason?: string;
}

export interface ModerationOptions {
  sensitivity?: "low" | "medium" | "high";
}

export interface AIProviderConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  embeddingModel: string;
  maxRetries: number;
  timeout: number;
}

export type ProviderName = "deepseek" | "openai" | "ollama";

export enum AIFeature {
  CHAT = "chat",
  EMBEDDINGS = "embeddings",
  MODERATION = "moderation",
  VISION = "vision",
}

export const PROVIDER_DEFAULTS: Record<ProviderName, Partial<AIProviderConfig>> = {
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    embeddingModel: "deepseek-embedding",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
  },
  ollama: {
    baseUrl: "http://localhost:11434",
    defaultModel: "llama3.2",
    embeddingModel: "nomic-embed-text",
  },
};

export interface AIProvider {
  readonly name: ProviderName;
  readonly availableFeatures: AIFeature[];

  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  streamChat?(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown>;
  embed(text: string): Promise<EmbeddingResponse>;

  moderate?(content: string, options?: ModerationOptions): Promise<ModerationResult>;

  isAvailable(): Promise<boolean>;
}
