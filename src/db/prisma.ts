import { PrismaClient } from "@prisma/client";
import { ensureAdminExists } from "@/lib/admin-init";

const prismaClientSingleton = () => {
  const client = new PrismaClient();
  // Run admin initialization check in a non-blocking way
  ensureAdminExists(client);
  return client;
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
