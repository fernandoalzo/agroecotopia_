import { Redis } from "ioredis";
import { isRedisAvailable } from "@/backend/cache";
import { CacheKeys } from "@/backend/cache";
import { config } from "@/config/config";
import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/stockGuardian/stockGuardian.service.ts");

const LOCK_RETRY_MAX = 3;
const LOCK_RETRY_DELAY_MS = 200;

type StockItem = {
  productId: string;
  quantity: number;
};

export { type StockItem };

export class StockGuardianService {
  constructor(private redis: Redis | null) {}

  private get redisReady(): boolean {
    return isRedisAvailable && this.redis !== null;
  }

  /**
   * Adquiere locks distribuidos para todos los productos.
   * Ordena productIds alfabéticamente para prevenir deadlocks.
   * Reintenta con exponential backoff si hay contención.
   *
   * Si Redis no está disponible, retorna true (sin locks → se usa DB como fallback).
   */
  async acquireProductLocks(productIds: string[], lockUUID: string): Promise<boolean> {
    if (!this.redisReady) {
      log.debug("[fallback DB] Redis no disponible — saltando locks distribuidos");
      return true;
    }

    const sortedIds = [...new Set(productIds)].sort();
    const ttl = config.cache.ttl.stockLock;

    for (let attempt = 1; attempt <= LOCK_RETRY_MAX; attempt++) {
      const acquired: string[] = [];

      for (const pid of sortedIds) {
        const key = CacheKeys.stock.lock(pid);
        const ok = await this.redis!.set(key, lockUUID, "EX", ttl, "NX");
        if (ok) {
          acquired.push(key);
        } else {
          break;
        }
      }

      if (acquired.length === sortedIds.length) {
        log.debug("Locks adquiridos exitosamente", { productIds: sortedIds });
        return true;
      }

      if (acquired.length > 0) {
        await this.redis!.del(...acquired);
      }

      if (attempt < LOCK_RETRY_MAX) {
        const delay = LOCK_RETRY_DELAY_MS * attempt;
        log.debug("Reintentando adquirir locks", { attempt, delay, productIds: sortedIds });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    log.warn("No se pudieron adquirir locks después de reintentos", { productIds: sortedIds, lockUUID });
    return false;
  }

  /**
   * Libera locks de producto usando Lua para verificar ownership (solo el mismo UUID puede liberar).
   */
  async releaseProductLocks(productIds: string[], lockUUID: string): Promise<void> {
    if (!this.redisReady) return;

    const sortedIds = [...new Set(productIds)];
    const pipeline = this.redis!.pipeline();

    const releaseScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      end
      return 0
    `;

    for (const pid of sortedIds) {
      pipeline.eval(releaseScript, 1, CacheKeys.stock.lock(pid), lockUUID);
    }

    await pipeline.exec();
    log.debug("Locks liberados", { productIds: sortedIds });
  }

  /**
   * Verifica y descuenta stock en Redis de forma atómica (Lua script).
   * Retorna true si todos los productos tenían stock suficiente.
   *
   * NOTA: Esto NO reemplaza la deducción en DB. Redis actúa como guardián
   * de carrera para detectar overselling ANTES de entrar a la transacción DB.
   * La DB es la fuente de verdad definitiva.
   */
  async checkAndDeductStock(items: StockItem[]): Promise<boolean> {
    if (!this.redisReady) {
      log.debug("[fallback DB] Redis no disponible — omitiendo verificación en Redis");
      return true;
    }

    const keys = items.map((i) => CacheKeys.stock.master(i.productId));
    const args = items.map((i) => String(i.quantity));

    const luaScript = `
      for i = 1, #KEYS do
        local stock = redis.call("GET", KEYS[i])
        if not stock or tonumber(stock) < tonumber(ARGV[i]) then
          return 0
        end
      end
      for i = 1, #KEYS do
        redis.call("DECRBY", KEYS[i], ARGV[i])
      end
      return 1
    `;

    try {
      const result = await this.redis!.eval(luaScript, keys.length, ...keys, ...args);
      const success = result === 1;
      if (success) {
        log.debug("Stock verificado y descontado en Redis exitosamente", {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        });
      } else {
        log.warn("Stock insuficiente en Redis — se detiene confirmación", {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        });
      }
      return success;
    } catch (error) {
      log.error("Error en Lua script de deducción Redis:", error);
      return false;
    }
  }

  /**
   * Restaura stock en Redis (INCRBY).
   * Se usa cuando una cancelación revierte stock previamente deducido.
   */
  async restoreStock(items: StockItem[]): Promise<void> {
    if (!this.redisReady) return;

    const pipeline = this.redis!.pipeline();
    for (const item of items) {
      pipeline.incrby(CacheKeys.stock.master(item.productId), item.quantity);
    }
    await pipeline.exec();
    log.debug("Stock restaurado en Redis", {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
  }

  /**
   * Obtiene stock disponible desde Redis (master), con fallback a DB.
   * Si la key no existe en Redis, la sincroniza desde DB automáticamente.
   */
  async getAvailableStock(productId: string): Promise<number> {
    if (!this.redisReady) {
      return this.fallbackGetStock(productId);
    }

    const key = CacheKeys.stock.master(productId);
    const val = await this.redis!.get(key);
    if (val !== null) {
      return parseInt(val, 10);
    }

    return this.syncMasterFromDB(productId);
  }

  /**
   * Sincroniza stock:master:{productId} desde PostgreSQL.
   * Retorna el valor del stock.
   */
  async syncMasterFromDB(productId: string): Promise<number> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });

    const stock = Number(product?.stock ?? 0);
    if (this.redisReady) {
      await this.redis!.set(CacheKeys.stock.master(productId), stock);
    }
    return stock;
  }

  private async fallbackGetStock(productId: string): Promise<number> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    return Number(product?.stock ?? 0);
  }
}
