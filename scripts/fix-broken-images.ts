import { PrismaClient } from "@prisma/client";
import logger from "@/utils/logger";

const prisma = new PrismaClient();
const log = logger.child();

async function main() {
  log.info("Starting robust database repair for broken Unsplash URLs...");

  const brokenImageUrl = "https://images.unsplash.com/photo-1416870230247-d0a29a6c2005?auto=format&fit=crop&q=80&w=800";
  const replacementImageUrl = "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&q=80&w=800";

  // Use raw finding on name first just in case 'has' is tricky with long URLs
  // but Prisma 'has' should work if it's an exact match in the array.
  const productsToUpdate = await prisma.product.findMany({
    where: {
      images: {
        has: brokenImageUrl,
      },
    },
  });

  log.info(`Found ${productsToUpdate.length} products with broken image URLs.`);

  if (productsToUpdate.length === 0) {
    // Try a broader search just in case the query params differ slightly
    const allProducts = await prisma.product.findMany();
    const matchesBySubstring = allProducts.filter(p => 
        p.images?.some(img => img.includes("photo-1416870230247-d0a29a6c2005"))
    );
    
    if (matchesBySubstring.length > 0) {
        log.warn(`'has' filter failed but found ${matchesBySubstring.length} products via manual filtering.`);
        for (const product of matchesBySubstring) {
            const updatedImages = product.images.map(img => 
                img.includes("photo-1416870230247-d0a29a6c2005") ? replacementImageUrl : img
            );
            await prisma.product.update({
                where: { id: product.id },
                data: { images: updatedImages }
            });
            log.info(`Updated product (via substring): ${product.name}`);
        }
    } else {
        log.info("No broken images found using substring search.");
    }
    return;
  }

  for (const product of productsToUpdate) {
    const updatedImages = product.images.map((img) =>
      img === brokenImageUrl ? replacementImageUrl : img
    );

    await prisma.product.update({
      where: { id: product.id },
      data: { images: updatedImages },
    });
    log.info(`Updated product: ${product.name} (${product.id})`);
  }

  log.info("Database repair complete.");
}

main()
  .catch((e) => {
    log.error("Error during database repair:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
