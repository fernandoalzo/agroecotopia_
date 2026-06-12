import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/payments/payments.repository.ts");

export class PaymentsRepository {
  async findAdmin() {
    log.debug("[db] Buscando usuario administrador");
    return prisma.user.findFirst({ where: { role: 'admin' } });
  }
}
