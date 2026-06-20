import type { WafRequest, WafRuleResult, ParsedCidr } from "./types";

function ipToLong(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
}

export function parseCidr(cidr: string): ParsedCidr | null {
  let ip = cidr;
  let bits = 32;

  if (cidr.includes("/")) {
    const parts = cidr.split("/");
    if (parts.length !== 2) return null;
    ip = parts[0]!;
    bits = parseInt(parts[1]!, 10);
  }

  if (isNaN(bits) || bits < 0 || bits > 32) return null;

  const network = ipToLong(ip);
  const mask = bits === 0 ? 0 : ~(2 ** (32 - bits) - 1);

  return { network: network & mask, mask, original: cidr };
}

export function ipInParsedCidr(ip: string, parsed: ParsedCidr): boolean {
  const ipLong = ipToLong(ip);
  return (ipLong & parsed.mask) === parsed.network;
}

export function evaluateIpBlocklist(
  req: WafRequest,
  parsedCidrs: ParsedCidr[],
): WafRuleResult | null {
  if (parsedCidrs.length === 0) return null;

  for (const cidr of parsedCidrs) {
    if (ipInParsedCidr(req.ip, cidr)) {
      return {
        ruleId: "waf:ip:blocklist",
        ruleName: "IP Blocklist",
        action: "BLOCK",
        severity: "critical",
        blocked: true,
        reason: `IP ${req.ip} está en la lista negra (CIDR: ${cidr.original})`,
      };
    }
  }

  return null;
}

export function formatCidrList(cidrs: string[]): string[] {
  return cidrs.map((c) => c.trim()).filter((c) => c.length > 0);
}
