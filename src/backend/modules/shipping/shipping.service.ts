import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";
import { TipoTarifaEnvio } from "@prisma/client";

const log = logger.child("shipping.service");

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

export interface CartItemForShipping {
  productId: string;
  storeId: string;
  quantity: number;
  subtotal: number;
}

export const shippingService = {
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

    const existingZones = await prisma.storeShippingZone.findMany({
      where: {
        storeId,
        ...(excludeZoneId ? { id: { not: excludeZoneId } } : {}),
      },
      select: { ciudades: true, nombreZona: true },
    });

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
  },

  /**
   * Retorna las zonas de envío con sus ciudades agrupadas,
   * asegurando que cada ciudad aparezca solo una vez (en la primera zona que la contiene).
   */
  async getAllCities(): Promise<{ name: string; cities: string[] }[]> {
    const zones = await prisma.storeShippingZone.findMany({
      where: { isActive: true },
      select: { nombreZona: true, ciudades: true },
      orderBy: { nombreZona: "asc" },
    });

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
  },

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
      const zones = await prisma.storeShippingZone.findMany({
        where: { storeId, isActive: true },
        include: { tarifas: { where: { isActive: true } } },
      });

      // Lógica de validación (por simplificación, usamos la primera zona que coincida)
      // Si no hay ciudad de destino, pero hay tarifas, cobramos la tarifa por defecto si existe.
      let applicableZone = null;

      if (destCity) {
        // Buscar zona que incluya la ciudad
        applicableZone = zones.find((z) =>
          z.ciudades.some((c) => c.toLowerCase() === destCity.toLowerCase())
        );
      }

      // Fallback a una zona "Nacional" o genérica si no hay match
      if (!applicableZone && zones.length > 0) {
        // Podríamos definir que si `ciudades` incluye "*", es nacional.
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
              const product = await prisma.product.findUnique({ where: { id: item.productId } });
              if (product && product.peso && !product.envioGratis) {
                totalWeight += Number(product.peso) * item.quantity;
              }
            }
            
            storeShippingCost = Number(rate.precioBase);
            if (totalWeight > 1 && rate.precioPorKgExtra) {
              // Ejemplo simple: 1kg cubierto por precioBase, resto por kg extra
              storeShippingCost += (totalWeight - 1) * Number(rate.precioPorKgExtra);
            }
          }
        }
      } else {
        // Si no hay reglas, podemos decidir si es 0, o marcar como no envíable.
        // Asumimos 0 si el vendedor no configuró nada por ahora.
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
};
