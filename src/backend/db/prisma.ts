import { PrismaClient } from "@prisma/client";
import logger from "@/utils/logger";
import { config, getRequiredConfig } from "@/config/config";

const log = logger.child("src/backend/db/prisma.ts");

const PRISMA_GLOBAL_KEY = "__prismaClient";

const existingClient: PrismaClient | undefined =
  (typeof process !== "undefined" && (process as any)[PRISMA_GLOBAL_KEY]) ||
  (typeof globalThis !== "undefined" && (globalThis as any)[PRISMA_GLOBAL_KEY]);

const isNew = !existingClient;

const prisma =
  existingClient ??
  new PrismaClient({
    datasourceUrl: getRequiredConfig(config.database.url, "DATABASE_URL"),
    transactionOptions: {
      maxWait: 5000,
      timeout: 15000,
    },
  });

if (isNew) {
  if (typeof process !== "undefined") {
    (process as any)[PRISMA_GLOBAL_KEY] = prisma;
  }
  (globalThis as any)[PRISMA_GLOBAL_KEY] = prisma;
}

log.debug(isNew ? "[db] Primera instancia de PrismaClient creada." : "[db] Reutilizando instancia existente de PrismaClient.");

export function getPrisma(): PrismaClient {
  const global =
    (typeof process !== "undefined" && (process as any)[PRISMA_GLOBAL_KEY]) ||
    (typeof globalThis !== "undefined" && (globalThis as any)[PRISMA_GLOBAL_KEY]);
  return global ?? prisma;
}

export default prisma;
