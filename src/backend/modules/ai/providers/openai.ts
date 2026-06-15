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

const log = logger.child("src/backend/modules/ai/providers/openai.ts");

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  readonly availableFeatures: AIFeature[] = [
    AIFeature.CHAT,
    AIFeature.EMBEDDINGS,
    AIFeature.MODERATION,
    AIFeature.VISION,
  ];

  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async chat(_messages: ChatMessage[], _options?: ChatOptions): Promise<ChatResponse> {
    log.warn("🤖 [OpenAI] Provider no implementado. Configure DEEPSEEK_API_KEY o implemente OpenAIProvider.");
    throw new Error(
      "OpenAIProvider no está implementado. " +
      "Use AIProviderFactory.create('deepseek') como fallback por defecto.",
    );
  }

  async embed(_text: string): Promise<EmbeddingResponse> {
    throw new Error("OpenAIProvider.embed() no implementado.");
  }

  async moderate(_content: string, _options?: ModerationOptions): Promise<ModerationResult> {
    throw new Error("OpenAIProvider.moderate() no implementado.");
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }
}
