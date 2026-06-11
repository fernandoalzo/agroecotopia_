import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";

const log = logger.child("bodega.service");

export const bodegaService = {
  async getBodegasByStore(storeId: string) {
    log.debug("Obteniendo bodegas de la tienda:", { storeId });
    return await prisma.bodega.findMany({
      where: { storeId, isActive: true },
      orderBy: { name: "asc" },
    });
  },

  async getBodegasByCity(city: string) {
    log.debug("Obteniendo bodegas por ciudad:", { city });
    return await prisma.bodega.findMany({
      where: { city: { equals: city, mode: "insensitive" }, isActive: true },
      include: {
        store: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  async getAllBodegas() {
    log.debug("Obteniendo todas las bodegas activas.");
    return await prisma.bodega.findMany({
      where: { isActive: true },
      include: {
        store: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  async getBodegaById(id: string) {
    log.debug("Obteniendo bodega por ID:", { id });
    return await prisma.bodega.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true } },
      },
    });
  },

  async createBodega(data: {
    storeId: string;
    name: string;
    address: string;
    city: string;
    imagenUrl?: string;
  }) {
    log.debug("Creando bodega:", { name: data.name, storeId: data.storeId });
    return await prisma.bodega.create({ data });
  },

  async updateBodega(id: string, data: {
    name?: string;
    address?: string;
    city?: string;
    imagenUrl?: string;
    isActive?: boolean;
  }) {
    log.debug("Actualizando bodega:", { id });
    return await prisma.bodega.update({ where: { id }, data });
  },

  async deleteBodega(id: string) {
    log.debug("Eliminando bodega:", { id });
    return await prisma.bodega.delete({ where: { id } });
  },
};
