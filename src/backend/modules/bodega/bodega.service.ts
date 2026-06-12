import { BodegaRepository } from "./bodega.repository";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/bodega/bodega.service.ts");

export class BodegaService {
  constructor(private bodegaRepository: BodegaRepository) {}

  async getBodegasByStore(storeId: string) {
    log.debug("Obteniendo bodegas de la tienda:", { storeId });
    return this.bodegaRepository.findByStore(storeId);
  }

  async getBodegasByCity(city: string) {
    log.debug("Obteniendo bodegas por ciudad:", { city });
    return this.bodegaRepository.findByCity(city);
  }

  async getAllBodegas() {
    log.debug("Obteniendo todas las bodegas activas.");
    return this.bodegaRepository.findAllActive();
  }

  async getBodegaById(id: string) {
    log.debug("Obteniendo bodega por ID:", { id });
    return this.bodegaRepository.findById(id);
  }

  async getBodegaStoreId(id: string): Promise<string | null> {
    return this.bodegaRepository.findStoreIdByBodegaId(id);
  }

  async createBodega(data: {
    storeId: string;
    name: string;
    address: string;
    city: string;
    imagenUrl?: string;
  }) {
    log.info("Creando bodega:", { name: data.name, storeId: data.storeId });
    return this.bodegaRepository.create(data);
  }

  async updateBodega(id: string, data: {
    name?: string;
    address?: string;
    city?: string;
    imagenUrl?: string;
    isActive?: boolean;
  }) {
    log.info("Actualizando bodega:", { id });
    return this.bodegaRepository.update(id, data);
  }

  async deleteBodega(id: string) {
    log.info("Eliminando bodega:", { id });
    return this.bodegaRepository.delete(id);
  }
}
