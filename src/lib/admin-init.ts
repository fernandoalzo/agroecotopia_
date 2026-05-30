import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

import { config } from "@/config/config";
import logger from "@/utils/logger";
const log = logger.child("src/lib/admin-init.ts");

/**
 * Ensures that the default admin user exists in the database.
 * This function handles the comprehensive initialization and synchronization of the admin account,
 * ensuring all related entities (credentials, stores, E2EE keys) are correctly configured.
 * It is called automatically during database client initialization.
 * 
 * @param prisma - The initialized PrismaClient instance.
 */
export async function ensureAdminExists(prisma: PrismaClient) {
  // ============================================================================
  // STAGE 1: Configuration Validation
  // ============================================================================
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

    /**
     * ============================================================================
     * STAGE 2: E2EE Key Generation Helper
     * ============================================================================
     * Generates a full TweetNaCl cryptographic keypair set for the admin.
     * This creates a secure "escrow" backup in the database so the admin can
     * seamlessly retrieve their private keys when logging in from any browser.
     */
    const generateE2EEData = () => {
      const registrationId = Math.floor(Math.random() * 16380) + 1;
      
      // Identity Keys (Ed25519)
      const identityKeyPair = nacl.sign.keyPair();
      const identitySecret = identityKeyPair.secretKey;
      
      // Signed PreKeys (Curve25519)
      const signedPreKeyKeyPair = nacl.box.keyPair();
      const signedPreKeySecret = signedPreKeyKeyPair.secretKey;
      const signedPreKeyPublicKey = signedPreKeyKeyPair.publicKey;
      const signature = nacl.sign.detached(signedPreKeyPublicKey, identitySecret);

      return {
        registrationId,
        identityKey: naclUtil.encodeBase64(identityKeyPair.publicKey),
        identityPrivateKey: naclUtil.encodeBase64(identitySecret),
        signedPreKeyId: 1,
        signedPreKey: naclUtil.encodeBase64(signedPreKeyPublicKey),
        signedPreKeyPrivateKey: naclUtil.encodeBase64(signedPreKeySecret),
        signedPreKeySig: naclUtil.encodeBase64(signature),
        preKeys: {
          create: Array.from({ length: 20 }, (_, i) => {
            const preKeyKeyPair = nacl.box.keyPair();
            return {
              keyId: i + 1,
              publicKey: naclUtil.encodeBase64(preKeyKeyPair.publicKey),
            };
          }),
        },
      };
    };

    if (!existingUser) {
      // ============================================================================
      // STAGE 3: Initial Admin Creation
      // ============================================================================
      log.info(`Admin user not found. Creating initial admin user: ${adminEmail}`);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Bootstrap the complete admin profile in a single transaction-like structure
      await prisma.user.create({
        data: {
          name: "Admin Fernando",
          email: adminEmail,
          password: hashedPassword,
          role: adminRole as any,
          // 3a. NextAuth Credentials Account
          accounts: {
            create: {
              type: "credentials",
              provider: "credentials",
              providerAccountId: adminEmail,
            },
          },
          // 3b. Default Admin Store
          stores: {
            create: {
              name: "Tienda Principal",
              slug: "tienda-principal",
              description: "Tienda principal del administrador",
              status: "ACTIVE",
            },
          },
          // 3c. Server-side E2EE Cryptographic Escrow
          ...(config.chat.enableE2EE ? { e2eeDevice: { create: generateE2EEData() } } : {}),
        },
      });
      log.info(`Initial admin user, credential account, default store, and E2EE bundle successfully created for: ${adminEmail}`);
    } else {
      // ============================================================================
      // STAGE 4: Existing Admin Synchronization
      // ============================================================================
      // Ensures backwards compatibility and fixes any missing relations for existing setups.
      log.debug(`Existing user found for admin email: ${adminEmail}. Checking account linkages, roles, default store, and E2EE...`);

      // 4a. NextAuth Credentials Account Linkage Validation
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

      // 4b. Role Elevation Validation
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

      // 4c. Default Store Validation
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

      // 4d. Secure E2EE Escrow Generation Validation
      let e2eeDeviceCreated = false;
      if (config.chat.enableE2EE) {
        const existingE2EE = await prisma.e2EEDevice.findUnique({
          where: { userId: existingUser.id },
        });

        if (!existingE2EE) {
          log.info(`E2EE device missing for existing admin. Creating secure escrow E2EE bundle for: ${adminEmail}`);
          await prisma.e2EEDevice.create({
            data: {
              userId: existingUser.id,
              ...generateE2EEData(),
            },
          });
          log.info(`E2EE escrow bundle successfully created for: ${adminEmail}`);
          e2eeDeviceCreated = true;
        }
      }

      // Final synchronization report
      if (!linkedAccount && !elevatedRole && !storeCreated && !e2eeDeviceCreated) {
        log.debug(`Admin user "${adminEmail}" is already fully synchronized, linked, has correct role, default store, and E2EE keys.`);
      }
    }
  } catch (error) {
    log.error("Failed during default admin initialization process:", error);
  }
}
