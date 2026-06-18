import type { AIProvider, ChatMessage, ChatOptions, ChatResponse } from "./providers/types";
import { AIRepository } from "./ai.repository";
import type { RAGService, RAGOptions } from "./nlp/rag.service";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/ai.service.ts");

export interface AIServiceOptions {
  defaultModel?: string;
  defaultTemperature?: number;
  maxTokens?: number;
}

export class AIService {
  constructor(
    private readonly provider: AIProvider,
    private readonly repository: AIRepository,
    private readonly rag?: RAGService,
    private readonly options: AIServiceOptions = {},
  ) { }

  getProvider(): AIProvider {
    return this.provider;
  }

  async moderateForumPost(title: string, body: string) {
    const { moderationService } = await import("@/backend/modules/ai");
    const { config } = await import("@/config/config");
    
    if (!config.ai.features.moderation || !moderationService) {
      return {
        isSpam: false,
        isOffensive: false,
        isHarmful: false,
        confidence: 1,
        reason: "Moderation disabled"
      };
    }
    return moderationService.moderateForumPost(title, body);
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const startTime = Date.now();

    const response = await this.provider.chat(messages, {
      model: options?.model || this.options.defaultModel,
      temperature: options?.temperature ?? this.options.defaultTemperature ?? 0.7,
      maxTokens: options?.maxTokens ?? this.options.maxTokens ?? 2048,
    });

    const elapsed = Date.now() - startTime;
    log.debug("🤖 [ai] Chat completado", {
      model: response.model,
      tokens: response.tokens,
      elapsed: `${elapsed}ms`,
    });

    return response;
  }

  async ragChat(
    messages: ChatMessage[],
    options?: ChatOptions & { rag?: RAGOptions },
  ): Promise<ChatResponse> {
    if (this.rag) {
      return this.rag.chat(messages, {
        model: options?.model || this.options.defaultModel,
        temperature: options?.temperature ?? this.options.defaultTemperature ?? 0.7,
        maxTokens: options?.maxTokens ?? this.options.maxTokens ?? 2048,
      });
    }

    log.debug("🤖 [ai] RAG no disponible, usando chat sin RAG");
    return this.chat(messages, options);
  }

  async *streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown> {
    if (!this.provider.streamChat) {
      throw new Error(`Streaming is not supported by the current AI provider: ${this.provider.name}`);
    }

    yield* this.provider.streamChat(messages, {
      model: options?.model || this.options.defaultModel,
      temperature: options?.temperature ?? this.options.defaultTemperature ?? 0.7,
      maxTokens: options?.maxTokens ?? this.options.maxTokens ?? 2048,
    });
  }

  async *ragStreamChat(
    messages: ChatMessage[],
    options?: ChatOptions & { rag?: RAGOptions },
  ): AsyncGenerator<string, void, unknown> {
    if (!this.provider.streamChat) {
      throw new Error(`Streaming is not supported by the current AI provider: ${this.provider.name}`);
    }

    if (this.rag) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
      let systemPrompt = "Eres un asistente amigable de Agroecotopia.";
      
      if (lastUserMsg) {
        const context = await this.rag.retrieve(lastUserMsg.content, options?.rag);
        systemPrompt = this.rag.buildSystemPrompt(context);
      }

      const augmentedMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];

      log.debug("🤖 [ai] RAG Stream: Iniciando con contexto", {
        systemPromptLength: systemPrompt.length,
      });

      yield* this.provider.streamChat(augmentedMessages, {
        model: options?.model || this.options.defaultModel,
        temperature: options?.temperature ?? this.options.defaultTemperature ?? 0.7,
        maxTokens: options?.maxTokens ?? this.options.maxTokens ?? 2048,
      });
      return;
    }

    log.debug("🤖 [ai] RAG no disponible, usando streamChat sin RAG");
    yield* this.streamChat(messages, options);
  }

  async embed(text: string): Promise<number[]> {
    const startTime = Date.now();

    const response = await this.provider.embed(text);

    const elapsed = Date.now() - startTime;
    log.debug("🤖 [ai] Embedding generado", {
      model: response.model,
      dimensions: response.embedding.length,
      elapsed: `${elapsed}ms`,
    });

    return response.embedding;
  }

  async generateProductDescription(data: {
    name: string;
    categories: string[];
    tags: string;
  }): Promise<string> {
    const systemPrompt = `Eres un redactor experto en productos agroecológicos y sostenibles. 
Genera descripciones de producto profesionales, persuasivas y bien estructuradas en español.
La descripción debe:
- Ser concisa pero informativa (3-5 párrafos breves)
- Destacar los beneficios del producto
- Usar un tono profesional pero cercano
- Incluir palabras clave relevantes para SEO
- NO incluir precios ni información de envío
- NO usar placeholders como "[nombre del producto]"
- Responder SOLO con la descripción, sin introducciones ni comentarios adicionales`;

    const userPrompt = `Genera una descripción atractiva para un producto agroecológico con estos datos:
- Nombre: ${data.name}
- Categorías: ${data.categories.join(", ") || "Sin categoría"}
- Etiquetas: ${data.tags || "Sin etiquetas"}`;

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    return response.content.trim();
  }

  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }
}
