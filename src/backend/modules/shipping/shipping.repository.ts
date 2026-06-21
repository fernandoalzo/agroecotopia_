import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/shipping/shipping.repository.ts");

export class ShippingRepository {
  /**
   * Obtiene todas las zonas de envío de una tienda con sus tarifas.
   */
  async findZonesByStore(storeId: string) {
    log.debug("[db] Obteniendo zonas de envío de la tienda:", { storeId });
    return prisma.storeShippingZone.findMany({
      where: { storeId },
      include: {
        tarifas: true,
      },
    });
  }

  /**
   * Obtiene las zonas de envío activas de una tienda con sus tarifas activas.
   */
  async findActiveZonesByStoreWithRates(storeId: string) {
    log.debug("[db] Obteniendo zonas activas con tarifas activas para tienda:", { storeId });
    return prisma.storeShippingZone.findMany({
      where: { storeId, isActive: true },
      include: { tarifas: { where: { isActive: true } } },
    });
  }

  /**
   * Obtiene todas las zonas de envío activas del sistema (para listado de ciudades).
   */
  async findAllActiveZones() {
    log.debug("[db] Obteniendo todas las zonas activas del sistema.");
    return prisma.storeShippingZone.findMany({
      where: { isActive: true },
      select: { nombreZona: true, ciudades: true },
      orderBy: { nombreZona: "asc" },
    });
  }

  /**
   * Obtiene las zonas de una tienda excluyendo una zona específica (para validación de ciudades duplicadas).
   */
  async findZonesByStoreExcluding(storeId: string, excludeZoneId?: string) {
    log.debug("[db] Obteniendo zonas para validación de ciudades:", { storeId, excludeZoneId });
    return prisma.storeShippingZone.findMany({
      where: {
        storeId,
        ...(excludeZoneId ? { id: { not: excludeZoneId } } : {}),
      },
      select: { ciudades: true, nombreZona: true },
    });
  }

  /**
   * Obtiene el storeId de una zona de envío por su ID.
   */
  async findZoneStoreId(zoneId: string): Promise<string | null> {
    log.debug("[db] Obteniendo storeId de zona:", { zoneId });
    const result = await prisma.storeShippingZone.findUnique({
      where: { id: zoneId },
      select: { storeId: true },
    });
    return result?.storeId ?? null;
  }

  /**
   * Crea una nueva zona de envío.
   */
  async createZone(storeId: string, data: { name: string; ciudades: string[] }) {
    log.info("[db] Creando zona de envío:", { storeId, name: data.name });
    return prisma.storeShippingZone.create({
      data: {
        storeId,
        nombreZona: data.name,
        ciudades: data.ciudades,
      },
    });
  }

  /**
   * Actualiza una zona de envío existente.
   */
  async updateZone(zoneId: string, data: { name: string; ciudades: string[] }) {
    log.info("[db] Actualizando zona de envío:", { zoneId });
    return prisma.storeShippingZone.update({
      where: { id: zoneId },
      data: {
        nombreZona: data.name,
        ciudades: data.ciudades,
      },
    });
  }

  /**
   * Elimina una zona de envío.
   */
  async deleteZone(zoneId: string) {
    log.info("[db] Eliminando zona de envío:", { zoneId });
    return prisma.storeShippingZone.delete({
      where: { id: zoneId },
    });
  }

  /**
   * Crea una nueva tarifa de envío.
   */
  async createRate(zoneId: string, data: {
    type: "TARIFA_FIJA" | "POR_PESO";
    price: number;
    freeShippingThreshold?: number;
  }) {
    log.info("[db] Creando tarifa de envío:", { zoneId, type: data.type });
    return prisma.storeShippingRate.create({
      data: {
        zoneId,
        tipo: data.type,
        precioBase: data.price,
        minimoEnvioGratis: data.freeShippingThreshold,
      },
    });
  }

  /**
   * Elimina una tarifa de envío.
   */
  async deleteRate(rateId: string) {
    log.info("[db] Eliminando tarifa de envío:", { rateId });
    return prisma.storeShippingRate.delete({
      where: { id: rateId },
    });
  }

  async findRateStoreId(rateId: string): Promise<string | null> {
    log.debug("[db] Obteniendo storeId de tarifa:", { rateId });
    const rate = await prisma.storeShippingRate.findUnique({
      where: { id: rateId },
      include: { zone: { select: { storeId: true } } },
    });
    return rate?.zone?.storeId ?? null;
  }

  /**
   * Obtiene un producto por su ID (para cálculo de peso en envío).
   */
  async findProductById(productId: string) {
    log.debug("[db] Obteniendo producto para cálculo de envío:", { productId });
    return prisma.product.findUnique({
      where: { id: productId },
    });
  }
}
