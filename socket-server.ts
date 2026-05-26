import { createServer } from "http";
import { PrismaClient } from "@prisma/client";
import { initSocketServer } from "./src/backend/modules/chat/socketHandler";
import logger from "./src/utils/logger";

const log = logger.child("socket-server");

const PORT = process.env.WS_PORT || 3001;

async function bootstrap() {
  log.info("Iniciando servidor de WebSockets independiente...");

  const httpServer = createServer((req, res) => {
    // Health check endpoint opcional
    if (req.url === "/health") {
      res.writeHead(200);
      res.end("OK");
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const prisma = new PrismaClient();

  log.info("Inicializando manejador de Socket.IO...");
  initSocketServer(httpServer, prisma);

  httpServer.listen(PORT, () => {
    log.info(`> Servidor de WebSockets escuchando en http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  log.error("Fallo crítico al iniciar el servidor de WebSockets", err);
  process.exit(1);
});
