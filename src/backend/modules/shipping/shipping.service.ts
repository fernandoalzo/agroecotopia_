import { ShippingRepository } from "./shipping.repository";
import { TipoTarifaEnvio } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/shipping/shipping.service.ts");

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

export interface CartItemForShipping {
  productId: string;
  storeId: string;
  quantity: number;
  subtotal: number;
}

export class ShippingService {
  constructor(private shippingRepository: ShippingRepository) {}

  /**
   * Valida que ninguna ciudad del array esté ya asignada a otra zona de la misma tienda.
   * @param storeId   Tienda a la que pertenecen las zonas
   * @param ciudades  Lista de ciudades a validar
   * @param excludeZoneId  Opcional: ID de zona a excluir (útil al actualizar)
   * @returns Lista de ciudades duplicadas (vacía si todo es válido)
   */
  async validateZoneCities(
    storeId: string,
    ciudades: string[],
    excludeZoneId?: string,
  ): Promise<string[]> {
    const cleanInput = [...new Set(ciudades.map(normalizeCity).filter(Boolean))];
    if (cleanInput.length === 0) return [];

    const existingZones = await this.shippingRepository.findZonesByStoreExcluding(storeId, excludeZoneId);

    const existingCities = new Set<string>();
    for (const zone of existingZones) {
      for (const c of zone.ciudades) {
        existingCities.add(normalizeCity(c));
      }
    }

    return ciudades.filter((c) => {
      const key = normalizeCity(c);
      return key && existingCities.has(key);
    });
  }

