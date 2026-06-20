/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IncomingMessage, ServerResponse } from "http";
import type { WafRequest, WafResult, CompiledWafConfig, DbRules, ParsedCidr } from "./types";
import { evaluateWafRules } from "./rules-engine";
import { clearGeoCache } from "./geoblock";
import { parseCidr } from "./ip-blocklist";
import { config } from "@/config/config";
import logger from "@/utils/logger";
import eventBus from "@/utils/eventBus";
import { pushEntry, maskLastOctet, isStaticAsset } from "./request-buffer";

const log = logger.child("src/lib/waf/index.ts");

const WAF_DB_KEY = "__wafDbOverrides";

function getDbOverrides(): DbRules {
  if (typeof process !== "undefined" && (process as any)[WAF_DB_KEY]) {
    return (process as any)[WAF_DB_KEY];
  }
  if (typeof globalThis !== "undefined" && (globalThis as any)[WAF_DB_KEY]) {
    return (globalThis as any)[WAF_DB_KEY];
  }
  const fresh: DbRules = {
    ipBlocklist: [],
    geoBlocked: [],
    sensitivePaths: [],
    blockedMethods: [],
    botBlock: [],
    botKnown: [],
    blockEmptyUserAgent: false,
    attackPatterns: [],
  };
  if (typeof process !== "undefined") (process as any)[WAF_DB_KEY] = fresh;
  (globalThis as any)[WAF_DB_KEY] = fresh;
  return fresh;
}

let dbOverrides: DbRules = getDbOverrides();

function resolveWafConfig(): CompiledWafConfig {
  return {
    mode: config.security.waf.mode,
    ipBlocklist: dbOverrides.ipBlocklist,
    geoBlocked: dbOverrides.geoBlocked,
    sensitivePaths: dbOverrides.sensitivePaths,
    blockedMethods: dbOverrides.blockedMethods,
    botBlock: dbOverrides.botBlock,
    botKnown: dbOverrides.botKnown,
    blockEmptyUserAgent: dbOverrides.blockEmptyUserAgent,
    attackPatterns: dbOverrides.attackPatterns,

    compiledIpBlocklist: dbOverrides.ipBlocklist.map(parseCidr).filter((c): c is ParsedCidr => c !== null),
    botBlockSet: new Set(dbOverrides.botBlock.map(s => s.toLowerCase())),
    botKnownSet: new Set(dbOverrides.botKnown.map(s => s.toLowerCase())),
    blockedMethodsSet: new Set(dbOverrides.blockedMethods.map(s => s.toUpperCase())),
    sensitivePathsLower: dbOverrides.sensitivePaths.map(s => s.toLowerCase()),
    compiledAttackPatterns: dbOverrides.attackPatterns
      .map(p => { try { return new RegExp(p, 'i'); } catch { return null; } })
      .filter((r): r is RegExp => r !== null),
  };
}

