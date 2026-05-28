import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import { PrismaClient } from "@prisma/client";
import { initSocketServer } from "./src/backend/modules/chat/socketHandler";
import { ensureAdminExists } from "./src/lib/admin-init";
import logger from "./src/utils/logger";
import { applyRateLimitMiddleware } from "./src/backend/middlewares/rateLimiter";
import { config } from "./src/config/config";

const log = logger.child();

const dev = config.isDevelopment;
log.info(`Starting server in ${dev ? "development" : "production"} mode...`);

const app = next({ dev });
const handle = app.getRequestHandler();

const prisma = new PrismaClient();

app.prepare()
  .then(() => {
    log.info("Next.js application prepared successfully.");

    const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const parsedUrl = parse(req.url!, true);

      // Skip logging for static assets and Next.js internals (noisy, no observability value)
      const url = req.url || "";
      const isStaticAsset =
        url.startsWith("/_next/static/") ||
        url.startsWith("/_next/image") ||
        url.startsWith("/__nextjs") ||
        url.includes("favicon.ico") ||
        url.includes(".hot-update.");

      if (!isStaticAsset) {
        log.debug(`${req.method} ${url}`);
      }

      const isRateLimited = await applyRateLimitMiddleware(req, res, url, isStaticAsset);
      if (isRateLimited) {
        return;
      }

      handle(req, res, parsedUrl);
    });

    // Initialize the Socket.IO server via the dedicated handler module
    log.info("Initializing Socket.IO server...");
    initSocketServer(httpServer, prisma);

    // Verify default admin user exists on boot
    ensureAdminExists(prisma).catch((err) => {
      log.error("Failed to verify default admin exists on server boot:", err);
    });

    const PORT = config.app.port;
    httpServer.listen(PORT, () => {
      log.info(`> Monolith custom server ready on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    log.error("Failed to start the monolith custom server", err);
    process.exit(1);
  });
