import prisma from "@/backend/db/prisma";
import type { Prisma } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/user/user.repository.ts");

export class UserRepository {
  async findByEmail(email: string) {
    log.debug("Buscando usuario por email:", { email });
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: Prisma.UserCreateInput) {
    log.info("Creando nuevo usuario en la base de datos:", { email: data.email, role: data.role });
    return await prisma.user.create({
      data,
    });
  }

  async findById(id: string) {
    log.debug("Buscando usuario por ID:", { userId: id });
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUserRole(id: string, role: "admin" | "user" | "seller") {
    log.info("Actualizando rol del usuario:", { userId: id, nuevoRol: role });
    return await prisma.user.update({
      where: { id },
      data: { role },
    });
  }
}
