import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const conversations = await prisma.conversation.findMany({
    include: {
      messages: true
    }
  });
  console.log("💾 Conversations & Messages:");
  console.log(JSON.stringify(conversations, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
