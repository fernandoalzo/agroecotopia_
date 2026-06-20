import type { WafRequest, WafRuleResult } from "./types";

export function evaluateBotDetection(
  req: WafRequest,
  botBlock: Set<string>,
  botKnown: Set<string>,
  blockEmptyUserAgent: boolean,
): WafRuleResult[] {
  const results: WafRuleResult[] = [];
  const ua = (req.userAgent || "").toLowerCase();

  if (blockEmptyUserAgent && !ua) {
    results.push({
      ruleId: "waf:bot:empty-ua",
      ruleName: "User-Agent Vacío",
      action: "BLOCK",
      severity: "medium",
      blocked: true,
      reason: "Solicitud sin User-Agent — posible bot/scanner",
    });
    return results;
  }

  for (const scanner of botBlock) {
    if (ua.includes(scanner)) {
      results.push({
        ruleId: "waf:bot:scanner",
        ruleName: "Scanner/Bot Bloqueado",
        action: "BLOCK",
        severity: "high",
        blocked: true,
        reason: `User-Agent bloqueado: ${scanner}`,
      });
      return results;
    }
  }

  if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) {
    let isKnown = false;
    for (const b of botKnown) {
      if (ua.includes(b)) {
        isKnown = true;
        break;
      }
    }
    if (!isKnown) {
      results.push({
        ruleId: "waf:bot:unknown",
        ruleName: "Bot Desconocido",
        action: "BLOCK",
        severity: "low",
        blocked: true,
        reason: `Bot no reconocido en User-Agent: ${req.userAgent?.substring(0, 80)}`,
      });
    }
  }

  return results;
}

export function evaluateSensitivePaths(
  path: string,
  rawUrl: string,
  sensitivePathsLower: string[],
): WafRuleResult | null {
  const lowerPath = path.toLowerCase();
  const lowerRaw = rawUrl.toLowerCase();

  for (const sp of sensitivePathsLower) {
    if (lowerPath.startsWith(sp) || lowerRaw.startsWith(sp)) {
      return {
        ruleId: "waf:path:sensitive",
        ruleName: "Ruta Sensible",
        action: "BLOCK",
        severity: "high",
        blocked: true,
        reason: `Acceso bloqueado a ruta sensible: ${sp}`,
      };
    }
  }

  return null;
}

export function evaluateAttackPatterns(
  path: string,
  headers: Record<string, string | string[] | undefined>,
  compiledAttackPatterns: RegExp[],
): WafRuleResult | null {
  let decoded = decodeURIComponent(path).toLowerCase();
  if (decoded.includes("%")) {
    try {
      decoded = decodeURIComponent(decoded);
    } catch {}
  }

  for (const regex of compiledAttackPatterns) {
    if (regex.test(decoded)) {
        return {
          ruleId: "waf:attack:pattern",
          ruleName: "Patrón de Ataque",
          action: "BLOCK",
          severity: "critical",
          blocked: true,
          reason: `Patrón de ataque detectado en la ruta: ${regex.source}`,
        };
    }
  }

  const queryString = typeof headers["x-query-string"] === "string"
    ? headers["x-query-string"]
    : "";

  if (queryString) {
    let decodedQuery = decodeURIComponent(queryString).toLowerCase();
    if (decodedQuery.includes("%")) {
      try {
        decodedQuery = decodeURIComponent(decodedQuery);
      } catch {}
    }
    for (const regex of compiledAttackPatterns) {
      if (regex.test(decodedQuery)) {
          return {
            ruleId: "waf:attack:query",
            ruleName: "Query String Malicioso",
            action: "BLOCK",
            severity: "critical",
            blocked: true,
            reason: "Patrón de ataque detectado en query string",
          };
      }
    }
  }

  return null;
}
