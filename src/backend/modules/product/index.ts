import { ProductRepository } from "./product.repository";
import { ProductService } from "./product.service";
import { ProductEmbeddingRepository } from "./productEmbedding.repository";
import { ProductEmbeddingService } from "./productEmbedding.service";
import { CacheService } from "@/backend/cache";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/product/index.ts");

const cacheService = new CacheService();

export const productRepository = new ProductRepository(cacheService);
export const productEmbeddingRepository = new ProductEmbeddingRepository();
export const productEmbeddingService = new ProductEmbeddingService(productEmbeddingRepository);
export const productService = new ProductService(productRepository, productEmbeddingService);

if (config.ai.features.semanticSearch) {
  log.info("🤖 [Product] Búsqueda semántica habilitada por configuración. Verificando disponibilidad en primer uso...");
} else {
  log.info("[Product] Búsqueda textual activa. Para activar semántica: AI_FEATURE_SEMANTIC_SEARCH=true");
}
