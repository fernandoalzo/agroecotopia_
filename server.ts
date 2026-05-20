import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import { PrismaClient } from "@prisma/client";
import { initSocketServer } from "./src/backend/modules/chat/socketHandler";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const prisma = new PrismaClient();

app.prepare().then(() => {
  const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Initialize the Socket.IO server via the dedicated handler module
  initSocketServer(httpServer, prisma);

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Monolith custom server ready on http://localhost:${PORT}`);
  });
});
