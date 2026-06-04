import { PromotionRepository, CreatePromotionInput, UpdatePromotionInput } from "./promotion.repository";
import logger from "@/utils/logger";

const log = logger.child();

/**
 * Converts Prisma Decimal fields to plain numbers so objects
 * can safely cross the Server → Client Component boundary.
 */
function serializePromotion(promo: any) {
  if (!promo) return promo;
  return {
    ...promo,
    discountValue: promo.discountValue ? Number(promo.discountValue) : promo.discountValue,
    products: promo.products?.map((p: any) => ({
      ...p,
      price: p.price ? Number(p.price) : p.price,
      stock: p.stock ? Number(p.stock) : p.stock,
    })),
  };
}

export class PromotionService {
  constructor(private readonly promotionRepository: PromotionRepository) {}

  async createPromotion(data: CreatePromotionInput) {
    log.info("Creando promoción", { storeId: data.storeId, name: data.name });
    
    // Business rule validation
    if (data.discountType === "PERCENTAGE" && (data.discountValue <= 0 || data.discountValue > 100)) {
      throw new Error("El porcentaje de descuento debe estar entre 1 y 100.");
    }
    if (new Date(data.expiresAt) <= new Date()) {
      throw new Error("La fecha de caducidad debe ser en el futuro.");
    }
    if (data.scope !== "ENTIRE_STORE" && (!data.productIds || data.productIds.length === 0)) {
      throw new Error("Debes seleccionar al menos un producto para este tipo de promoción.");
    }

    const result = await this.promotionRepository.createPromotion(data);
    return serializePromotion(result);
  }

  async getPromotionsByStore(storeId: string) {
    const results = await this.promotionRepository.getPromotionsByStoreId(storeId);
    return results.map(serializePromotion);
  }

  async updatePromotion(id: string, data: UpdatePromotionInput) {
    log.info("Actualizando promoción", { id });
    
    if (data.discountType === "PERCENTAGE" && data.discountValue !== undefined && (data.discountValue <= 0 || data.discountValue > 100)) {
      throw new Error("El porcentaje de descuento debe estar entre 1 y 100.");
    }
    if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
      throw new Error("La fecha de caducidad debe ser en el futuro.");
    }
    
    const result = await this.promotionRepository.updatePromotion(id, data);
    return serializePromotion(result);
  }

  async togglePromotion(id: string, isActive: boolean) {
    const result = await this.promotionRepository.togglePromotionStatus(id, isActive);
    return serializePromotion(result);
  }

  async deletePromotion(id: string) {
    log.info("Eliminando promoción", { id });
    return await this.promotionRepository.deletePromotion(id);
  }
}
