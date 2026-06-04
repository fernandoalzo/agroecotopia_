"use server";

import { withStoreOwner } from "@/lib/auth-guards";
import { promotionService } from "./index";
import { CreatePromotionInput, UpdatePromotionInput } from "./promotion.repository";
import logger from "@/utils/logger";
import { revalidatePath } from "next/cache";

const log = logger.child();

export const createPromotionAction = async (storeId: string, data: CreatePromotionInput) => 
  withStoreOwner(storeId, async () => {
    try {
      const result = await promotionService.createPromotion(data);
      revalidatePath("/mi-tienda");
      return { success: true, promotion: result };
    } catch (error: any) {
      log.error("Error en createPromotionAction:", error);
      return { error: error.message || "Error al crear la promoción" };
    }
});

export const getPromotionsByStoreAction = async (storeId: string) => 
  withStoreOwner(storeId, async () => {
    try {
      const result = await promotionService.getPromotionsByStore(storeId);
      return { success: true, promotions: result };
    } catch (error: any) {
      log.error("Error en getPromotionsByStoreAction:", error);
      return { error: error.message || "Error al obtener las promociones" };
    }
});

export const updatePromotionAction = async (storeId: string, id: string, data: UpdatePromotionInput) => 
  withStoreOwner(storeId, async () => {
    try {
      const result = await promotionService.updatePromotion(id, data);
      revalidatePath("/mi-tienda");
      return { success: true, promotion: result };
    } catch (error: any) {
      log.error("Error en updatePromotionAction:", error);
      return { error: error.message || "Error al actualizar la promoción" };
    }
});

export const togglePromotionAction = async (storeId: string, id: string, isActive: boolean) => 
  withStoreOwner(storeId, async () => {
    try {
      const result = await promotionService.togglePromotion(id, isActive);
      revalidatePath("/mi-tienda");
      return { success: true, promotion: result };
    } catch (error: any) {
      log.error("Error en togglePromotionAction:", error);
      return { error: error.message || "Error al cambiar el estado de la promoción" };
    }
});

export const deletePromotionAction = async (storeId: string, id: string) => 
  withStoreOwner(storeId, async () => {
    try {
      await promotionService.deletePromotion(id);
      revalidatePath("/mi-tienda");
      return { success: true };
    } catch (error: any) {
      log.error("Error en deletePromotionAction:", error);
      return { error: error.message || "Error al eliminar la promoción" };
    }
});