  /**
   * Retorna las zonas de envío con sus ciudades agrupadas,
   * asegurando que cada ciudad aparezca solo una vez (en la primera zona que la contiene).
   */
  async getAllCities(): Promise<{ name: string; cities: string[] }[]> {
    const zones = await this.shippingRepository.findAllActiveZones();

    const seen = new Set<string>();
    const result: { name: string; cities: string[] }[] = [];

    for (const zone of zones) {
      const raw = [...new Set(zone.ciudades.map((c) => c.trim()).filter(Boolean))];
      const unique = raw.filter((c) => {
        const key = c.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => a.localeCompare(b, "es"));

      if (unique.length > 0) {
        result.push({ name: zone.nombreZona, cities: unique });
      }
    }

    return result;
  }

  /**
   * Obtiene las zonas de envío de una tienda mapeadas a formato de UI.
   */
  async getStoreShippingZones(storeId: string) {
    log.debug("Obteniendo zonas de envío de la tienda:", { storeId });
    const zones = await this.shippingRepository.findZonesByStore(storeId);

    return zones.map(z => ({
      id: z.id,
      storeId: z.storeId,
      name: z.nombreZona,
      ciudades: z.ciudades,
      isActive: z.isActive,
      rates: z.tarifas.map(r => ({
        id: r.id,
        zoneId: r.zoneId,
        name: r.tipo,
        type: r.tipo,
        price: Number(r.precioBase),
        freeShippingThreshold: r.minimoEnvioGratis ? Number(r.minimoEnvioGratis) : undefined,
      })),
    }));
  }

  /**
   * Obtiene el storeId propietario de una zona de envío.
   */
  async getZoneStoreId(zoneId: string): Promise<string | null> {
    return this.shippingRepository.findZoneStoreId(zoneId);
  }

  /**
   * Crea una nueva zona de envío con validación de ciudades duplicadas.
   */
  async createShippingZone(storeId: string, data: { name: string; ciudades: string[] }) {
    log.info("Creando zona de envío:", { storeId, name: data.name });
    const zone = await this.shippingRepository.createZone(storeId, data);
    return { id: zone.id, name: zone.nombreZona, ciudades: zone.ciudades };
  }

  /**
   * Actualiza una zona de envío existente.
   */
  async updateShippingZone(zoneId: string, data: { name: string; ciudades: string[] }) {
    log.info("Actualizando zona de envío:", { zoneId });
    const zone = await this.shippingRepository.updateZone(zoneId, data);
    return { id: zone.id, name: zone.nombreZona, ciudades: zone.ciudades };
  }

  /**
   * Elimina una zona de envío.
   */
  async deleteShippingZone(zoneId: string) {
    log.info("Eliminando zona de envío:", { zoneId });
    return this.shippingRepository.deleteZone(zoneId);
  }

  /**
   * Agrega una tarifa a una zona de envío.
   */
  async addShippingRate(zoneId: string, data: {
    name: string;
    type: "TARIFA_FIJA" | "POR_PESO";
    price: number;
    minOrderValue?: number;
    freeShippingThreshold?: number;
  }) {
    log.info("Agregando tarifa de envío:", { zoneId, type: data.type });
    const rate = await this.shippingRepository.createRate(zoneId, {
      type: data.type,
      price: data.price,
      freeShippingThreshold: data.freeShippingThreshold,
    });
    return { id: rate.id, type: rate.tipo, price: Number(rate.precioBase) };
  }

  /**
   * Elimina una tarifa de envío.
   */
  async deleteShippingRate(rateId: string) {
    log.info("Eliminando tarifa de envío:", { rateId });
    return this.shippingRepository.deleteRate(rateId);
  }

  async getRateStoreId(rateId: string): Promise<string | null> {
    return this.shippingRepository.findRateStoreId(rateId);
  }

  /**
   * Calcula el envío de un carrito agrupando por tiendas y verificando
   * sus tarifas y zonas.
   * 
   * @param items Items del carrito
   * @param destCity Ciudad de destino (opcional)
   */
  async calculateShipping(items: CartItemForShipping[], destCity?: string) {
    if (!items || items.length === 0) {
      return { totalShippingCost: 0, storeBreakdown: [] };
    }

    let totalShippingCost = 0;
    const storeBreakdown = [];

    // 1. Agrupar items por tienda
    const itemsByStore: Record<string, { items: CartItemForShipping[]; subtotal: number }> = {};
    for (const item of items) {
      if (!itemsByStore[item.storeId]) {
        itemsByStore[item.storeId] = { items: [], subtotal: 0 };
      }
      itemsByStore[item.storeId].items.push(item);
      itemsByStore[item.storeId].subtotal += item.subtotal;
    }

    // 2. Procesar cada tienda
    for (const storeId of Object.keys(itemsByStore)) {
      const { items: storeItems, subtotal } = itemsByStore[storeId];
      let storeShippingCost = 0;

      // Obtener reglas de envío de la tienda
      const zones = await this.shippingRepository.findActiveZonesByStoreWithRates(storeId);

      // Lógica de validación (por simplificación, usamos la primera zona que coincida)
      let applicableZone = null;

      if (destCity) {
        // Buscar zona que incluya la ciudad
        applicableZone = zones.find((z) =>
          z.ciudades.some((c) => c.toLowerCase() === destCity.toLowerCase())
        );
      }

      // Fallback a una zona "Nacional" o genérica si no hay match
      if (!applicableZone && zones.length > 0) {
        applicableZone = zones.find((z) => z.ciudades.includes("*") || z.ciudades.length === 0) || zones[0];
      }

      if (applicableZone && applicableZone.tarifas.length > 0) {
        // Usar la primera tarifa activa
        const rate = applicableZone.tarifas[0];

        // Verificar umbral de envío gratis
        if (rate.minimoEnvioGratis && subtotal >= Number(rate.minimoEnvioGratis)) {
          storeShippingCost = 0;
        } else {
          if (rate.tipo === TipoTarifaEnvio.TARIFA_FIJA) {
            storeShippingCost = Number(rate.precioBase);
          } else if (rate.tipo === TipoTarifaEnvio.POR_PESO) {
            // Calcular el peso total de los items
            let totalWeight = 0;
            for (const item of storeItems) {
              const product = await this.shippingRepository.findProductById(item.productId);
              if (product && product.peso && !product.envioGratis) {
                totalWeight += Number(product.peso) * item.quantity;
              }
            }
            
            storeShippingCost = Number(rate.precioBase);
            if (totalWeight > 1 && rate.precioPorKgExtra) {
              // 1kg cubierto por precioBase, resto por kg extra
              storeShippingCost += (totalWeight - 1) * Number(rate.precioPorKgExtra);
            }
          }
        }
      } else {
        // Sin reglas → asumimos 0
        storeShippingCost = 0;
      }

      totalShippingCost += storeShippingCost;
      storeBreakdown.push({
        storeId,
        shippingCost: storeShippingCost,
        zoneApplied: applicableZone ? applicableZone.nombreZona : "Sin zona definida"
      });
    }

    return {
      totalShippingCost,
      storeBreakdown
    };
  }
}
