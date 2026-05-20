import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import { config } from "@/config/config";
import logger from "@/utils/logger";
const log = logger.child("src/lib/admin-init.ts");

/**
 * Ensures that the default admin user exists in the database.
 * This is called during database client initialization.
 */
export async function ensureAdminExists(prisma: PrismaClient) {
  const adminEmail = config.auth.admin.email;
  const adminPassword = config.auth.admin.password;

  if (!adminEmail || !adminPassword) {
    log.warn("ADMIN_EMAIL or ADMIN_PASSWORD not set. Admin initialization skipped.");
    return;
  }

  log.info(`Starting admin user validation check for: ${adminEmail}`);

  try {
    const adminRole = "admin";
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingUser) {
      log.info(`Admin user not found. Creating initial admin user: ${adminEmail}`);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create user and its associated "credentials" account for consistency
      await prisma.user.create({
        data: {
          name: "Admin Fernando",
          email: adminEmail,
          password: hashedPassword,
          role: adminRole as any,
          accounts: {
            create: {
              type: "credentials",
              provider: "credentials",
              providerAccountId: adminEmail, // Unique identifier for the provider
            },
          },
        },
      });
      log.info(`Initial admin user and credential account successfully created for: ${adminEmail}`);
    } else {
      log.debug(`Existing user found for admin email: ${adminEmail}. Checking account linkages and roles...`);

      // Ensure the admin account record exists if the user already exists
      const existingAccount = await prisma.account.findFirst({
        where: { userId: existingUser.id, provider: "credentials" },
      });

      let linkedAccount = false;
      if (!existingAccount) {
        log.info(`Account link missing for existing admin. Linking account record: ${adminEmail}`);
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: "credentials",
            provider: "credentials",
            providerAccountId: adminEmail,
          },
        });
        log.info(`Credentials account link successfully created for: ${adminEmail}`);
        linkedAccount = true;
      }

      let elevatedRole = false;
      if (existingUser.role !== adminRole) {
        log.warn(`Existing user has role "${existingUser.role}". Elevating to "${adminRole}" for email: ${adminEmail}`);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: adminRole as any },
        });
        log.info(`User role successfully elevated to "${adminRole}" for: ${adminEmail}`);
        elevatedRole = true;
      }

      if (!linkedAccount && !elevatedRole) {
        log.debug(`Admin user "${adminEmail}" is already fully synchronized, linked, and has correct role.`);
      }
    }
  } catch (error) {
    log.error("Failed during default admin initialization process:", error);
  }
}

