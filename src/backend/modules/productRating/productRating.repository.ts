import prisma from "@/backend/db/prisma";
import { CacheService, CacheKeys } from "@/backend/cache";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/productRating/productRating.repository.ts");

interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export class ProductRatingRepository {
  constructor(private cacheService?: CacheService) {}

  async upsert(
    userId: string,
    productId: string,
    pedidoId: string,
    score: number,
    comment?: string,
  ) {
    log.debug("[db] Upserting product rating:", { userId, productId, pedidoId, score });

    const rating = await prisma.productRating.upsert({
      where: {
        productId_userId_pedidoId: { productId, userId, pedidoId },
      },
      create: { userId, productId, pedidoId, score, comment },
      update: { score, comment },
    });

    await this.recalculateProductRating(productId);
    await this.cacheService?.delPattern(CacheKeys.productRating.allPattern);

    log.info("[db] Product rating upserted:", { ratingId: rating.id, productId, score });
    return rating;
  }

  async findByProduct(productId: string, page: number = 1, limit: number = 10) {
    const key = CacheKeys.productRating.byProduct(productId, page, limit);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Fetching ratings for product:", { productId, page, limit });
        const skip = (page - 1) * limit;
        const [ratings, totalCount] = await Promise.all([
          prisma.productRating.findMany({
            where: { productId },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          }),
          prisma.productRating.count({ where: { productId } }),
        ]);
        return { ratings, totalCount, totalPages: Math.ceil(totalCount / limit), page, limit };
      },
      config.cache.ttl.productRatingList,
    ) ?? { ratings: [], totalCount: 0, totalPages: 0, page, limit };
  }

  async findByUserAndProduct(userId: string, productId: string) {
    const key = CacheKeys.productRating.byUserProduct(userId, productId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Fetching user rating for product:", { userId, productId });
        return prisma.productRating.findUnique({
          where: { productId_userId_pedidoId: { productId, userId, pedidoId: "" } },
        });
      },
      config.cache.ttl.productRatingDetail,
    ) ?? null;
  }

  async findPendingByUser(userId: string) {
    const key = CacheKeys.productRating.pendingByUser(userId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Fetching pending ratings for user:", { userId });
        const deliveredOrders = await prisma.pedido.findMany({
          where: { usuarioId: userId, estado: "ENTREGADO" },
          select: { id: true },
        });

        if (deliveredOrders.length === 0) return [];

        const pedidoIds = deliveredOrders.map((o) => o.id);

        const alreadyRated = await prisma.productRating.findMany({
          where: { userId, pedidoId: { in: pedidoIds } },
          select: { productId: true, pedidoId: true },
        });

        const ratedSet = new Set(alreadyRated.map((r) => `${r.productId}:${r.pedidoId}`));

        const detalles = await prisma.detallePedido.findMany({
          where: { pedidoId: { in: pedidoIds } },
          include: {
            producto: {
              select: { id: true, name: true, emoji: true, images: true, ratingAverage: true, ratingCount: true },
            },
            pedido: {
              select: { id: true, fechaEntregaReal: true },
            },
          },
          orderBy: { pedido: { fechaEntregaReal: "desc" } },
        });

        return detalles
          .filter((d) => !ratedSet.has(`${d.productoId}:${d.pedidoId}`))
          .map((d) => ({
            productId: d.productoId,
            productName: d.producto.name,
            productEmoji: d.producto.emoji,
            productImage: d.producto.images?.[0] || null,
            pedidoId: d.pedidoId,
            cantidad: Number(d.cantidad),
            fechaEntrega: d.pedido.fechaEntregaReal,
          }));
      },
      config.cache.ttl.productRatingPending,
    ) ?? [];
  }

  async getDistribution(productId: string): Promise<RatingDistribution> {
    const key = CacheKeys.productRating.distribution(productId);
    const result = await this.cacheService?.getOrSet<
      RatingDistribution
    >(
      key,
      async () => {
        log.debug("[db] Computing rating distribution for product:", { productId });
        const groups = await prisma.productRating.groupBy({
          by: ["score"],
          where: { productId },
          _count: { id: true },
        });

        const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const g of groups) {
          distribution[g.score as keyof RatingDistribution] = g._count.id;
        }
        return distribution;
      },
      config.cache.ttl.productRatingDetail,
    );
    return result ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }

  async getUserRating(userId: string, productId: string, pedidoId: string) {
    log.debug("[db] Fetching specific user rating:", { userId, productId, pedidoId });
    return prisma.productRating.findUnique({
      where: { productId_userId_pedidoId: { productId, userId, pedidoId } },
    });
  }

  private async recalculateProductRating(productId: string) {
    log.debug("[db] Recalculating rating aggregates for product:", { productId });
    const aggr = await prisma.productRating.aggregate({
      where: { productId },
      _sum: { score: true },
      _count: { id: true },
    });

    const total = aggr._sum.score || 0;
    const count = aggr._count.id || 0;
    const average = count > 0 ? Number((total / count).toFixed(2)) : null;

    await prisma.product.update({
      where: { id: productId },
      data: { ratingTotal: total, ratingCount: count, ratingAverage: average },
    });

    await this.cacheService?.delPattern(CacheKeys.product.allPattern);
  }
}
