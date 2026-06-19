import type { WafRequest, WafRuleResult } from "./types";

function ipToLong(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
}

export function parseCidr(cidr: string): { network: number; mask: number } | null {
  const parts = cidr.split("/");
  if (parts.length !== 2) return null;

  const ip = parts[0]!;
  const bits = parseInt(parts[1]!, 10);

  if (isNaN(bits) || bits < 0 || bits > 32) return null;

  const network = ipToLong(ip);
  const mask = ~(2 ** (32 - bits) - 1);

  return { network: network & mask, mask };
}

export function ipInCidr(ip: string, cidr: string): boolean {
  const parsed = parseCidr(cidr);
  if (!parsed) return false;

  const ipLong = ipToLong(ip);
  return (ipLong & parsed.mask) === parsed.network;
}

export function evaluateIpBlocklist(
  req: WafRequest,
  cidrs: string[],
): WafRuleResult | null {
  if (cidrs.length === 0) return null;

  for (const cidr of cidrs) {
    if (ipInCidr(req.ip, cidr)) {
      return {
        ruleId: "waf:ip:blocklist",
        ruleName: "IP Blocklist",
        action: "BLOCK",
        severity: "critical",
        blocked: true,
        reason: `IP ${req.ip} está en la lista negra (CIDR: ${cidr})`,
      };
    }
  }

  return null;
}

export function formatCidrList(cidrs: string[]): string[] {
  return cidrs.map((c) => c.trim()).filter((c) => c.length > 0 && c.includes("/"));
}
