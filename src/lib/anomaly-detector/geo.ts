import type { GeoInfo } from "./types";
import logger from "@/utils/logger";

const log = logger.child("src/lib/anomaly-detector/geo.ts");

const geoCache = new Map<string, GeoInfo>();

/**
 * Resolves an IP address to geographic coordinates using ip-api.com.
 *
 * Results are cached in a local Map to avoid hitting the rate limit
 * (45 req/min on free tier) for repeated IPs within the same process.
 *
 * Graceful degradation: returns null on any failure — the scoring
 * engine handles null geo by scoring 0 for the geo signal.
 */
export async function lookupGeo(ip: string): Promise<GeoInfo | null> {
  if (!ip || ip === "unknown_ip" || ip === "127.0.0.1" || ip === "::1") {
    return null;
  }

  const cached = geoCache.get(ip);
  if (cached) return cached;

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon,country,city`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      log.warn("[geo] ip-api.com responded with status:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.status === "fail") {
      return null;
    }

    const geo: GeoInfo = {
      lat: data.lat,
      lng: data.lon,
      country: data.country || "",
      city: data.city || "",
    };

    geoCache.set(ip, geo);
    return geo;
  } catch (error) {
    log.debug("[geo] lookup failed for IP:", { ip, error });
    return null;
  }
}

export function clearGeoCache(): void {
  geoCache.clear();
}
