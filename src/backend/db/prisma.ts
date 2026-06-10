import { PrismaClient } from "@prisma/client";
import logger from "@/utils/logger";
import { ensureDefaultAdminStore } from "./init";

const log = logger.child("src/backend/db/prisma.ts");

const PRISMA_GLOBAL_KEY = "__prismaClient";

// Usamos process como respaldo + globalThis porque Turbopack evalúa los módulos
// del servidor en chunks separados con su propio alcance de módulo, pero process
// es siempre el mismo singleton de Node.js en todos los contextos.
const getGlobalStorage = () => {
  if (typeof process !== "undefined" && (process as any)[PRISMA_GLOBAL_KEY]) {
    return process as any;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any)[PRISMA_GLOBAL_KEY]) {
    return globalThis as any;
  }
  return null;
};

let prisma: PrismaClient;

const existing = getGlobalStorage();
if (existing) {
  prisma = existing[PRISMA_GLOBAL_KEY];
  log.debug("Reutilizando instancia existente de PrismaClient.");
} else {
  log.info("Creando nueva instancia de PrismaClient...");
  prisma = new PrismaClient();

  // Almacenar en ambos para cubrir cualquier contexto de evaluación
  if (typeof process !== "undefined") (process as any)[PRISMA_GLOBAL_KEY] = prisma;
  (globalThis as any)[PRISMA_GLOBAL_KEY] = prisma;

  if (typeof window === "undefined") {
    prisma.$connect().then(() => {
      ensureDefaultAdminStore(prisma).catch(err => log.error("Error en init db:", err));
    });
  }
}

export default prisma;
