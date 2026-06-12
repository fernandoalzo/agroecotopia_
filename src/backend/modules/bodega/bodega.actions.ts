"use server";

import { withStoreOwner } from "@/lib/auth-guards";
import { bodegaService } from "./index";
import logger from "@/utils/logger";
import { revalidatePath } from "next/cache";

const log = logger.child("bodega.actions");

export async function getBodegasByCityAction(city: string) {
  try {
    const bodegas = await bodegaService.getBodegasByCity(city);
    return { success: true, bodegas };
  } catch (error: any) {
    log.error("Error getBodegasByCityAction:", error);
    return { error: error.message || "Error al obtener bodegas" };
  }
}

export async function getStoreBodegasAction(storeId: string) {
  return withStoreOwner(storeId, async () => {
    try {
      const bodegas = await bodegaService.getBodegasByStore(storeId);
      return { success: true, bodegas };
    } catch (error: any) {
      log.error("Error getStoreBodegasAction:", error);
      return { error: error.message || "Error al obtener bodegas" };
    }
  });
}

export async function createBodegaAction(storeId: string, data: {
  name: string;
  address: string;
  city: string;
  imagenUrl?: string;
}) {
  return withStoreOwner(storeId, async () => {
    try {
      const bodega = await bodegaService.createBodega({ storeId, ...data });
      revalidatePath("/mi-tienda");
      return { success: true, bodega };
    } catch (error: any) {
      log.error("Error createBodegaAction:", error);
      return { error: error.message || "Error al crear bodega" };
    }
  });
}

export async function updateBodegaAction(bodegaId: string, data: {
  name?: string;
  address?: string;
  city?: string;
  imagenUrl?: string;
  isActive?: boolean;
}) {
  try {
    const storeId = await bodegaService.getBodegaStoreId(bodegaId);
    if (!storeId) {
      return { error: "Bodega no encontrada" };
    }

    const storeGuard = await withStoreOwner(storeId, async () => true as const);
    if (typeof storeGuard === "object" && "error" in storeGuard) {
      return storeGuard;
    }

    const bodega = await bodegaService.updateBodega(bodegaId, data);
    revalidatePath("/mi-tienda");
    return { success: true, bodega };
  } catch (error: any) {
    log.error("Error updateBodegaAction:", error);
    return { error: error.message || "Error al actualizar bodega" };
  }
}

export async function deleteBodegaAction(bodegaId: string) {
  try {
    const storeId = await bodegaService.getBodegaStoreId(bodegaId);
    if (!storeId) {
      return { error: "Bodega no encontrada" };
    }

    const storeGuard = await withStoreOwner(storeId, async () => true as const);
    if (typeof storeGuard === "object" && "error" in storeGuard) {
      return storeGuard;
    }

    await bodegaService.deleteBodega(bodegaId);
    revalidatePath("/mi-tienda");
    return { success: true };
  } catch (error: any) {
    log.error("Error deleteBodegaAction:", error);
    return { error: error.message || "Error al eliminar bodega" };
  }
}
