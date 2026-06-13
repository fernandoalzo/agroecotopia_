import { EnvioRepository } from "./envio.repository";
import { EnvioService } from "./envio.service";
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();

export const envioRepository = new EnvioRepository(cacheService);
export const envioService = new EnvioService(envioRepository);

export * from "./envio.service";
export * from "./envio.repository";
export * from "./envio.actions";
