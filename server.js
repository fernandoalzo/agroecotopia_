const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { PrismaClient } = require("@prisma/client");
const { initSocketServer } = require("./src/backend/modules/chat/socketHandler");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const prisma = new PrismaClient();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize the Socket.IO server via the dedicated handler module
  initSocketServer(httpServer, prisma);

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Monolith custom server ready on http://localhost:${PORT}`);
  });
});
