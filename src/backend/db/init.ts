import { config } from "@/config/config";
import logger from "@/utils/logger";
import { PrismaClient } from "@prisma/client";

const log = logger.child("src/backend/db/init.ts");

export async function ensureDefaultAdminStore(prisma: PrismaClient) {
  try {
    const bitcoin = await prisma.cryptocurrency.findUnique({
      where: { symbol: 'BTC' }
    });
    
    if (!bitcoin) {
      log.info(`Creando criptomoneda por defecto (Bitcoin)...`);
      await prisma.cryptocurrency.create({
        data: {
          name: 'Bitcoin',
          symbol: 'BTC',
          logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
          isActive: true
        }
      });
    }

    const adminEmail = config.auth.admin.email;
    if (!adminEmail) return;

    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!admin) return; // Admin hasn't logged in yet

    const defaultStoreName = config.marketplace.adminDefaultStoreName;
    const defaultSlug = defaultStoreName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existingStore = await prisma.store.findFirst({
      where: {
        OR: [
          { ownerId: admin.id },
          { slug: defaultSlug }
        ]
      }
    });

    if (!existingStore) {
      log.info(`Creando tienda por defecto para el administrador (${adminEmail})...`);
      await prisma.store.create({
        data: {
          name: defaultStoreName,
          slug: defaultSlug,
          description: "Tienda oficial de Agroecotopia",
          status: 'ACTIVE',
          ownerId: admin.id,
        }
      });
      log.info("Tienda por defecto creada exitosamente.");
    }
  } catch (error) {
    log.error("Error al asegurar la tienda por defecto del admin:", error);
  }
}
