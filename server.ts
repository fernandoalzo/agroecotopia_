import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import { PrismaClient } from "@prisma/client";
import { initSocketServer } from "./src/backend/modules/chat/socketHandler";
import { ensureAdminExists } from "./src/lib/admin-init";
import logger from "./src/utils/logger";
import { globalRateLimiter, authRateLimiter } from "./src/lib/rate-limit";

const log = logger.child();

const dev = process.env.NODE_ENV !== "production";
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

      // --- Global & Auth Rate Limit ---
      if (!isStaticAsset) {
        try {
          const clientIp = req.socket.remoteAddress || "unknown_ip";
          
          // 1. Global limit
          await globalRateLimiter.consume(clientIp);

          // 2. Auth limit for specific endpoint
          if (url.includes("/api/v1/auth/callback/credentials") && req.method === "POST") {
            await authRateLimiter.consume(clientIp);
          }

        } catch (rejRes) {
          const isAuth = url.includes("/api/v1/auth/callback/credentials") && req.method === "POST";
          log.warn(`[Rate Limit Exceeded] IP: ${req.socket.remoteAddress || "unknown"} (Auth: ${isAuth})`);
          
          res.setHeader("Content-Type", "application/json");

          if (isAuth) {
            // Intercepted NextAuth credentials login
            const protocol = req.headers["x-forwarded-proto"] || "http";
            const host = req.headers["host"] || "localhost:3000";
            const encodedError = encodeURIComponent("Demasiados intentos. Por favor, inténtalo de nuevo en 1 minuto.");
            const fullUrl = `${protocol}://${host}/api/v1/auth/signin?error=${encodedError}`;
            
            res.statusCode = 401; // NextAuth expects 401 for failed auth
            res.end(JSON.stringify({ 
              url: fullUrl
            }));
            return;
          }

          res.statusCode = 429;
          res.setHeader("Retry-After", "60");
          res.end(JSON.stringify({ error: "Too Many Requests", message: "Excediste el límite de peticiones globales." }));
          return;
        }
      }
      // -------------------------

      handle(req, res, parsedUrl);
    });

    // Initialize the Socket.IO server via the dedicated handler module
    log.info("Initializing Socket.IO server...");
    initSocketServer(httpServer, prisma);

    // Verify default admin user exists on boot
    ensureAdminExists(prisma).catch((err) => {
      log.error("Failed to verify default admin exists on server boot:", err);
    });

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      log.info(`> Monolith custom server ready on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    log.error("Failed to start the monolith custom server", err);
    process.exit(1);
  });
