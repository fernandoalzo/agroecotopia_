/**
 * ═══════════════════════════════════════════════════════════════
 *  AI Module — IoC Container (FASE IA)
 * ═══════════════════════════════════════════════════════════════
 *
 *  IMPORTANTE: Este módulo NO está activo por defecto.
 *  Para activarlo:
 *    1. Configurar AI_ENABLED=true en .env
 *    2. Configurar DEEPSEEK_API_KEY en .env
 *    3. Descomentar las exportaciones de servicio según necesidad
 *
 *  Arquitectura: Provider Factory + Service + Repository + Domain Stubs
 *  Todos los componentes siguen el mismo patrón IoC/DI del resto del backend.
 *
 *  @see README.md — Sección "FASE IA" para documentación completa
 * ═══════════════════════════════════════════════════════════════
 */

import { AIProviderFactory } from "./providers/factory";
import { AIService } from "./ai.service";
import { AIRepository } from "./ai.repository";
import { CacheService } from "@/backend/cache";
import { RAGService } from "./nlp/rag.service";
import { TranslationService } from "./nlp/translation.service";
import { ContentModerationService } from "./moderation/content-moderation.service";
import { DemandForecastingService } from "./forecasting/demand.service";
import { AIPricingService } from "./forecasting/pricing.service";
import { VisionService } from "./vision/vision.service";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/index.ts");

// ─── Cache ────────────────────────────────────────────────────
const cacheService = new CacheService();

// ─── Repository ────────────────────────────────────────────────
const aiRepository = new AIRepository(cacheService, {
  defaultTTL: 3600,
});

// ─── Provider ──────────────────────────────────────────────────
const AI_ENABLED = process.env.AI_ENABLED === 'true';

let aiService: AIService | null = null;
let ragService: RAGService | null = null;
let moderationService: ContentModerationService | null = null;
let translationService: TranslationService | null = null;
let demandService: DemandForecastingService | null = null;
let pricingService: AIPricingService | null = null;
let visionService: VisionService | null = null;

if (AI_ENABLED) {
  try {
    const provider = AIProviderFactory.create(
      (process.env.AI_PROVIDER as "deepseek" | "openai" | "ollama") || "deepseek",
      {
        apiKey: process.env.DEEPSEEK_API_KEY,
      },
    );

    ragService = new RAGService(provider);
    moderationService = new ContentModerationService(provider);
    translationService = new TranslationService();
    demandService = new DemandForecastingService();
    pricingService = new AIPricingService();
    visionService = new VisionService(provider);

    aiService = new AIService(provider, aiRepository, ragService);

    log.info("[AI] Módulo AI inicializado correctamente:", {
      provider: provider.name,
      features: provider.availableFeatures,
    });
  } catch (error) {
    log.error("[AI] Error al inicializar el módulo AI:", error);
    log.warn("[AI] El módulo AI no estará disponible. Verifique la configuración.");
  }
} else {
  log.info("[AI] Módulo AI presente pero desactivado. Configure AI_ENABLED=true para activarlo.");
}

// ─── Exports ───────────────────────────────────────────────────
// NOTA: Solo se exportan los servicios como null-safe wrappers.
// Las exportaciones son seguras aunque el módulo esté desactivado.

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
