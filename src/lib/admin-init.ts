import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import { config } from "@/config/config";

/**
 * Ensures that the default admin user exists in the database.
 * This is called during database client initialization.
 */
export async function ensureAdminExists(prisma: PrismaClient) {
  const adminEmail = config.auth.admin.email;
  const adminPassword = config.auth.admin.password;

  if (!adminEmail || !adminPassword) {
    if (config.isProduction) {
      console.warn("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set. Admin initialization skipped.");
    }
    return;
  }

  try {
    const adminRole = "admin";
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingUser) {
      console.log(`🚀 Creating initial admin user: ${adminEmail}`);
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
    } else {
      // Ensure the admin account record exists if the user already exists
      const existingAccount = await prisma.account.findFirst({
        where: { userId: existingUser.id, provider: "credentials" },
      });

      if (!existingAccount) {
        console.log(`🔗 Linking account record to existing admin: ${adminEmail}`);
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: "credentials",
            provider: "credentials",
            providerAccountId: adminEmail,
          },
        });
      }

      if (existingUser.role !== adminRole) {
        console.log(`🔼 Elevating existing user to admin: ${adminEmail}`);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: adminRole as any },
        });
      }
    }
  } catch (error) {
    console.error("❌ Failed to ensure admin exists:", error);
  }
}
