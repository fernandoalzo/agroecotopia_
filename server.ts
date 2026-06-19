import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import prisma from "@/backend/db/prisma";
import { initSocketServer } from "./src/backend/modules/chat/socketHandler";
import { ensureAdminExists } from "./src/lib/admin-init";
import logger from "./src/utils/logger";
import { applyRateLimitMiddleware } from "./src/backend/middlewares/rateLimiter";
import { config } from "./src/config/config";
import { initializeStockMaster } from "./src/backend/modules/stockGuardian/init";
import { applySecurityHeaders } from "./src/lib/security-headers";
import { applyWafMiddleware } from "./src/lib/waf";

const log = logger.child();

const dev = config.isDevelopment;
log.info(`Starting server in ${dev ? "development" : "production"} mode...`);

const app = next({ dev });
const handle = app.getRequestHandler();

// Create HTTP server and initialize Socket.IO BEFORE app.prepare()
// to eliminate the race window where Server Actions could run without Socket.IO.
const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = parse(req.url!, true);

  // Inyectar security headers en TODAS las respuestas (CSP, HSTS, XFO, etc.)
  applySecurityHeaders(res);

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

  // ── WAF: evalúa reglas de seguridad antes de cualquier procesamiento ──
  const isWafBlocked = await applyWafMiddleware(req, res);
  if (isWafBlocked) return;

  const isRateLimited = await applyRateLimitMiddleware(req, res, url, isStaticAsset);
  if (isRateLimited) {
    return;
  }

  handle(req, res, parsedUrl);
});

log.info("Initializing Socket.IO server...");
initSocketServer(httpServer, prisma);

app.prepare()
  .then(() => {
    log.info("Next.js application prepared successfully.");

    // Verify default admin user exists on boot
    ensureAdminExists(prisma).catch((err) => {
      log.error("Failed to verify default admin exists on server boot:", err);
    });

    // Sincronizar stock maestro en Redis desde PostgreSQL (no bloqueante)
    initializeStockMaster(prisma).catch((err) => {
      log.warn("Failed to initialize stock master in Redis (non-critical):", err);
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
