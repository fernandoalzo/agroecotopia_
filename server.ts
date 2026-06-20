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
import { wafService } from "./src/backend/modules/waf";

const log = logger.child();

const dev = config.isDevelopment;
log.info(`Starting server in ${dev ? "development" : "production"} mode...`);

// 🚀 Inicialización del motor principal (Next.js App Router)
const app = next({ dev });
const handle = app.getRequestHandler();

// ⚡ Creación del servidor HTTP (Monolito)
// Se inicializa ANTES de app.prepare() para evitar la ventana de carrera (race window)
// en la cual las Server Actions podrían ejecutarse sin un servidor Socket.IO disponible.
const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = parse(req.url!, true);

  // 🛡️ Capa 1: Cabeceras de Seguridad (Security Headers)
  // Inyecta políticas estrictas en TODAS las respuestas (CSP, HSTS, XFO, CORP, etc.)
  applySecurityHeaders(res);

  // 🚦 Filtro de Telemetría: Evita inundar los logs con peticiones estáticas o internas de Next.js
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

  // 🧱 Capa 2: Web Application Firewall (WAF)
  // Evalúa reglas de bloqueo (IPs, Bots, Patrones Maliciosos) antes de cualquier procesamiento interno.
  const isWafBlocked = await applyWafMiddleware(req, res);
  if (isWafBlocked) return; // Termina la petición si el firewall la bloquea

  // ⏱️ Capa 3: Limitador de Tasa (Rate Limiter)
  // Previene ataques de denegación de servicio (DDoS) controlando el flujo por IP.
  const isRateLimited = await applyRateLimitMiddleware(req, res, url, isStaticAsset);
  if (isRateLimited) {
    return; // Termina la petición si excede el límite de tráfico
  }

  // 🖥️ Capa 4: Enrutamiento Principal
  // Transfiere el control al manejador estándar de Next.js (Server Actions, Páginas, APIs)
  handle(req, res, parsedUrl);
});

// 🔌 Inicialización de Comunicaciones en Tiempo Real (WebSockets)
log.info("Initializing Socket.IO server...");
initSocketServer(httpServer, prisma);

// 🏗️ Preparación final de la aplicación y carga de dependencias asíncronas
app.prepare()
  .then(() => {
    log.info("Next.js application prepared successfully.");

    // 👤 Verificación de Superusuario (Bootstrapping)
    // Asegura la existencia de la cuenta administradora base en cada reinicio.
    ensureAdminExists(prisma).catch((err) => {
      log.error("Failed to verify default admin exists on server boot:", err);
    });

    // 🛡️ Sincronización de Reglas del Firewall (WAF)
    // Carga las reglas configuradas desde PostgreSQL hacia la memoria volátil para evaluación ultra rápida.
    wafService.reloadWaf()
      .then(() => {
        log.info("🛡️ WAF (Web Application Firewall) inicializado y protegiendo el servidor.");
      })
      .catch((err) => {
        log.error("🛡️ ❌ Error crítico: No se pudieron cargar las reglas del WAF desde la DB en el inicio:", err);
      });

    // 📦 Sincronización del Guardián de Stock (Redis Cache)
    // Inicializa la memoria distribuida para el control concurrente de inventario (no es bloqueante).
    initializeStockMaster(prisma).catch((err) => {
      log.warn("Failed to initialize stock master in Redis (non-critical):", err);
    });

    // 🟢 Arranque del Listener HTTP
    const PORT = config.app.port;
    httpServer.listen(PORT, () => {
      log.info(`> Monolith custom server ready on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    // 💥 Captura de errores fatales en el arranque
    log.error("Failed to start the monolith custom server", err);
    process.exit(1);
  });
