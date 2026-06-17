import { ForumRepository } from "./forum.repository";
import { ForumService } from "./forum.service";
import { ForumPostEmbeddingService } from "./forumPostEmbedding.service";
import { CacheService } from "@/backend/cache";
import { userRepository } from "@/backend/modules/user";
import { EmbeddingRepository, EmbeddingService } from "@/backend/modules/shared/embedding";
import { OllamaProvider } from "@/backend/modules/ai/providers/ollama";
import type { AIProvider } from "@/backend/modules/ai/providers/types";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/forum/index.ts");

const cacheService = new CacheService();

const embeddingProvider: AIProvider = new OllamaProvider({
  apiKey: "",
  baseUrl: config.ollama.baseUrl,
  defaultModel: "llama3.2",
  embeddingModel: config.ollama.embeddingModel,
  maxRetries: 1,
  timeout: config.ollama.timeout,
});

const embeddingRepository = new EmbeddingRepository('ForumPostEmbedding', 'postId');
const genericEmbeddingService = new EmbeddingService(embeddingRepository, embeddingProvider, {
  batchSize: config.embedding.batchSize,
});

export const forumRepository = new ForumRepository(cacheService);
export const forumPostEmbeddingService = new ForumPostEmbeddingService(genericEmbeddingService);
export const forumService = new ForumService(forumRepository, userRepository, forumPostEmbeddingService);

if (config.ai.features.semanticSearch) {
  log.info("🤖 [Forum] Búsqueda semántica habilitada por configuración. Verificando disponibilidad en primer uso...");
} else {
  log.info("[Forum] Búsqueda textual activa. Para activar semántica: AI_FEATURE_SEMANTIC_SEARCH=true");
}
