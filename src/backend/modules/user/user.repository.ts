import prisma from "@/backend/db/prisma";
import type { Prisma } from "@prisma/client";

export class UserRepository {
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: Prisma.UserCreateInput) {
    return await prisma.user.create({
      data,
    });
  }

  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUserRole(id: string, role: "admin" | "user") {
    return await prisma.user.update({
      where: { id },
      data: { role },
    });
  }
}
