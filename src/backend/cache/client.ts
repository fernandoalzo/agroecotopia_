import Redis from "ioredis";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/cache/client.ts");

const REDIS_GLOBAL_KEY = "__redisClient";
const REDIS_AVAILABLE_KEY = "__redisAvailable";

const getGlobalStorage = () => {
  if (typeof process !== "undefined" && (process as any)[REDIS_GLOBAL_KEY]) {
    return process as any;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any)[REDIS_GLOBAL_KEY]) {
    return globalThis as any;
  }
  return null;
};

let redisClient: Redis | null = null;
let isRedisAvailable = false;

const existing = getGlobalStorage();
if (existing) {
  redisClient = existing[REDIS_GLOBAL_KEY];
  isRedisAvailable = existing[REDIS_AVAILABLE_KEY] ?? false;
  log.debug("Reutilizando instancia existente de Redis.");
} else {
  if (config.cache.redisUrl && config.cache.enabled) {
    try {
      log.info("Inicializando conexión a Redis...");
      redisClient = new Redis(config.cache.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: null,
        retryStrategy: (times: number) => {
          if (times > 5) {
            log.warn("Redis: se alcanzó el máximo de reintentos. Caché deshabilitado.");
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        enableReadyCheck: true,
      });

      redisClient.on("connect", () => {
        isRedisAvailable = true;
        log.info("Redis conectado exitosamente.");
      });

      redisClient.on("ready", () => {
        isRedisAvailable = true;
      });

      redisClient.on("error", (err: Error) => {
        isRedisAvailable = false;
        log.warn("Redis: error de conexión:", err.message);
      });

      redisClient.on("close", () => {
        isRedisAvailable = false;
      });

      redisClient.on("reconnecting", () => {
        isRedisAvailable = false;
      });

      redisClient.connect().catch((err: Error) => {
        isRedisAvailable = false;
        log.warn("No se pudo conectar a Redis. Caché deshabilitado:", err.message);
      });

      if (typeof process !== "undefined") {
        (process as any)[REDIS_GLOBAL_KEY] = redisClient;
        (process as any)[REDIS_AVAILABLE_KEY] = false;
      }
      (globalThis as any)[REDIS_GLOBAL_KEY] = redisClient;
      (globalThis as any)[REDIS_AVAILABLE_KEY] = false;
    } catch (error) {
      isRedisAvailable = false;
      log.warn("No se pudo inicializar Redis. Caché deshabilitado:", (error as Error).message);
    }
  } else {
    log.info("REDIS_URL no configurada o CACHE_ENABLED=false. Caché deshabilitado.");
  }
}

export { redisClient, isRedisAvailable };
