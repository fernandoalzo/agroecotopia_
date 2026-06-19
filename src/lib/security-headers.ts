import { config } from "@/config/config";

type HeaderRecord = Record<string, string>;

/**
 * Builds a Content-Security-Policy string based on the runtime environment.
 * Strict in production, relaxed in development (allows HMR WebSocket connections).
 */
function buildCSP(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://challenges.cloudflare.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:", "http:"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      "https:",
      "wss:",
      "https://api.mercadopago.com",
      "https://*.mercadopago.com.co",
    ],
    "frame-src": [
      "'self'",
      "https://*.mercadopago.com.co",
      "https://challenges.cloudflare.com",
    ],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "upgrade-insecure-requests": [],
  };

  if (config.isDevelopment) {
    directives["connect-src"]!.push("ws://localhost:*", "http://localhost:*");
  }

  return Object.entries(directives)
    .map(([key, values]) =>
      values.length > 0 ? `${key} ${values.join(" ")}` : key,
    )
    .join("; ");
}

/**
 * Security headers aligned with Amazon and AliExpress production standards.
 *
 * Reference:
 *   - OWASP Secure Headers Project
 *   - Mozilla Observatory
 *   - AWS Security Pillar (Well-Architected Framework)
 *   - PCI DSS v4.0 Requirement 6.6
 */
export const SECURITY_HEADERS: HeaderRecord = {
  "Content-Security-Policy": buildCSP(),
  "Strict-Transport-Security":
    "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(self)",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-XSS-Protection": "0",
};

/**
 * Wraps `res.writeHead` to inject security headers on every HTTP response.
 * Uses first-writer-wins semantics: if a header was already set by the
 * application (e.g., a custom CSP via Next.js), it is not overwritten.
 *
 * This is the standard production pattern used by Express/helmet and
 * ensures ALL responses (including 429, 401, 500) carry security headers.
 */
export function applySecurityHeaders(
  res: import("http").ServerResponse,
): void {
  const originalWriteHead = res.writeHead.bind(res);

  res.writeHead = function (
    this: import("http").ServerResponse,
    statusCode: number,
    ...args: any[]
  ) {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      if (!this.getHeader(key)) {
        this.setHeader(key, value);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return originalWriteHead(statusCode, ...(args as [any, any?]));
  } as typeof res.writeHead;
}
