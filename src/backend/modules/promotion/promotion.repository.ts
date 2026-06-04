import prisma from "@/backend/db/prisma";
import { Prisma } from "@prisma/client";

export type CreatePromotionInput = {
  storeId: string;
  name: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  expiresAt: Date;
  scope: "ENTIRE_STORE" | "SPECIFIC_PRODUCTS" | "SINGLE_PRODUCT";
  productIds?: string[]; // Para cuando es SPECIFIC_PRODUCTS o SINGLE_PRODUCT
};

export type UpdatePromotionInput = Partial<Omit<CreatePromotionInput, "storeId">>;

export class PromotionRepository {
  async createPromotion(data: CreatePromotionInput) {
    return await prisma.promotion.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        expiresAt: data.expiresAt,
        scope: data.scope,
        products: data.productIds?.length
          ? { connect: data.productIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        products: true,
      },
    });
  }

  async getPromotionsByStoreId(storeId: string) {
    return await prisma.promotion.findMany({
      where: { storeId },
      include: {
        products: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPromotionById(id: string) {
    return await prisma.promotion.findUnique({
      where: { id },
      include: { products: true },
    });
  }

  async updatePromotion(id: string, data: UpdatePromotionInput) {
    return await prisma.promotion.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        expiresAt: data.expiresAt,
        scope: data.scope,
        products: data.productIds
          ? { set: data.productIds.map((pid) => ({ id: pid })) }
          : undefined,
      },
      include: { products: true },
    });
  }

  async togglePromotionStatus(id: string, isActive: boolean) {
    return await prisma.promotion.update({
      where: { id },
      data: { isActive },
    });
  }

  async deletePromotion(id: string) {
    return await prisma.promotion.delete({
      where: { id },
    });
  }
}
