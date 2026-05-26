import type { IncomingMessage, ServerResponse } from "http";
import logger from "@/utils/logger";
import { globalRateLimiter, authRateLimiter } from "@/lib/rate-limit";

const log = logger.child("src/backend/middlewares/rateLimiter.ts");

/**
 * Aplica las capas de Rate Limiting Global y de Autenticación a las peticiones HTTP entrantes.
 * Retorna `true` si la petición debe ser bloqueada (termina el response internamente),
 * o `false` si la petición puede continuar al siguiente handler.
 */
export async function applyRateLimitMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  url: string,
  isStaticAsset: boolean
): Promise<boolean> {
  // Ignorar recursos estáticos para el conteo del limitador
  if (isStaticAsset) {
    return false;
  }

  try {
    const clientIp = req.socket.remoteAddress || "unknown_ip";
    
    // 1. Límite Global (Anti-DDoS)
    await globalRateLimiter.consume(clientIp);

    // 2. Límite de Autenticación (Anti-Brute Force) para NextAuth
    if (url.includes("/api/v1/auth/callback/credentials") && req.method === "POST") {
      await authRateLimiter.consume(clientIp);
    }

    return false; // Permitir que la petición continúe
  } catch (rejRes) {
    // Si algún limitador rechaza la promesa, entramos aquí
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
      return true; // Bloqueado
    }

    // Límite global excedido
    res.statusCode = 429;
    res.setHeader("Retry-After", "60");
    res.end(JSON.stringify({ error: "Too Many Requests", message: "Excediste el límite de peticiones globales." }));
    return true; // Bloqueado
  }
}
