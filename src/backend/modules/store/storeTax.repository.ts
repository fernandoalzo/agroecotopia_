import prisma from "@/backend/db/prisma";
import { Prisma } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/store/storeTax.repository.ts");

export class StoreTaxRepository {
  async createTax(data: { name: string; percentage: number; isActive: boolean; storeId: string }) {
    log.info("Creando nuevo impuesto", { name: data.name, storeId: data.storeId });
    return await prisma.storeTax.create({
      data: {
        name: data.name,
        percentage: new Prisma.Decimal(data.percentage),
        isActive: data.isActive,
        store: { connect: { id: data.storeId } },
      },
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

  async updateTax(id: string, data: Record<string, unknown>) {
    log.info("Actualizando impuesto", { taxId: id });
    const prismaData: Record<string, unknown> = { ...data };
    if (typeof prismaData.percentage === "number") {
      prismaData.percentage = new Prisma.Decimal(prismaData.percentage as number);
    }
    return await prisma.storeTax.update({
      where: { id },
      data: prismaData,
    });
  }

  async deleteTax(id: string) {
    log.info("Eliminando impuesto", { taxId: id });
    return await prisma.storeTax.delete({
      where: { id },
    });
  }
}
