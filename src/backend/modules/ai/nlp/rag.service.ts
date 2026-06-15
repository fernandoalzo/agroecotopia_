import type { AIProvider } from "../providers/types";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/nlp/rag.service.ts");

export interface RAGContext {
  documents: Array<{ title: string; content: string; source: string; score: number }>;
}

export interface RAGOptions {
  maxDocuments?: number;
  minScore?: number;
}

export class RAGService {
  constructor(private provider: AIProvider) {}

  async retrieve(_query: string, _options?: RAGOptions): Promise<RAGContext> {
    log.info("[RAG] Service placeholder — implementar con pgvector cuando se active.");
    return { documents: [] };
  }

  async augmentPrompt(_query: string, _context: RAGContext): Promise<string> {
    log.info("[RAG] augmentPrompt placeholder — pendiente de implementación.");
    return "";
  }

  async search(_query: string): Promise<Array<Record<string, unknown>>> {
    log.info("[RAG] search placeholder — pendiente de implementación.");
    return [];
  }
}
