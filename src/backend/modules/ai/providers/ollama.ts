import type {
  AIProvider,
  AIProviderConfig,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  EmbeddingResponse,
  ModerationResult,
  ModerationOptions,
} from "./types";
import { AIFeature } from "./types";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/providers/ollama.ts");

export class OllamaProvider implements AIProvider {
  readonly name = "ollama" as const;
  readonly availableFeatures: AIFeature[] = [
    AIFeature.CHAT,
    AIFeature.EMBEDDINGS,
  ];

  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async chat(_messages: ChatMessage[], _options?: ChatOptions): Promise<ChatResponse> {
    log.warn("[Ollama] Provider no implementado. Use DeepSeek u OpenAI como fallback.");
    throw new Error(
      "OllamaProvider no está implementado. " +
      "Para ejecución local, implemente la integración con Ollama API.",
    );
  }

  async embed(_text: string): Promise<EmbeddingResponse> {
    throw new Error("OllamaProvider.embed() no implementado.");
  }

  async moderate(_content: string, _options?: ModerationOptions): Promise<ModerationResult> {
    throw new Error("OllamaProvider.moderate() no implementado.");
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }
}
