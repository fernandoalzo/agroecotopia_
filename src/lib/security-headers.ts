import { config } from "@/config/config";

type HeaderRecord = Record<string, string>;

/**
 * Builds a Content-Security-Policy string from the centralized config.
 * Dynamically appends extra origins for payment providers, CDNs, etc.
 */
function buildCSP(): string {
  const csp = config.security.csp;

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      ...csp.scriptSrc,
      ...csp.extraScriptSrc,
    ],
    "style-src": csp.styleSrc,
    "img-src": csp.imgSrc,
    "font-src": csp.fontSrc,
    "connect-src": [
      ...csp.connectSrc,
      ...csp.extraConnectSrc,
    ],
    "frame-src": [
      ...csp.frameSrc,
      ...csp.extraFrameSrc,
    ],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": csp.formAction,
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
 * Builds the Strict-Transport-Security value from config.
 */
function buildHSTS(): string {
  const hsts = config.security.hsts;
  const parts = [`max-age=${hsts.maxAge}`];
  if (hsts.includeSubDomains) parts.push("includeSubDomains");
  if (hsts.preload) parts.push("preload");
  return parts.join("; ");
}

/**
 * Builds the Permissions-Policy value from config.
 */
function buildPermissionsPolicy(): string {
  const pp = config.security.permissionsPolicy;
  return Object.entries(pp)
    .map(([feature, value]) => `${feature}=${value}`)
    .join(", ");
}

/**
 * Security headers aligned with Amazon and AliExpress production standards.
 *
 * All values are read from src/config/config.ts → config.security.*.
 * Change the security posture from a single file.
 *
 * Reference:
 *   - OWASP Secure Headers Project
 *   - Mozilla Observatory
 *   - AWS Security Pillar (Well-Architected Framework)
 *   - PCI DSS v4.0 Requirement 6.6
 */
export const SECURITY_HEADERS: HeaderRecord = {
  "Content-Security-Policy": buildCSP(),
  "Strict-Transport-Security": buildHSTS(),
  "X-Content-Type-Options": config.security.xContentTypeOptions,
  "X-Frame-Options": config.security.xFrameOptions,
  "Referrer-Policy": config.security.referrerPolicy,
  "Permissions-Policy": buildPermissionsPolicy(),
  "Cross-Origin-Opener-Policy": config.security.crossOriginOpenerPolicy,
  "Cross-Origin-Resource-Policy": config.security.crossOriginResourcePolicy,
  "X-XSS-Protection": config.security.xXSSProtection,
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
  if (!config.security.headersEnabled) return;

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
