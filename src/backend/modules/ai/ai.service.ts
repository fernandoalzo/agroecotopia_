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

  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }
}
