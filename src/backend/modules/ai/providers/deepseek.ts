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

const log = logger.child("src/backend/modules/ai/providers/deepseek.ts");

type DeepSeekModel =
  | "deepseek-chat"
  | "deepseek-reasoner"
  | "deepseek-embedding";

interface DeepSeekErrorResponse {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

interface DeepSeekChatChunk {
  choices: Array<{
    delta: { content?: string };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

interface DeepSeekEmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { prompt_tokens: number; total_tokens: number };
  model: string;
}

export class DeepSeekProvider implements AIProvider {
  readonly name = "deepseek" as const;
  readonly availableFeatures: AIFeature[] = [
    AIFeature.CHAT,
    AIFeature.EMBEDDINGS,
    AIFeature.MODERATION,
  ];

  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = {
      ...config,
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 30000,
    };
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const model = (options?.model || this.config.defaultModel) as DeepSeekModel;

    const body = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
      stream: false,
    };

    const data = await this.request<{
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number };
      model: string;
    }>("/v1/chat/completions", body);

    if (!data.choices?.[0]?.message?.content) {
      log.error("🤖 [DeepSeek] Respuesta vacía del modelo", { model });
      throw new Error("DeepSeek: respuesta vacía del modelo.");
    }

    log.debug("🤖 [DeepSeek] Chat completado", {
      model: data.model,
      tokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
    });

    return {
      content: data.choices[0].message.content,
      tokens: {
        input: data.usage?.prompt_tokens ?? 0,
        output: data.usage?.completion_tokens ?? 0,
      },
      model: data.model,
    };
  }

  async embed(text: string): Promise<EmbeddingResponse> {
    const model = this.config.embeddingModel as DeepSeekModel;

    const body = {
      model,
      input: text,
    };

    const data = await this.request<DeepSeekEmbeddingResponse>("/v1/embeddings", body);

    if (!data.data?.[0]?.embedding) {
      log.error("🤖 [DeepSeek] Embedding vacío", { model });
      throw new Error("DeepSeek: embedding vacío.");
    }

    log.debug("🤖 [DeepSeek] Embedding generado", {
      model: data.model,
      dimensions: data.data[0].embedding.length,
      tokens: data.usage?.total_tokens,
    });

    return {
      embedding: data.data[0].embedding,
      model: data.model,
      tokens: data.usage?.total_tokens ?? 0,
    };
  }

  async moderate(
    content: string,
    options?: ModerationOptions,
  ): Promise<ModerationResult> {
    const sensitivity = options?.sensitivity ?? "medium";

    const prompt =
      `Eres un moderador de contenido. Analiza el siguiente texto y responde SOLO con JSON.
      
      Criterios:
      - spam: contenido repetitivo, promocional no deseado, enlaces sospechosos
      - offensive: lenguaje ofensivo, discriminatorio, acoso
      - harmful: contenido peligroso, desinformación dañina
      
      Sensibilidad: ${sensitivity}
      
      Texto a analizar:
      """${content}"""
      
      Responde con:
      {
        "isSpam": boolean,
        "isOffensive": boolean,
        "isHarmful": boolean,
        "confidence": number (0-1),
        "reason": "explicación breve"
      }`;

    const response = await this.chat(
      [{ role: "user", content: prompt }],
      { temperature: 0, maxTokens: 300 },
    );

    try {
      const parsed = JSON.parse(response.content) as ModerationResult;
      log.debug("🤖 [DeepSeek] Moderación completada", {
        spam: parsed.isSpam,
        offensive: parsed.isOffensive,
        harmful: parsed.isHarmful,
        confidence: parsed.confidence,
      });
      return parsed;
    } catch {
      log.error("🤖 [DeepSeek] Error parseando resultado de moderación:", {
        raw: response.content,
      });
      return {
        isSpam: false,
        isOffensive: false,
        isHarmful: false,
        confidence: 0,
        reason: "Error al analizar contenido",
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.baseUrl}/v1/models`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      clearTimeout(timer);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({})) as DeepSeekErrorResponse;
          const message = errorBody?.error?.message || response.statusText;
          throw new Error(`DeepSeek API (${response.status}): ${message}`);
        }

        const data = await response.json() as T;
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          log.warn(`🤖 [DeepSeek] Reintento ${attempt}/${this.config.maxRetries}`, {
            path,
            delay,
            error: lastError.message,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    log.error("🤖 [DeepSeek] Todos los reintentos agotados", {
      path,
      lastError: lastError?.message,
    });

    throw lastError || new Error("DeepSeek: error desconocido tras reintentos.");
  }
}
