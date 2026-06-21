"use server";

import { withStoreOwner } from "@/lib/auth-guards";
import { shippingService } from "./index";
import logger from "@/utils/logger";

const log = logger.child("shipping.actions");

export async function getStoreShippingZonesAction(storeId: string) {
  return withStoreOwner(storeId, async () => {
    try {
      const mappedZones = await shippingService.getStoreShippingZones(storeId);
      return { success: true, zones: mappedZones };
    } catch (error: any) {
      log.error("Error getStoreShippingZonesAction:", error);
      return { error: error.message || "Error al obtener las zonas de envío" };
    }
  });
}

export async function createStoreShippingZoneAction(storeId: string, data: { name: string; ciudades: string[] }) {
  return withStoreOwner(storeId, async () => {
    try {
      const duplicates = await shippingService.validateZoneCities(storeId, data.ciudades);
      if (duplicates.length > 0) {
        return {
          error: `Las siguientes ciudades ya están asignadas a otra zona: ${duplicates.join(", ")}`,
          duplicates,
        };
      }

      const zone = await shippingService.createShippingZone(storeId, data);
      return { success: true, zone };
    } catch (error: any) {
      log.error("Error createStoreShippingZoneAction:", error);
      return { error: error.message || "Error al crear la zona de envío" };
    }
  });
}

export async function updateStoreShippingZoneAction(zoneId: string, data: { name: string; ciudades: string[] }) {
  try {
    const storeId = await shippingService.getZoneStoreId(zoneId);
    if (!storeId) {
      return { error: "Zona de envío no encontrada" };
    }

    const storeGuard = await withStoreOwner(storeId, async () => true as const);
    if (typeof storeGuard === "object" && "error" in storeGuard) {
      return storeGuard;
    }

    const duplicates = await shippingService.validateZoneCities(storeId, data.ciudades, zoneId);
    if (duplicates.length > 0) {
      return {
        error: `Las siguientes ciudades ya están asignadas a otra zona: ${duplicates.join(", ")}`,
        duplicates,
        };
    }

    const zone = await shippingService.updateShippingZone(zoneId, data);
    return { success: true, zone };
  } catch (error: any) {
    log.error("Error updateStoreShippingZoneAction:", error);
    return { error: error.message || "Error al actualizar la zona de envío" };
  }
}

export async function deleteStoreShippingZoneAction(zoneId: string) {
  try {
    const storeId = await shippingService.getZoneStoreId(zoneId);
    if (!storeId) {
      return { error: "Zona de envío no encontrada" };
    }

    const storeGuard = await withStoreOwner(storeId, async () => true as const);
    if (typeof storeGuard === "object" && "error" in storeGuard) {
      return storeGuard;
    }

    await shippingService.deleteShippingZone(zoneId);
    return { success: true };
  } catch (error: any) {
    log.error("Error deleteStoreShippingZoneAction:", error);
    return { error: error.message || "Error al eliminar la zona de envío" };
  }
}

export async function addShippingRateAction(zoneId: string, data: {
  name: string;
  type: "TARIFA_FIJA" | "POR_PESO";
  price: number;
  minOrderValue?: number;
  freeShippingThreshold?: number;
}) {
  try {
    const storeId = await shippingService.getZoneStoreId(zoneId);
    if (!storeId) {
      return { error: "Zona de envío no encontrada" };
    }

    const storeGuard = await withStoreOwner(storeId, async () => true as const);
    if (typeof storeGuard === "object" && "error" in storeGuard) {
      return storeGuard;
    }

    const rate = await shippingService.addShippingRate(zoneId, data);
    return { success: true, rate };
  } catch (error: any) {
    log.error("Error addShippingRateAction:", error);
    return { error: error.message || "Error al agregar la tarifa de envío" };
  }
}

export async function deleteShippingRateAction(rateId: string) {
  try {
    const storeId = await shippingService.getRateStoreId(rateId);
    if (!storeId) {
      return { error: "Tarifa de envío no encontrada" };
    }

    const storeGuard = await withStoreOwner(storeId, async () => true as const);
    if (typeof storeGuard === "object" && "error" in storeGuard) {
      return storeGuard;
    }

    await shippingService.deleteShippingRate(rateId);
    return { success: true };
  } catch (error: any) {
    log.error("Error deleteShippingRateAction:", error);
    return { error: error.message || "Error al eliminar la tarifa de envío" };
  }
}

export async function getAllCitiesAction() {
  try {
    const cities = await shippingService.getAllCities();
    return { success: true, cities };
  } catch (error: any) {
    log.error("Error getAllCitiesAction:", error);
    return { error: error.message || "Error al obtener ciudades" };
  }
}
