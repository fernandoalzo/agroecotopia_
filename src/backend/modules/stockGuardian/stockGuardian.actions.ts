"use server";

import { stockGuardianService } from "./index";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/stockGuardian/stockGuardian.actions.ts");

/**
 * Obtiene el stock disponible en tiempo real para un producto.
 * Consulta Redis (master) primero, con fallback a DB.
 */
export async function getAvailableStockAction(productId: string): Promise<number> {
  try {
    const stock = await stockGuardianService.getAvailableStock(productId);
    return stock;
  } catch (error) {
    log.error("Error obteniendo stock disponible:", { productId, error });
    return 0;
  }
}

/**
 * Obtiene el stock disponible para múltiples productos a la vez.
 */
export async function getAvailableStockBatchAction(
  productIds: string[]
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  try {
    for (const id of productIds) {
      result[id] = await stockGuardianService.getAvailableStock(id);
    }
    return result;
  } catch (error) {
    log.error("Error obteniendo stock batch:", { productIds, error });
    return result;
  }
}
