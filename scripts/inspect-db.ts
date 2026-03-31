import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ take: 3 });
  console.log("💾 First 3 products images data:");
  console.log(JSON.stringify(products.map(p => ({ slug: p.slug, images: p.images })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
