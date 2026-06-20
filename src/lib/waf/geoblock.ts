import type { WafRequest, WafRuleResult, GeoIpResult } from "./types";

const geoCache = new Map<string, GeoIpResult>();

function isLocalIp(ip: string): boolean {
  return (
    !ip ||
    ip === "unknown_ip" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  );
}

export async function resolveGeo(ip: string): Promise<GeoIpResult | null> {
  if (isLocalIp(ip)) return null;

  const cached = geoCache.get(ip);
  if (cached) return cached;

  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,lat,lon`,
      { signal: AbortSignal.timeout(2000) },
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== "success") return null;

    const result: GeoIpResult = {
      country: data.countryCode || null,
      city: data.city || null,
      lat: data.lat,
      lon: data.lon,
    };

    geoCache.set(ip, result);
    return result;
  } catch {
    return null;
  }
}

export function evaluateGeoblock(
  req: WafRequest,
  blockedCountries: string[],
  country: string | null,
): WafRuleResult | null {
  if (!country || blockedCountries.length === 0) return null;



  if (blockedCountries.includes(country)) {
    return {
      ruleId: "waf:geo:block",
      ruleName: "Geoblock — Country Block",
      action: "BLOCK",
      severity: "high",
      blocked: true,
      reason: `País bloqueado: ${country}`,
    };
  }

  return null;
}

export function clearGeoCache(): void {
  geoCache.clear();
}
