import { EnvioRepository } from "./envio.repository";
import { EnvioService } from "./envio.service";

export const envioRepository = new EnvioRepository();
export const envioService = new EnvioService(envioRepository);

export * from "./envio.service";
export * from "./envio.repository";
export * from "./envio.actions";
