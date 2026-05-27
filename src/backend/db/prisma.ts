import { PrismaClient } from "@prisma/client";
import logger from "@/utils/logger";
import { ensureDefaultAdminStore } from "./init";

const log = logger.child("src/backend/db/prisma.ts");

const prismaClientSingleton = () => {
  log.info("Creando nueva instancia de PrismaClient (Singleton)...");
  const client = new PrismaClient();
  
  // Ejecutar inicializaciones asíncronas sin bloquear (Fire and forget)
  client.$connect().then(() => {
    ensureDefaultAdminStore(client).catch(err => log.error("Error en init db:", err));
  });

  return client;
};

declare global {
   
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const isReused = !!globalThis.prismaGlobal;
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (isReused) {
  log.debug("Reutilizando instancia existente de PrismaClient desde globalThis.");
}

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
  log.debug("Instancia de PrismaClient almacenada en globalThis (modo desarrollo).");
}
