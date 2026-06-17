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

interface OllamaChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

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
  private chatModel: string;
  private embeddingModel: string;
  private timeout: number;

  constructor(config: AIProviderConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.chatModel = config.defaultModel;
    this.embeddingModel = config.embeddingModel;
    this.timeout = config.timeout;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    log.debug("🤖 [Ollama] Chat completado...", {
      model: options?.model || this.chatModel,
      messagesCount: messages.length,
    });

    const model = options?.model || this.chatModel;

    const body: OllamaChatRequest = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 2048,
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`Ollama API error ${response.status}: ${errBody}`);
      }

      const data: OllamaChatResponse = await response.json();

      log.debug("🤖 [Ollama] Chat completado:", {
        model: data.model,
        inputTokens: data.prompt_eval_count ?? 0,
        outputTokens: data.eval_count ?? 0,
      });

      return {
        content: data.message.content,
        tokens: {
          input: data.prompt_eval_count ?? 0,
          output: data.eval_count ?? 0,
        },
        model: data.model,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error(`Ollama chat timeout después de ${this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async *streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown> {
    log.debug("🤖 [Ollama] Iniciando stream chat...", {
      model: options?.model || this.chatModel,
    });

    const model = options?.model || this.chatModel;
    const body: OllamaChatRequest = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 2048,
      },
    };

    const controller = new AbortController();
    let timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`Ollama API error ${response.status}: ${errBody}`);
      }

      if (!response.body) {
        throw new Error("No response body available for streaming");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        clearTimeout(timer);
        timer = setTimeout(() => controller.abort(), this.timeout);

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data: OllamaChatResponse = JSON.parse(line);
            if (data.message?.content) {
              yield data.message.content;
            }
          } catch (e) {
            log.warn("🤖 [Ollama] Error al parsear chunk JSON:", e);
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error(`Ollama chat timeout después de ${this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
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
      const models = data.models?.map(m => m.name) ?? [];
      const embeddingOk = models.some(m => m === this.embeddingModel);
      const chatOk = models.some(m => m === this.chatModel);

      log.debug("🤖 [Ollama] Servidor disponible", {
        embeddingModel: embeddingOk ? "✅" : "❌",
        chatModel: chatOk ? "✅" : "❌",
      });

      return embeddingOk && chatOk;
    } catch {
      log.warn("🤖 [Ollama] Servidor no disponible en", { baseUrl: this.baseUrl });
      return false;
    }
  }
}
