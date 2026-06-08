"use server";

import prisma from "@/backend/db/prisma";
import { withStoreOwner } from "@/lib/auth-guards";
import { shippingService } from "./shipping.service";
import logger from "@/utils/logger";

const log = logger.child();

export async function getStoreShippingZonesAction(storeId: string) {
  return withStoreOwner(storeId, async () => {
    try {
      const zones = await prisma.storeShippingZone.findMany({
        where: { storeId },
        include: {
          tarifas: true
        }
      });

      const mappedZones = zones.map(z => ({
        id: z.id,
        storeId: z.storeId,
        name: z.nombreZona,
        ciudades: z.ciudades,
        isActive: z.isActive,
        rates: z.tarifas.map(r => ({
          id: r.id,
          zoneId: r.zoneId,
          name: r.tipo, // we didn't add a name field in DB! Let's adapt
          type: r.tipo,
          price: Number(r.precioBase),
          freeShippingThreshold: r.minimoEnvioGratis ? Number(r.minimoEnvioGratis) : undefined
        }))
      }));

      return { success: true, zones: mappedZones };
    } catch (error: any) {
      console.error("Error getStoreShippingZonesAction:", error);
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

      const zone = await prisma.storeShippingZone.create({
        data: {
          storeId,
          nombreZona: data.name,
          ciudades: data.ciudades
        }
      });

      return { success: true, zone: { id: zone.id, name: zone.nombreZona, ciudades: zone.ciudades } };
    } catch (error: any) {
      log.error("Error createStoreShippingZoneAction:", error);
      return { error: error.message || "Error al crear la zona de envío" };
    }
  });
}



export async function updateStoreShippingZoneAction(zoneId: string, data: { name: string; ciudades: string[] }) {
  try {
    const current = await prisma.storeShippingZone.findUnique({ where: { id: zoneId }, select: { storeId: true } });
    if (!current) {
      return { error: "Zona de envío no encontrada" };
    }

    const storeGuard = await withStoreOwner(current.storeId, async () => true as const);
    if (typeof storeGuard === "object" && "error" in storeGuard) {
      return storeGuard;
    }

    const duplicates = await shippingService.validateZoneCities(current.storeId, data.ciudades, zoneId);
    if (duplicates.length > 0) {
      return {
        error: `Las siguientes ciudades ya están asignadas a otra zona: ${duplicates.join(", ")}`,
        duplicates,
      };
    }

    const zone = await prisma.storeShippingZone.update({
      where: { id: zoneId },
      data: {
        nombreZona: data.name,
        ciudades: data.ciudades
      }
    });

    return { success: true, zone: { id: zone.id, name: zone.nombreZona, ciudades: zone.ciudades } };
  } catch (error: any) {
    log.error("Error updateStoreShippingZoneAction:", error);
    return { error: error.message || "Error al actualizar la zona de envío" };
  }
}



export async function deleteStoreShippingZoneAction(zoneId: string) {
  try {
    await prisma.storeShippingZone.delete({
      where: { id: zoneId }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleteStoreShippingZoneAction:", error);
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
    const rate = await prisma.storeShippingRate.create({
      data: {
        zoneId,
        tipo: data.type,
        precioBase: data.price,
        minimoEnvioGratis: data.freeShippingThreshold
      }
    });

    return { success: true, rate: { id: rate.id, type: rate.tipo, price: Number(rate.precioBase) } };
  } catch (error: any) {
    console.error("Error addShippingRateAction:", error);
    return { error: error.message || "Error al agregar la tarifa de envío" };
  }
}



export async function deleteShippingRateAction(rateId: string) {
  try {
    await prisma.storeShippingRate.delete({
      where: { id: rateId }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleteShippingRateAction:", error);
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


