import type { AIProvider, ChatMessage, ChatOptions, ChatResponse } from "../providers/types";
import logger from "@/utils/logger";
import { searchPlatformDocuments, type PlatformDocument } from "./platform-content";

const log = logger.child("src/backend/modules/ai/nlp/rag.service.ts");

export interface RAGDocument {
  title: string;
  content: string;
  source: string;
  score: number;
}

export interface RAGContext {
  documents: RAGDocument[];
}

export interface RAGOptions {
  maxDocuments?: number;
  minScore?: number;
}

export interface Retriever {
  readonly name: string;
  retrieve(query: string, maxDocs: number): Promise<RAGDocument[]>;
}

const SYSTEM_PROMPT_BASE = `Eres un asistente de soporte especializado en agricultura y la plataforma Agroecotopia.

INSTRUCCIONES:
- Responde de forma clara, concisa y amable en español.
- Usa la información de contexto proporcionada para responder.
- Si no encuentras información relevante en el contexto, indícalo amablemente y sugiere contactar con soporte humano.
- No inventes información que no esté respaldada por el contexto.
- Cuando menciones productos del catálogo, incluye detalles como precio (si está disponible) y unidad de medida.
- Si la pregunta es sobre el foro, responde basándote en las discusiones existentes.`;

const SYSTEM_PROMPT_NO_CONTEXT = `Eres un asistente de soporte especializado en agricultura y la plataforma Agroecotopia.

INSTRUCCIONES:
- Responde de forma clara, concisa y amable en español.
- Ayuda a los usuarios con sus preguntas sobre agricultura y la plataforma.
- Si no puedes responder algo, indícalo y sugiere contactar con soporte humano.
- No inventes información.`;

export class RAGService {
  private retrievers: Retriever[] = [];

  constructor(private provider: AIProvider) {}

  registerRetriever(retriever: Retriever): void {
    this.retrievers.push(retriever);
    log.info("[RAG] Retriever registrado:", { name: retriever.name });
  }

  async retrieve(query: string, options?: RAGOptions): Promise<RAGContext> {
    const maxDocs = options?.maxDocuments ?? 8;
    const minScore = options?.minScore ?? 0;

    if (this.retrievers.length === 0) {
      log.warn("[RAG] No hay retrievers registrados — retornando contexto vacío");
      return { documents: [] };
    }

    const startTime = Date.now();

    const results = await Promise.all(
      this.retrievers.map(r =>
        r.retrieve(query, maxDocs).catch(err => {
          log.warn(`[RAG] Error en retriever ${r.name}:`, err);
          return [] as RAGDocument[];
        }),
      ),
    );

    const documents = results
      .flat()
      .filter(d => d.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxDocs);

    const elapsed = Date.now() - startTime;

    log.info("[RAG] Retrieval completado:", {
      query: query.slice(0, 100),
      totalDocuments: documents.length,
      sources: [...new Set(documents.map(d => d.source))],
      elapsed: `${elapsed}ms`,
    });

    return { documents };
  }

  buildSystemPrompt(context: RAGContext): string {
    if (context.documents.length === 0) {
      return SYSTEM_PROMPT_NO_CONTEXT;
    }

    const contextStr = context.documents
      .map((d, i) => {
        const header = `[${i + 1}] Fuente: ${d.source}`;
        const title = d.title ? `Título: ${d.title}` : "";
        return `${header}${title ? `\n${title}` : ""}\n${d.content}`;
      })
      .join("\n\n---\n\n");

    return `${SYSTEM_PROMPT_BASE}

CONTEXTO RELEVANTE:
${contextStr}

Responde a la pregunta del usuario basándote en el contexto anterior. Si el contexto no contiene información suficiente para responder, dilo claramente.`;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");

    let systemPrompt = SYSTEM_PROMPT_NO_CONTEXT;

    if (lastUserMsg) {
      const context = await this.retrieve(lastUserMsg.content);
      systemPrompt = this.buildSystemPrompt(context);
    }

    const augmentedMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    log.debug("[RAG] Enviando mensaje a LLM con contexto", {
      systemPromptLength: systemPrompt.length,
      messagesCount: augmentedMessages.length,
    });

    return this.provider.chat(augmentedMessages, options);
  }

  async search(query: string, options?: RAGOptions): Promise<RAGDocument[]> {
    const context = await this.retrieve(query, options);
    return context.documents;
  }
}

export class ForumRetriever implements Retriever {
  readonly name = "foro";

  constructor(
    private searchPosts: (query: string, limit: number) => Promise<Array<{ id: string; title: string; body: string; labels: string[]; similarity: number }>>,
  ) {}

  async retrieve(query: string, maxDocs: number): Promise<RAGDocument[]> {
    const results = await this.searchPosts(query, maxDocs);
    return results.map(r => ({
      title: r.title,
      content: `Etiquetas: ${r.labels?.join(", ") ?? ""}\n${r.body}`,
      source: "Foro Comunitario",
      score: r.similarity,
    }));
  }
}

export class ProductRetriever implements Retriever {
  readonly name = "productos";

  constructor(
    private searchProducts: (query: string, limit: number) => Promise<Array<{ id: string; name: string; description: string; tag: string; categories?: string[]; similarity: number }>>,
  ) {}

  async retrieve(query: string, maxDocs: number): Promise<RAGDocument[]> {
    const results = await this.searchProducts(query, maxDocs);
    return results.map(r => ({
      title: r.name,
      content: `Categoría: ${r.categories?.join(", ") ?? ""}\nTipo: ${r.tag}\nDescripción: ${r.description}`,
      source: "Catálogo de Productos",
      score: r.similarity,
    }));
  }
}

export class PlatformRetriever implements Retriever {
  readonly name = "plataforma";

  async retrieve(query: string, _maxDocs: number): Promise<RAGDocument[]> {
    const docs = searchPlatformDocuments(query);
    return docs.map(d => ({
      title: d.title,
      content: d.content,
      source: `Plataforma - ${d.category}`,
      score: 1,
    }));
  }
}
