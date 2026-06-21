import type { WafRequest, WafRuleResult, WafResult, CompiledWafConfig } from "./types";
import { evaluateGeoblock, resolveGeo } from "./geoblock";
import { evaluateIpBlocklist } from "./ip-blocklist";
import {
  evaluateBotDetection,
  evaluateSensitivePaths,
  evaluateAttackPatterns,
} from "./bot-detection";
import { evaluateRateLimit } from "./rate-limiter";
import logger from "@/utils/logger";

const log = logger.child("src/lib/waf/rules-engine.ts");

export async function evaluateWafRules(
  req: WafRequest,
  cfg: CompiledWafConfig,
): Promise<WafResult> {
  const start = performance.now();
  const ruleResults: WafRuleResult[] = [];

  if (cfg.mode === "disabled") {
    return {
      action: "ALLOW",
      blocked: false,
      reason: "WAF deshabilitado",
      ruleResults: [],
      elapsedMs: 0,
    };
  }

  // 0. Method Block
  if (cfg.blockedMethodsSet.size > 0 && cfg.blockedMethodsSet.has(req.method.toUpperCase())) {
    const result: WafRuleResult = {
      ruleId: "waf:db:method",
      ruleName: "Método HTTP Bloqueado",
      action: "BLOCK",
      severity: "medium",
      blocked: true,
      reason: `Método HTTP bloqueado: ${req.method}`,
    };
    ruleResults.push(result);
    const elapsed = performance.now() - start;
    log.warn("[waf] Método bloqueado", { ip: req.ip, method: req.method });
    return buildResult("BLOCK", result.reason, ruleResults, elapsed);
  }

  // 1. IP Blocklist
  if (cfg.compiledIpBlocklist.length > 0) {
    const result = evaluateIpBlocklist(req, cfg.compiledIpBlocklist);
    if (result) {
      ruleResults.push(result);
      const elapsed = performance.now() - start;
      return buildResult("BLOCK", result.reason, ruleResults, elapsed);
    }
  }

  // 1.5 Rate Limiting (DDoS Protection)
  if (cfg.compiledRateLimits.length > 0) {
    const isRateLimited = await evaluateRateLimit(req.ip, req.path, cfg.compiledRateLimits);
    if (isRateLimited) {
      const result: WafRuleResult = {
        ruleId: "waf:rate_limit",
        ruleName: "Rate Limit Excedido",
        action: "BLOCK",
        severity: "high",
        blocked: true,
        reason: `Múltiples peticiones exceden el límite (L7 DDoS Protection)`,
      };
      ruleResults.push(result);
      const elapsed = performance.now() - start;
      log.warn("[waf] IP bloqueada por Rate Limit", { ip: req.ip, path: req.path });
      return buildResult("BLOCK", result.reason, ruleResults, elapsed);
    }
  }

  // 2. Bot Detection
  const botResults = evaluateBotDetection(
    req,
    cfg.botBlockSet,
    cfg.botKnownSet,
    cfg.blockEmptyUserAgent,
  );
  for (const r of botResults) ruleResults.push(r);
  if (botResults.length > 0) {
    const elapsed = performance.now() - start;
    const blockResult = botResults.find((r) => r.blocked);
    if (blockResult) {
      return buildResult("BLOCK", blockResult.reason, ruleResults, elapsed);
    }
  }

  // 3. Sensitive Paths
  if (cfg.sensitivePathsLower.length > 0) {
    const result = evaluateSensitivePaths(req.path, req.rawUrl, cfg.sensitivePathsLower);
    if (result) {
      ruleResults.push(result);
      const elapsed = performance.now() - start;
      return buildResult("BLOCK", result.reason, ruleResults, elapsed);
    }
  }

  // 4. Attack Pattern Detection
  if (cfg.compiledAttackPatterns.length > 0) {
    const result = evaluateAttackPatterns(req.path, req.headers, cfg.compiledAttackPatterns);
    if (result) {
      ruleResults.push(result);
      const elapsed = performance.now() - start;
      return buildResult("BLOCK", result.reason, ruleResults, elapsed);
    }
  }

  // 5. Geoblock
  if (cfg.geoBlocked.length > 0) {
    const geo = await resolveGeo(req.ip);
    const countryCode = geo?.country || req.country || null;

    const result = evaluateGeoblock(req, cfg.geoBlocked, countryCode);
    if (result) {
      ruleResults.push(result);
      const elapsed = performance.now() - start;
      return buildResult("BLOCK", result.reason, ruleResults, elapsed);
    }
  }

  const elapsed = performance.now() - start;
  return buildResult("ALLOW", "Ninguna regla WAF activada", ruleResults, elapsed);
}

function buildResult(
  action: "ALLOW" | "BLOCK",
  reason: string,
  ruleResults: WafRuleResult[],
  elapsedMs: number,
): WafResult {
  return {
    action,
    blocked: action === "BLOCK",
    reason,
    ruleResults,
    elapsedMs: Math.round(elapsedMs),
  };
}
