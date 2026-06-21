import { StoreTaxRepository } from "./storeTax.repository";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/store/storeTax.service.ts");

export class StoreTaxService {
  constructor(private readonly storeTaxRepository: StoreTaxRepository) {}

  async createStoreTax(storeId: string, data: { name: string; percentage: number; isActive?: boolean }) {
    log.info("Creando impuesto para tienda", { storeId, ...data });
    const tax = await this.storeTaxRepository.createTax({
      name: data.name,
      percentage: data.percentage,
      isActive: data.isActive ?? true,
      storeId,
    });
    return { ...tax, percentage: Number(tax.percentage) };
  }

  async getTaxesByStoreId(storeId: string) {
    log.debug("Obteniendo impuestos para tienda", { storeId });
    const taxes = await this.storeTaxRepository.findByStoreId(storeId);
    return taxes.map(t => ({
      ...t,
      percentage: Number(t.percentage)
    }));
  }

  async updateStoreTax(id: string, storeId: string, data: { name?: string; percentage?: number; isActive?: boolean }) {
    log.info("Actualizando impuesto de tienda", { taxId: id, storeId });
    
    const tax = await this.storeTaxRepository.findById(id);
    if (!tax) throw new Error("Impuesto no encontrado");
    if (tax.storeId !== storeId) throw new Error("No tienes permiso para editar este impuesto");

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.percentage !== undefined) updateData.percentage = data.percentage;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await this.storeTaxRepository.updateTax(id, updateData);
    return { ...updated, percentage: Number(updated.percentage) };
  }

  async deleteStoreTax(id: string, storeId: string) {
    log.info("Eliminando impuesto de tienda", { taxId: id, storeId });
    
    const tax = await this.storeTaxRepository.findById(id);
    if (!tax) throw new Error("Impuesto no encontrado");
    if (tax.storeId !== storeId) throw new Error("No tienes permiso para eliminar este impuesto");

    await this.storeTaxRepository.deleteTax(id);
    return { success: true };
  }
}
