import prisma from "@/db/prisma";
import type { Prisma } from "@prisma/client";

/**
 * UserRepository - Handles all database queries for the User model.
 * Located in the Repository layer, it strictly handles Data Access.
 */
export class UserRepository {
  /**
   * Finds a user by their email address.
   */
  static async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Creates a new user in the database.
   */
  static async createUser(data: Prisma.UserCreateInput) {
    return await prisma.user.create({
      data,
    });
  }

  /**
   * Finds a user by their ID.
   */
  static async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Updates a user's role.
   */
  static async updateUserRole(id: string, role: "admin" | "user") {
    return await prisma.user.update({
      where: { id },
      data: { role },
    });
  }
}
