import { PromotionRepository } from "./promotion.repository";
import { PromotionService } from "./promotion.service";

export const promotionRepository = new PromotionRepository();
export const promotionService = new PromotionService(promotionRepository);
