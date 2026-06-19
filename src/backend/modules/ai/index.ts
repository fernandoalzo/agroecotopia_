import { AIProviderFactory } from "./providers/factory";
import { AIService } from "./ai.service";
import { AIRepository } from "./ai.repository";
import { CacheService } from "@/backend/cache";
import {
  RAGService,
  ForumRetriever,
  ProductRetriever,
  PlatformRetriever,
} from "./nlp/rag.service";
import { TranslationService } from "./nlp/translation.service";
import { ContentModerationService } from "./moderation/content-moderation.service";
import { DemandForecastingService } from "./forecasting/demand.service";
import { AIPricingService } from "./forecasting/pricing.service";
import { VisionService } from "./vision/vision.service";
import { config } from "@/config/config";
import prisma from "@/backend/db/prisma";
import { EmbeddingRepository } from "@/backend/modules/shared/embedding";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/index.ts");

// ─── Cache ────────────────────────────────────────────────────
const cacheService = new CacheService();

// ─── Repository ────────────────────────────────────────────────
const aiRepository = new AIRepository(cacheService, {
  defaultTTL: 3600,
});

// ─── Provider ──────────────────────────────────────────────────
const AI_ENABLED = config.ai.enabled;

let aiService: AIService | null = null;
let ragService: RAGService | null = null;
let moderationService: ContentModerationService | null = null;
let translationService: TranslationService | null = null;
let demandService: DemandForecastingService | null = null;
let pricingService: AIPricingService | null = null;
let visionService: VisionService | null = null;

// ═══════════════════════════════════════════════════════════════
//  🤖  AI MODULE STATUS
// ═══════════════════════════════════════════════════════════════

if (AI_ENABLED) {
  try {
    const provider = AIProviderFactory.create(
      config.ai.provider,
      {
        apiKey: config.ai.apiKeys.deepseek,
        baseUrl: config.ollama.baseUrl,
        defaultModel: "llama3.2:3b",
        embeddingModel: config.ollama.embeddingModel,
        timeout: 180000,
      },
    );

    // ─── RAG Service ──────────────────────────────────────────
    ragService = new RAGService(provider);

    // Registrar retrievers de plataforma (siempre disponibles)
    ragService.registerRetriever(new PlatformRetriever());

    // ─── Shared embedding generator + retrievers ────────────────
    const forumRepo = new EmbeddingRepository('ForumPostEmbedding', 'postId');
    const productRepo = new EmbeddingRepository('ProductEmbedding', 'productId');

    let lastQueryEmbedding: { query: string; embedding: number[] } | null = null;

    async function getQueryEmbedding(query: string): Promise<number[]> {
      if (lastQueryEmbedding?.query === query) return lastQueryEmbedding.embedding;
      const embedding = await provider.embed(query);
      lastQueryEmbedding = { query, embedding: embedding.embedding };
      return embedding.embedding;
    }

    async function searchForumPosts(query: string, limit: number) {
      const embedding = await getQueryEmbedding(query);
      const results = await forumRepo.searchSimilar(embedding, limit, 0.48);
      if (results.length === 0) return [];

      const ids = results.map(r => r.entityId);
      const posts = await prisma.forumPost.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true, body: true, labels: true },
      });
      const postMap = new Map(posts.map(p => [p.id, p]));

      return results
        .filter(r => postMap.has(r.entityId))
        .map(r => ({
          id: r.entityId,
          title: postMap.get(r.entityId)!.title,
          body: postMap.get(r.entityId)!.body,
          labels: postMap.get(r.entityId)!.labels ?? [],
          similarity: r.similarity,
        }));
    }

    async function searchProducts(query: string, limit: number) {
      const embedding = await getQueryEmbedding(query);
      const results = await productRepo.searchSimilar(embedding, limit, 0.6);
      if (results.length === 0) return [];

      const ids = results.map(r => r.entityId);
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, description: true, tag: true },
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      return results
        .filter(r => productMap.has(r.entityId))
        .map(r => ({
          id: r.entityId,
          name: productMap.get(r.entityId)!.name,
          description: productMap.get(r.entityId)!.description,
          tag: productMap.get(r.entityId)!.tag,
          categories: [],
          similarity: r.similarity,
        }));
    }

    ragService.registerRetriever(new ForumRetriever(searchForumPosts));
    ragService.registerRetriever(new ProductRetriever(searchProducts));

    moderationService = new ContentModerationService(provider);
    translationService = new TranslationService();
    demandService = new DemandForecastingService();
    pricingService = new AIPricingService();
    visionService = new VisionService(provider);

    aiService = new AIService(provider, aiRepository, ragService);

    log.info("🤖 [AI] Módulo AI inicializado correctamente:", {
      provider: provider.name,
      features: provider.availableFeatures,
      retrievers: 3,
    });
  } catch (error) {
    log.error("🤖 [AI] Error al inicializar el módulo AI:", error);
    log.warn("🤖 [AI] El módulo AI no estará disponible. Verifique la configuración.");
  }
} else {
  log.info("🤖 [AI] Módulo AI presente pero DESACTIVADO. Configure AI_ENABLED=true para activarlo.");
}

const aiStatus = AI_ENABLED
  ? `🤖 [AI] ESTADO: ✅ ACTIVO (proveedor: ${config.ai.provider})`
  : "🤖 [AI] ESTADO: ⛔ INACTIVO — módulo presente, esperando AI_ENABLED=true";

log.info(aiStatus);

// ─── Exports ───────────────────────────────────────────────────
export {
  aiService,
  ragService,
  moderationService,
  translationService,
  demandService,
  pricingService,
  visionService,
  aiRepository,
};

export * from "./ai.actions";
export type { AIProvider, ProviderName } from "./providers/types";
export { AIProviderFactory } from "./providers/factory";
