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

      // Create user, its associated "credentials" account, and a default store for consistency
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
          stores: {
            create: {
              name: "Tienda Principal",
              slug: "tienda-principal",
              description: "Tienda principal del administrador",
              status: "ACTIVE",
            },
          },
        },
      });
      log.info(`Initial admin user, credential account, and default store successfully created for: ${adminEmail}`);
    } else {
      log.debug(`Existing user found for admin email: ${adminEmail}. Checking account linkages, roles, and default store...`);

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

      let storeCreated = false;
      const existingStore = await prisma.store.findFirst({
        where: { ownerId: existingUser.id },
      });

      if (!existingStore) {
        log.info(`Default store missing for existing admin. Creating default store: ${adminEmail}`);
        await prisma.store.create({
          data: {
            name: "Tienda Principal",
            slug: "tienda-principal",
            description: "Tienda principal del administrador",
            ownerId: existingUser.id,
            status: "ACTIVE",
          },
        });
        log.info(`Default store successfully created for: ${adminEmail}`);
        storeCreated = true;
      }

      if (!linkedAccount && !elevatedRole && !storeCreated) {
        log.debug(`Admin user "${adminEmail}" is already fully synchronized, linked, has correct role and default store.`);
      }
    }
  } catch (error) {
    log.error("Failed during default admin initialization process:", error);
  }
}

