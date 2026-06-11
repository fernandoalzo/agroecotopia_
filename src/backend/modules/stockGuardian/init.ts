import type { PrismaClient } from "@prisma/client";
import { redisClient, isRedisAvailable } from "@/backend/cache/client";
import { CacheKeys } from "@/backend/cache";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/stockGuardian/init.ts");

/**
 * Inicializa stock:master:{productId} en Redis desde PostgreSQL.
 * Solo crea keys que NO existen (NX) para no sobrescribir el estado actual
 * si Redis ya tenía datos (ej: después de un reinicio del servidor sin reiniciar Redis).
 */
export async function initializeStockMaster(prisma: PrismaClient): Promise<void> {
  if (!isRedisAvailable || !redisClient) {
    log.info("[init] Redis no disponible — saltando inicialización de stock master");
    return;
  }

  try {
    const products = await prisma.product.findMany({
      select: { id: true, stock: true },
    });

    const pipeline = redisClient.pipeline();
    let count = 0;

    for (const p of products) {
      pipeline.set(CacheKeys.stock.master(p.id), Number(p.stock), "NX");
      count++;
    }

    await pipeline.exec();
    log.info(`[init] Stock master inicializado para ${count} productos en Redis`);
  } catch (error) {
    log.warn("[init] Error inicializando stock master en Redis:", error);
  }
}
