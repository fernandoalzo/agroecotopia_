import type { WafRequest, WafRuleResult, WafResult, WafConfig } from "./types";
import { evaluateGeoblock, resolveGeo } from "./geoblock";
import { evaluateIpBlocklist } from "./ip-blocklist";
import {
  evaluateBotDetection,
  evaluateSensitivePaths,
  evaluateAttackPatterns,
} from "./bot-detection";
import logger from "@/utils/logger";

const log = logger.child("src/lib/waf/rules-engine.ts");

export async function evaluateWafRules(
  req: WafRequest,
  cfg: WafConfig,
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
  if (cfg.blockedMethods.length > 0 && cfg.blockedMethods.includes(req.method.toUpperCase())) {
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
  if (cfg.ipBlocklist.length > 0) {
    const result = evaluateIpBlocklist(req, cfg.ipBlocklist);
    if (result) {
      ruleResults.push(result);
      const elapsed = performance.now() - start;
      return buildResult("BLOCK", result.reason, ruleResults, elapsed);
    }
  }

  // 2. Bot Detection
  const botResults = evaluateBotDetection(
    req,
    cfg.botBlock,
    cfg.botKnown,
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
  if (cfg.sensitivePaths.length > 0) {
    const result = evaluateSensitivePaths(req.path, req.rawUrl, cfg.sensitivePaths);
    if (result) {
      ruleResults.push(result);
      const elapsed = performance.now() - start;
      return buildResult("BLOCK", result.reason, ruleResults, elapsed);
    }
  }

  // 4. Attack Pattern Detection
  if (cfg.attackPatterns.length > 0) {
    const result = evaluateAttackPatterns(req.path, req.headers, cfg.attackPatterns);
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
