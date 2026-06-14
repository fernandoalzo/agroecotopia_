const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const store = await prisma.store.findFirst({
    include: { config: true }
  });
  console.log("Store:", store);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
