import { RateLimiterMemory } from "rate-limiter-flexible";

declare global {
  var _globalRateLimiter: RateLimiterMemory | undefined;
  var _authRateLimiter: RateLimiterMemory | undefined;
  var _socketRateLimiter: RateLimiterMemory | undefined;
}

// 1. Capa Global: Límite general para proteger el custom server (server.ts)
export const globalRateLimiter =
  globalThis._globalRateLimiter ||
  new RateLimiterMemory({
    points: 200,
    duration: 60,
  });

// 2. Capa de Aplicación (Auth): Límite estricto para evitar fuerza bruta en Server Actions
export const authRateLimiter =
  globalThis._authRateLimiter ||
  new RateLimiterMemory({
    points: 5,
    duration: 60,
  });

// 3. Capa de WebSockets: Límite para evitar spam en el chat en tiempo real
export const socketRateLimiter =
  globalThis._socketRateLimiter ||
  new RateLimiterMemory({
    points: 2,
    duration: 1,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis._globalRateLimiter = globalRateLimiter;
  globalThis._authRateLimiter = authRateLimiter;
  globalThis._socketRateLimiter = socketRateLimiter;
}
