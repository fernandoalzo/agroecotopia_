import { PrismaClient } from "@prisma/client";
import logger from "@/utils/logger";
import { config, getRequiredConfig } from "@/config/config";

const log = logger.child("src/backend/db/prisma.ts");

const globalForPrisma = globalThis as unknown as {
  __prismaClient?: PrismaClient;
};

const isNew = !globalForPrisma.__prismaClient;

const prisma =
  globalForPrisma.__prismaClient ??
  new PrismaClient({
    datasourceUrl: getRequiredConfig(config.database.url, "DATABASE_URL"),
    transactionOptions: {
      maxWait: 5000,
      timeout: 15000,
    },
  });

globalForPrisma.__prismaClient = prisma;

log.debug(isNew ? "Primera instancia de PrismaClient creada." : "Reutilizando instancia existente de PrismaClient.");

export default prisma;
