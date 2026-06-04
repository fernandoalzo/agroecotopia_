import prisma from "@/backend/db/prisma";
import type { Prisma } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/store/storeTax.repository.ts");

export class StoreTaxRepository {
  async createTax(data: Prisma.StoreTaxCreateInput) {
    log.info("Creando nuevo impuesto", { name: data.name, storeId: data.store.connect?.id });
    return await prisma.storeTax.create({
      data,
    });
  }

  async findById(id: string) {
    log.debug("Buscando impuesto por ID", { taxId: id });
    return await prisma.storeTax.findUnique({
      where: { id },
    });
  }

  async findByStoreId(storeId: string) {
    log.debug("Buscando impuestos por Store ID", { storeId });
    return await prisma.storeTax.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateTax(id: string, data: Prisma.StoreTaxUpdateInput) {
    log.info("Actualizando impuesto", { taxId: id });
    return await prisma.storeTax.update({
      where: { id },
      data,
    });
  }

  async deleteTax(id: string) {
    log.info("Eliminando impuesto", { taxId: id });
    return await prisma.storeTax.delete({
      where: { id },
    });
  }
}
