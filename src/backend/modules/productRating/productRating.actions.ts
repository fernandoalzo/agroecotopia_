"use server";

import { productRatingService } from "./index";
import { withAuth } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import logger from "@/utils/logger";
import { deepSerialize } from "@/lib/serialize";

const log = logger.child("src/backend/modules/productRating/productRating.actions.ts");

export async function rateProductAction(
  productId: string,
  pedidoId: string,
  score: number,
  comment?: string,
) {
  return await withAuth(async (session) => {
    try {
      log.info("Action: rateProductAction", { productId, pedidoId, score });
      const result = await productRatingService.rateProduct(
        session.user.id,
        productId,
        pedidoId,
        score,
        comment,
      );
      revalidatePath(`/products/${productId}`);
      revalidatePath(`/pedidos/${pedidoId}`);
      return deepSerialize(result);
    } catch (error: any) {
      log.error("Error rating product:", error);
      return { error: error?.message || "Error al calificar el producto" };
    }
  });
}

export async function getProductRatingsAction(
  productId: string,
  page: number = 1,
  limit: number = 10,
) {
  try {
    log.debug("Action: getProductRatingsAction", { productId, page, limit });
    return deepSerialize(await productRatingService.getProductRatings(productId, page, limit));
  } catch (error: any) {
    log.error("Error getting product ratings:", error);
    return { error: "Error al obtener las calificaciones" };
  }
}

export async function getPendingRatingsAction() {
  return await withAuth(async (session) => {
    try {
      log.debug("Action: getPendingRatingsAction", { userId: session.user.id });
      return deepSerialize(await productRatingService.getPendingRatings(session.user.id));
    } catch (error: any) {
      log.error("Error getting pending ratings:", error);
      return { error: "Error al obtener calificaciones pendientes" };
    }
  });
}

export async function getUserProductRatingAction(productId: string, pedidoId: string) {
  return await withAuth(async (session) => {
    try {
      log.debug("Action: getUserProductRatingAction", { userId: session.user.id, productId, pedidoId });
      return deepSerialize(
        await productRatingService.getUserRating(session.user.id, productId, pedidoId),
      );
    } catch (error: any) {
      log.error("Error getting user product rating:", error);
      return { error: "Error al obtener la calificación" };
    }
  });
}

export async function getProductRatingSummaryAction(productId: string) {
  try {
    log.debug("Action: getProductRatingSummaryAction", { productId });
    return deepSerialize(await productRatingService.getProductRatingSummary(productId));
  } catch (error: any) {
    log.error("Error getting product rating summary:", error);
    return { error: "Error al obtener el resumen de calificaciones" };
  }
}
