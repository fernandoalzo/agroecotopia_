const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const maxConn = await prisma.$queryRaw`SELECT name, setting FROM pg_settings WHERE name IN ('max_connections', 'superuser_reserved_connections')`;
  const activeConn = await prisma.$queryRaw`SELECT count(*), state FROM pg_stat_activity GROUP BY state`;
  console.log("Max Connections Settings:", maxConn);
  console.log("Active Connections by State:", activeConn);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
