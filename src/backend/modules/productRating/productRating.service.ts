import { ProductRatingRepository } from "./productRating.repository";
import { calculateBayesianAverage } from "@/utils/ratingSystem";
import logger from "@/utils/logger";
import eventBus from "@/utils/eventBus";

const log = logger.child("src/backend/modules/productRating/productRating.service.ts");

export class ProductRatingService {
  constructor(private productRatingRepository: ProductRatingRepository) {}

  async rateProduct(
    userId: string,
    productId: string,
    pedidoId: string,
    score: number,
    comment?: string,
  ) {
    if (score < 1 || score > 5) {
      throw new Error("La calificación debe estar entre 1 y 5 estrellas");
    }

    log.info("Rating product:", { userId, productId, pedidoId, score });

    const rating = await this.productRatingRepository.upsert(userId, productId, pedidoId, score, comment);

    const distribution = await this.productRatingRepository.getDistribution(productId);
    const product = await this.getProductRatingSummary(productId);

    const bayesian = calculateBayesianAverage(distribution, product.average, 3);

    eventBus.emit("product:rating_updated", {
      productId,
      pedidoId,
      userId,
      score,
      average: bayesian.bayesianAverage || bayesian.average,
      totalRatings: bayesian.totalVotes,
    });

    log.info("Product rated successfully:", { productId, userId, score });
    return { success: true, rating, summary: { ...bayesian, distribution } };
  }

  async getProductRatings(productId: string, page: number = 1, limit: number = 10) {
    log.debug("Fetching ratings for product:", { productId, page, limit });
    return this.productRatingRepository.findByProduct(productId, page, limit);
  }

  async getPendingRatings(userId: string) {
    log.debug("Fetching pending ratings for user:", { userId });
    return this.productRatingRepository.findPendingByUser(userId);
  }

  async getUserRating(userId: string, productId: string, pedidoId: string) {
    log.debug("Fetching user rating:", { userId, productId, pedidoId });
    return this.productRatingRepository.getUserRating(userId, productId, pedidoId);
  }

  async getProductRatingSummary(productId: string) {
    const distribution = await this.productRatingRepository.getDistribution(productId);
    const totalVotes = Object.values(distribution).reduce((s, v) => s + v, 0);
    const total = Object.entries(distribution).reduce((s, [score, count]) => s + Number(score) * count, 0);
    const average = totalVotes > 0 ? Number((total / totalVotes).toFixed(2)) : 0;

    return { average, count: totalVotes, total, distribution };
  }

  async getProductRatingDistribution(productId: string) {
    return this.productRatingRepository.getDistribution(productId);
  }
}
