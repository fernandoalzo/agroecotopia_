import type { UserProfile, SignalResult, GeoInfo, AssessContext, WeightConfig } from "./types";
import { config } from "@/config/config";

const EARTH_RADIUS_KM = 6371;

function haversineDistance(a: GeoInfo, b: GeoInfo): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Evaluates all signals and returns an array of scored results.
 *
 * Each signal produces a score between 0 (normal) and 1 (anomalous),
 * which is then multiplied by its configured weight.
 */
export function evaluateSignals(
  profile: UserProfile | null,
  context: AssessContext,
  currentGeo: GeoInfo | null,
  weights: WeightConfig,
): SignalResult[] {
  const signals: SignalResult[] = [];

  // ── 1. Unknown IP ─────────────────────────────────────
  if (!profile || profile.totalLogins === 0) {
    signals.push({
      name: "unknownIp",
      score: 0.1,
      weight: weights.unknownIp,
      detail: "Primer inicio de sesión — perfil en construcción",
    });
  } else if (!profile.knownIps.includes(context.ip)) {
    signals.push({
      name: "unknownIp",
      score: 0.9,
      weight: weights.unknownIp,
      detail: `IP ${context.ip} no registrada en el historial del usuario`,
    });
  } else {
    signals.push({
      name: "unknownIp",
      score: 0,
      weight: weights.unknownIp,
      detail: "IP conocida",
    });
  }

  // ── 2. Geo anomaly ────────────────────────────────────
  if (profile?.lastGeo && currentGeo) {
    const distance = haversineDistance(profile.lastGeo, currentGeo);
    if (distance > 1000) {
      const detail = `Distancia desde último login: ${Math.round(distance)} km`;
      signals.push({
        name: "geoAnomaly",
        score: Math.min(distance / 20000, 1),
        weight: weights.geoAnomaly,
        detail,
      });
    } else {
      signals.push({
        name: "geoAnomaly",
        score: 0,
        weight: weights.geoAnomaly,
        detail: "Misma región geográfica",
      });
    }
  } else if (profile?.lastGeo && !currentGeo) {
    signals.push({
      name: "geoAnomaly",
      score: 0,
      weight: weights.geoAnomaly,
      detail: "Geo-IP no disponible para esta solicitud",
    });
  } else {
    signals.push({
      name: "geoAnomaly",
      score: 0,
      weight: weights.geoAnomaly,
      detail: "Sin datos de geolocalización previa",
    });
  }

  // ── 3. Time anomaly ───────────────────────────────────
  const currentHour = new Date(context.timestamp).getHours();
  if (profile && profile.hourBuckets.length >= 5) {
    const isKnownHour = profile.hourBuckets.includes(currentHour);
    if (!isKnownHour) {
      const knownRange = `${Math.min(...profile.hourBuckets)}:00–${Math.max(...profile.hourBuckets)}:00`;
      signals.push({
        name: "timeAnomaly",
        score: 0.8,
        weight: weights.timeAnomaly,
        detail: `Hora atípica (${currentHour}:00). Rango habitual: ${knownRange}`,
      });
    } else {
      signals.push({
        name: "timeAnomaly",
        score: 0,
        weight: weights.timeAnomaly,
        detail: "Hora dentro del rango habitual",
      });
    }
  } else {
    signals.push({
      name: "timeAnomaly",
      score: 0,
      weight: weights.timeAnomaly,
      detail: "Historial horario insuficiente (< 5 logins)",
    });
  }

  // ── 4. Device / User-Agent anomaly ────────────────────
  if (profile && profile.totalLogins > 0) {
    const uaFingerprint = normalizeUA(context.userAgent);
    const knownUA = profile.knownAgents.some((a) => normalizeUA(a) === uaFingerprint);
    if (!knownUA) {
      signals.push({
        name: "deviceAnomaly",
        score: 0.7,
        weight: weights.deviceAnomaly,
        detail: "Navegador o dispositivo no registrado",
      });
    } else {
      signals.push({
        name: "deviceAnomaly",
        score: 0,
        weight: weights.deviceAnomaly,
        detail: "Dispositivo conocido",
      });
    }
  } else {
    signals.push({
      name: "deviceAnomaly",
      score: 0.1,
      weight: weights.deviceAnomaly,
      detail: "Primer login — registrando dispositivo",
    });
  }

  // ── 5. IP reputation ──────────────────────────────────
  if (profile && profile.failedAttempts > 0) {
    const ratio = profile.failedAttempts / Math.max(profile.totalLogins, 1);
    signals.push({
      name: "ipReputation",
      score: Math.min(ratio, 1),
      weight: weights.ipReputation,
      detail: `Ratio de intentos fallidos: ${(ratio * 100).toFixed(0)}%`,
    });
  } else {
    signals.push({
      name: "ipReputation",
      score: 0,
      weight: weights.ipReputation,
      detail: "Sin intentos fallidos registrados",
    });
  }

  // ── 6. Velocity (multiple failures before success) ────
  if (profile && profile.failedAttempts >= 3) {
    signals.push({
      name: "velocity",
      score: Math.min(profile.failedAttempts / 10, 1),
      weight: weights.velocity,
      detail: `${profile.failedAttempts} intentos fallidos previos al éxito`,
    });
  } else {
    signals.push({
      name: "velocity",
      score: 0,
      weight: weights.velocity,
      detail: "Velocidad normal",
    });
  }

  return signals;
}

/**
 * Aggregates signal scores into a final risk score (0.0 – 1.0).
 */
export function aggregateScore(signals: SignalResult[]): number {
  const total = signals.reduce((sum, s) => sum + s.score * s.weight, 0);
  const weightSum = signals.reduce((sum, s) => sum + s.weight, 0);
  return weightSum > 0 ? total / weightSum : 0;
}

/**
 * Normalises a user-agent string to a coarse fingerprint
 * (browser family + OS + major version) for comparison.
 */
function normalizeUA(ua: string): string {
  const cleaned = ua
    .replace(/\s+/g, " ")
    .replace(/Chrome\/\d+/, "Chrome/XX")
    .replace(/Firefox\/\d+/, "Firefox/XX")
    .replace(/Safari\/\d+/, "Safari/XX")
    .replace(/Version\/\d+/, "Version/XX")
    .replace(/Edg\/\d+/, "Edg/XX")
    .replace(/OPR\/\d+/, "OPR/XX");
  return cleaned;
}

export { haversineDistance, normalizeUA };
