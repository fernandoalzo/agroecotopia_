import { BodegaRepository } from "./bodega.repository";
import { BodegaService } from "./bodega.service";

export const bodegaRepository = new BodegaRepository();
export const bodegaService = new BodegaService(bodegaRepository);
