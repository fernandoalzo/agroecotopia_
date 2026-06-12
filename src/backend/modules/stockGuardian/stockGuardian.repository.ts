import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/stockGuardian/stockGuardian.repository.ts");

export class StockGuardianRepository {
  async getProductStock(productId: string): Promise<number> {
    log.debug("[db] Obteniendo stock actual del producto:", { productId });
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    return Number(product?.stock ?? 0);
  }
}
