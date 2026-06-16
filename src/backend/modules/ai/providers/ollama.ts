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

interface OllamaEmbeddingResponse {
  embedding: number[];
}

interface OllamaTagsResponse {
  models: Array<{ name: string }>;
}

export class OllamaProvider implements AIProvider {
  readonly name = "ollama" as const;
  readonly availableFeatures: AIFeature[] = [
    AIFeature.CHAT,
    AIFeature.EMBEDDINGS,
  ];

  private baseUrl: string;
  private embeddingModel: string;
  private timeout: number;

  constructor(config: AIProviderConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.embeddingModel = config.embeddingModel;
    this.timeout = config.timeout;
  }

  async chat(_messages: ChatMessage[], _options?: ChatOptions): Promise<ChatResponse> {
    log.warn("🤖 [Ollama] Chat no implementado en este provider.");
    throw new Error("OllamaProvider.chat() no implementado — use para embeddings únicamente.");
  }

  async embed(text: string): Promise<EmbeddingResponse> {
    log.debug("🤖 [Ollama] Generando embedding...", { model: this.embeddingModel, textLength: text.length });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.embeddingModel,
          prompt: text,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Ollama API error ${response.status}: ${body}`);
      }

      const data: OllamaEmbeddingResponse = await response.json();

      if (!data.embedding || !Array.isArray(data.embedding) || data.embedding.length === 0) {
        throw new Error("Ollama devolvió un embedding vacío");
      }

      log.debug("🤖 [Ollama] Embedding generado:", {
        model: this.embeddingModel,
        dimensions: data.embedding.length,
      });

      return {
        embedding: data.embedding,
        model: this.embeddingModel,
        tokens: 0,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error(`Ollama timeout después de ${this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async moderate(_content: string, _options?: ModerationOptions): Promise<ModerationResult> {
    throw new Error("OllamaProvider.moderate() no implementado.");
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) return false;

      const data: OllamaTagsResponse = await response.json();
      const modelExists = data.models?.some(m => m.name === this.embeddingModel);

      log.debug("🤖 [Ollama] Servidor disponible" + (modelExists ? "" : `, modelo ${this.embeddingModel} no encontrado`));

      return modelExists;
    } catch {
      log.warn("🤖 [Ollama] Servidor no disponible en", { baseUrl: this.baseUrl });
      return false;
    }
  }
}
