import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { redisClient } from "@/backend/cache/client";
import logger from "@/utils/logger";
import type { WafRateLimitConfig } from "./types";

const log = logger.child("src/lib/waf/rate-limiter.ts");

let currentConfigs: WafRateLimitConfig[] = [];
let rateLimitersMap: Map<string, {
  limiter: RateLimiterRedis | RateLimiterMemory;
  config: WafRateLimitConfig;
}> = new Map();

/**
 * Re-initializes the rate limiters when the WAF config changes.
 * Uses RateLimiterRedis if a Redis client is available, with an internal RateLimiterMemory as insurance.
 * If Redis is completely absent, it falls back to a pure RateLimiterMemory.
 */
export function initializeRateLimiter(configs: WafRateLimitConfig[]) {
  if (!configs || configs.length === 0) {
    rateLimitersMap.clear();
    currentConfigs = [];
    return;
  }

  // Simple diff: if exactly the same configs, skip reinit
  if (JSON.stringify(currentConfigs) === JSON.stringify(configs)) {
    return;
  }

  currentConfigs = [...configs];
  rateLimitersMap.clear();

  log.info(`[waf-rate-limit] Inicializando ${configs.length} Rate Limiters.`);

  for (const config of configs) {
    const memoryLimiter = new RateLimiterMemory({
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
    });

    let limiter: RateLimiterRedis | RateLimiterMemory;

    if (redisClient) {
      limiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: `waf_rl:${config.id}`,
        points: config.points,
        duration: config.duration,
        blockDuration: config.blockDuration,
        insuranceLimiter: memoryLimiter,
      });
    } else {
      limiter = memoryLimiter;
    }

    rateLimitersMap.set(config.id, { limiter, config });
  }

  log.debug(`[waf-rate-limit] Configurados ${rateLimitersMap.size} limitadores. (Redis disponible: ${!!redisClient})`);
}

/**
 * Verifica el rate limit para una IP y un Path dado.
 * Iterates over compiled rate limit configs to match path.
 * Retorna true si la IP está BLOQUEADA por ALGUNO de los limitadores.
 * Retorna false si la petición puede continuar en TODOS los limitadores que coinciden.
 */
export async function evaluateRateLimit(ip: string, path: string, compiledConfigs: (WafRateLimitConfig & { compiledPathRegex: RegExp })[]): Promise<boolean> {
  if (rateLimitersMap.size === 0 || !compiledConfigs || compiledConfigs.length === 0) return false;

  const matchedLimiters: { limiter: RateLimiterRedis | RateLimiterMemory, config: WafRateLimitConfig }[] = [];

  for (const cc of compiledConfigs) {
    if (cc.compiledPathRegex.test(path)) {
      const entry = rateLimitersMap.get(cc.id);
      if (entry) {
        matchedLimiters.push(entry);
      }
    }
  }

  if (matchedLimiters.length === 0) return false;

  try {
    // Consume 1 point for ALL matched limiters concurrently
    await Promise.all(matchedLimiters.map(ml => ml.limiter.consume(ip, 1)));
    return false; // Not blocked by any
  } catch (rejRes) {
    if (rejRes instanceof Error) {
      log.warn("[waf-rate-limit] Error interno evaluando límite concurrentemente:", rejRes);
      return false; // Fail-open
    }
    
    // Si no es un Error, es una promesa rechazada con RateLimiterRes (límite superado)
    const res = rejRes as RateLimiterRes;
    log.debug(`[waf-rate-limit] IP ${ip} bloqueada en ruta ${path}. MS restantes: ${res.msBeforeNext}`);
    return true; // Bloqueado por AL MENOS uno
  }
}
