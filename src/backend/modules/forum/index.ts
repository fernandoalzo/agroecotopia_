import { ForumRepository } from "./forum.repository";
import { ForumService } from "./forum.service";
import { ForumPostEmbeddingService } from "./forumPostEmbedding.service";
import { CacheService } from "@/backend/cache";
import { userRepository } from "@/backend/modules/user";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/forum/index.ts");

const cacheService = new CacheService();

export const forumRepository = new ForumRepository(cacheService);
export const forumPostEmbeddingService = new ForumPostEmbeddingService();
export const forumService = new ForumService(forumRepository, userRepository, forumPostEmbeddingService);

if (config.ai.features.semanticSearch) {
  log.info("🤖 [Forum] Búsqueda semántica habilitada por configuración. Verificando disponibilidad en primer uso...");
} else {
  log.info("[Forum] Búsqueda textual activa. Para activar semántica: AI_FEATURE_SEMANTIC_SEARCH=true");
}