function extractRequest(
  req: IncomingMessage,
): WafRequest {
  const headers = req.headers as Record<string, string | string[] | undefined>;
  const cfCountry = headers["cf-ipcountry"] as string | undefined;
  const xCountry = headers["x-country"] as string | undefined;

  const fullUrl = req.url || "/";
  return {
    ip: (headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown_ip",
    method: req.method || "GET",
    path: fullUrl.split("?")[0] || "/",
    rawUrl: fullUrl,
    userAgent: (headers["user-agent"] as string) || "",
    headers,
    country: cfCountry || xCountry || undefined,
  };
}

export class Waf {
  private config: CompiledWafConfig;

  constructor() {
    this.config = resolveWafConfig();
    if (this.config.mode !== "disabled") {
      log.info("[waf] Inicializado en modo:", { mode: this.config.mode });
    }
  }

  async evaluate(req: IncomingMessage, preExtractedReq?: WafRequest): Promise<WafResult> {
    if (this.config.mode === "disabled") {
      return {
        action: "ALLOW",
        blocked: false,
        reason: "WAF deshabilitado",
        ruleResults: [],
        elapsedMs: 0,
      };
    }

    const wafReq = preExtractedReq || extractRequest(req);

    if (this.config.mode === "monitor") {
      const result = await evaluateWafRules(wafReq, this.config);
      if (result.blocked) {
        log.info("[waf] [MONITOR] Bloqueo habría ocurrido:", {
          ip: wafReq.ip,
          path: wafReq.path,
          reason: result.reason,
          rules: result.ruleResults.length,
          elapsedMs: result.elapsedMs,
        });
      }
      return {
        ...result,
        action: "ALLOW",
        blocked: false,
        reason: `[MONITOR] ${result.reason}`,
      };
    }

    return evaluateWafRules(wafReq, this.config);
  }

  getConfig(): CompiledWafConfig {
    return { ...this.config };
  }

  updateDbRules(rules: DbRules): void {
    dbOverrides = rules;
    if (typeof process !== "undefined") (process as any)[WAF_DB_KEY] = rules;
    (globalThis as any)[WAF_DB_KEY] = rules;
    this.config = resolveWafConfig();
    log.info("[waf] Reglas DB sincronizadas");
  }

  reloadConfig(): void {
    this.config = resolveWafConfig();
    log.info("[waf] Configuración recargada");
  }

  clearCache(): void {
    clearGeoCache();
    log.debug("[waf] Caché geo limpiada");
  }
}

const WAF_INSTANCE_KEY = "__wafInstance";
function getOrCreateWaf(): Waf {
  if (typeof process !== "undefined" && (process as any)[WAF_INSTANCE_KEY]) {
    return (process as any)[WAF_INSTANCE_KEY];
  }
  if (typeof globalThis !== "undefined" && (globalThis as any)[WAF_INSTANCE_KEY]) {
    return (globalThis as any)[WAF_INSTANCE_KEY];
  }
  const instance = new Waf();
  if (typeof process !== "undefined") (process as any)[WAF_INSTANCE_KEY] = instance;
  (globalThis as any)[WAF_INSTANCE_KEY] = instance;
  return instance;
}

export const waf = getOrCreateWaf();

import { getWafBlockHtml } from "./templates";

export async function applyWafMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const wafConfig = waf.getConfig();
  if (wafConfig.mode === "disabled") return false;

  const url = req.url || "";
  if (isStaticAsset(url)) return false;

  const wafReq = extractRequest(req);
  const result = await waf.evaluate(req, wafReq);

  if (true) {
    const queryIdx = url.indexOf("?");
    const entry = pushEntry({
      timestamp: new Date().toISOString(),
      method: wafReq.method,
      path: wafReq.path,
      query: queryIdx >= 0 ? url.slice(queryIdx + 1) : "",
      ip: config.security.waf.anonymizeIp ? maskLastOctet(wafReq.ip) : wafReq.ip,
      userAgent: (wafReq.userAgent || "").slice(0, 120),
      wafAction: result.blocked ? "BLOCK" : wafConfig.mode === "monitor" ? "MONITOR" : "ALLOW",
      wafRules: result.ruleResults.map((r) => r.ruleId),
      elapsedMs: result.elapsedMs,
      country: wafReq.country,
      headers: wafReq.headers,
    });
    eventBus.emit("waf:request_live", { ...entry, _room: "waf:monitor" });
  }

  if (result.blocked) {
    res.statusCode = 403;
    const referenceId = result.ruleResults[0]?.ruleId || "waf:generic";
    const isHtml = req.headers.accept?.includes("text/html");

    if (isHtml) {
      const incidentId = `${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(getWafBlockHtml({ referenceId, ip: wafReq.ip || "Desconocida", path: wafReq.path, incidentId }));
    } else {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        error: "Forbidden",
        message: "La solicitud fue bloqueada por el firewall de aplicación (WAF).",
        reference: referenceId,
      }));
    }
    log.warn("[waf] BLOQUEADO", {
      ip: wafReq.ip,
      path: wafReq.path,
      reason: result.reason,
      ruleCount: result.ruleResults.length,
      elapsedMs: result.elapsedMs,
    });
    return true;
  }

  if (wafConfig.mode === "monitor" && result.ruleResults.length > 0) {
    res.setHeader("X-WAF-Monitor", result.ruleResults.map((r) => r.ruleId).join(","));
  }

  return false;
}

export { extractRequest, resolveWafConfig };
