import type { WafRequest, WafRuleResult } from "./types";

export function evaluateBotDetection(
  req: WafRequest,
  botBlock: string[],
  botKnown: string[],
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
    if (ua.includes(scanner.toLowerCase())) {
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
    const isKnown = botKnown.some((b) => ua.includes(b.toLowerCase()));
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
  sensitivePaths: string[],
): WafRuleResult | null {
  const lowerPath = path.toLowerCase();
  const lowerRaw = rawUrl.toLowerCase();

  for (const sp of sensitivePaths) {
    const lowerSp = sp.toLowerCase();
    if (lowerPath.startsWith(lowerSp) || lowerRaw.startsWith(lowerSp)) {
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
  attackPatterns: string[],
): WafRuleResult | null {
  const decoded = decodeURIComponent(path).toLowerCase();

  for (const pattern of attackPatterns) {
    try {
      const regex = new RegExp(pattern, "i");
      if (regex.test(decoded)) {
        return {
          ruleId: "waf:attack:pattern",
          ruleName: "Patrón de Ataque",
          action: "BLOCK",
          severity: "critical",
          blocked: true,
          reason: `Patrón de ataque detectado en la ruta: ${pattern}`,
        };
      }
    } catch {
      continue;
    }
  }

  const queryString = typeof headers["x-query-string"] === "string"
    ? headers["x-query-string"]
    : "";

  if (queryString) {
    const decodedQuery = decodeURIComponent(queryString).toLowerCase();
    for (const pattern of attackPatterns) {
      try {
        const regex = new RegExp(pattern, "i");
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
      } catch {
        continue;
      }
    }
  }

  return null;
}
