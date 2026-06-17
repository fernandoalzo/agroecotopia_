import { ProductRepository } from "./product.repository";
import { ProductService } from "./product.service";
import { ProductEmbeddingService } from "./productEmbedding.service";
import { CacheService } from "@/backend/cache";
import { EmbeddingRepository, EmbeddingService } from "@/backend/modules/shared/embedding";
import { OllamaProvider } from "@/backend/modules/ai/providers/ollama";
import type { AIProvider } from "@/backend/modules/ai/providers/types";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/product/index.ts");

const cacheService = new CacheService();

const embeddingProvider: AIProvider = new OllamaProvider({
  apiKey: "",
  baseUrl: config.ollama.baseUrl,
  defaultModel: "llama3.2:3b",
  embeddingModel: config.ollama.embeddingModel,
  maxRetries: 1,
  timeout: config.ollama.timeout,
});

const embeddingRepository = new EmbeddingRepository('ProductEmbedding', 'productId');
const genericEmbeddingService = new EmbeddingService(embeddingRepository, embeddingProvider, {
  batchSize: config.embedding.batchSize,
});

export const productRepository = new ProductRepository(cacheService);
export const productEmbeddingService = new ProductEmbeddingService(genericEmbeddingService);
export const productService = new ProductService(productRepository, productEmbeddingService);

if (config.ai.features.semanticSearch) {
  log.info("🤖 [Product] Búsqueda semántica habilitada por configuración. Verificando disponibilidad en primer uso...");
} else {
  log.info("[Product] Búsqueda textual activa. Para activar semántica: AI_FEATURE_SEMANTIC_SEARCH=true");
}
