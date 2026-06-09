import { PrismaClient } from "@prisma/client";
import logger from "@/utils/logger";
import { ensureDefaultAdminStore } from "./init";
import { config } from "@/config/config";

const log = logger.child("src/backend/db/prisma.ts");

const prismaClientSingleton = () => {
  log.info("Creando nueva instancia de PrismaClient (Singleton)...");
  const client = new PrismaClient();
  
  // Connect PrismaClient lazily on the server side only.
  if (typeof window === "undefined") {
    client.$connect().then(() => {
      ensureDefaultAdminStore(client).catch(err => log.error("Error en init db:", err));
    });
  }


  return client;
};

declare global {
   
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const isReused = !!globalThis.prismaGlobal;
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

globalThis.prismaGlobal = prisma;

if (isReused) {
  log.debug("Reutilizando instancia existente de PrismaClient desde globalThis.");
} else if (config.isDevelopment) {
  log.debug("Instancia de PrismaClient almacenada en globalThis (modo desarrollo).");
}

export default prisma;
