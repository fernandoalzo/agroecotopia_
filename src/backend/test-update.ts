import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const storeId = "cmq09sg5g000cdf23zwor0fo3";
  const data = { shippingMethods: { delivery: { enabled: false }, pickup: { enabled: false } } };
  
  const res = await prisma.storeConfig.upsert({
    where: { storeId },
    update: { ...data },
    create: { storeId, ...data }
  });
  console.log("Updated:", JSON.stringify(res, null, 2));
}
main();
