import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/bodega/bodega.repository.ts");

export class BodegaRepository {
  async findByStore(storeId: string) {
    log.debug("[db] Obteniendo bodegas de la tienda:", { storeId });
    return prisma.bodega.findMany({
      where: { storeId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async findByCity(city: string) {
    log.debug("[db] Obteniendo bodegas por ciudad:", { city });
    return prisma.bodega.findMany({
      where: { city: { equals: city, mode: "insensitive" }, isActive: true },
      include: {
        store: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async findAllActive() {
    log.debug("[db] Obteniendo todas las bodegas activas.");
    return prisma.bodega.findMany({
      where: { isActive: true },
      include: {
        store: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    log.debug("[db] Obteniendo bodega por ID:", { id });
    return prisma.bodega.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true } },
      },
    });
  }

  async findStoreIdByBodegaId(id: string): Promise<string | null> {
    log.debug("[db] Obteniendo storeId de bodega:", { id });
    const result = await prisma.bodega.findUnique({
      where: { id },
      select: { storeId: true },
    });
    return result?.storeId ?? null;
  }

  async create(data: {
    storeId: string;
    name: string;
    address: string;
    city: string;
    imagenUrl?: string;
  }) {
    log.info("[db] Creando bodega:", { name: data.name, storeId: data.storeId });
    return prisma.bodega.create({ data });
  }

  async update(id: string, data: {
    name?: string;
    address?: string;
    city?: string;
    imagenUrl?: string;
    isActive?: boolean;
  }) {
    log.info("[db] Actualizando bodega:", { id });
    return prisma.bodega.update({ where: { id }, data });
  }

  async delete(id: string) {
    log.info("[db] Eliminando bodega:", { id });
    return prisma.bodega.delete({ where: { id } });
  }
}
