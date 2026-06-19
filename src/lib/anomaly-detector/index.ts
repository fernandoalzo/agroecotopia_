import { config } from "@/config/config";
import logger from "@/utils/logger";
import { getRedisClient } from "./redis";
import { lookupGeo } from "./geo";
import { evaluateSignals, aggregateScore } from "./scorer";
import {
  loadProfile,
  saveProfile,
  updateProfile,
  createProfile,
  pushAnomalyEvent,
  incrementFailedAttempts,
} from "./store";
import type {
  AssessContext,
  AssessResult,
  AnomalyMode,
  AnomalyAction,
  AnomalyEvent,
} from "./types";

const log = logger.child("src/lib/anomaly-detector/index.ts");

/**
 * AnomalyDetectionEngine
 *
 * Evaluates login behaviour in real time to detect account takeover
 * attempts. Three modes:
 *
 *   disabled → completely bypassed, zero overhead.
 *   monitor  → scores, stores, notifies — NEVER denies access.
 *   enforce  → scores, stores, notifies — DENIES access above threshold.
 *
 * Fail-open: if Redis is unavailable the engine silently allows all
 * logins and logs a warning.
 */
export class AnomalyDetector {
  private mode: AnomalyMode;
  private ready = false;

  constructor() {
    this.mode = config.security.anomalyDetection.mode;

    if (this.mode === "disabled") {
      log.info("[anomaly] Engine DISABLED by configuration");
      return;
    }

    if (!getRedisClient()) {
      log.warn("[anomaly] Redis no disponible — engine desactivado (fail-open)");
      return;
    }

    this.ready = true;
    log.info("[anomaly] Engine INITIALIZED en modo:", { mode: this.mode });
  }

  /**
   * Evaluates a login attempt and returns an assessment result.
   *
   * Safe to call on every login — returns immediately with a
   * low-cost result if the engine is not ready.
   */
  async assess(
    userId: string,
    email: string,
    context: AssessContext,
  ): Promise<AssessResult> {
    if (!this.ready) {
      return this.fallbackResult(userId, context.ip);
    }

    const start = performance.now();

    try {
      // 1. Load profile from Redis
      const profile = await loadProfile(userId);

      // 2. Resolve geo (optional, best-effort)
      const geo = config.security.anomalyDetection.geoIp.enabled
        ? await lookupGeo(context.ip)
        : null;

      // 3. Score signals
      const signals = evaluateSignals(
        profile,
        context,
        geo,
        config.security.anomalyDetection.weights,
      );

      const score = aggregateScore(signals);

      // 4. Classify
      const action = this.classify(score);

      const elapsed = performance.now() - start;
      log.debug("[anomaly] Assessment complete", {
        userId,
        score: score.toFixed(3),
        action,
        mode: this.mode,
        signals: signals.filter((s) => s.score > 0).length,
        elapsed: `${elapsed.toFixed(0)}ms`,
      });

      // 5. Persist updated profile
      const updatedProfile = profile
        ? updateProfile(profile, context.ip, geo, context.userAgent, context.timestamp, 0)
        : createProfile(context.ip, geo, context.userAgent, context.timestamp);

      await saveProfile(updatedProfile, userId);

      // 6. Store anomaly event if suspect or blocked
      if (action === "SUSPECT" || action === "BLOCK") {
        const event: AnomalyEvent = {
          id: `${userId}_${context.timestamp}`,
          userId,
          email,
          ip: context.ip,
          userAgent: context.userAgent,
          score,
          action,
          signals,
          timestamp: context.timestamp,
          country: geo?.country,
          city: geo?.city,
        };
        await pushAnomalyEvent(event);

        log.warn("[anomaly] Evento registrado", {
          userId,
          email,
          score: score.toFixed(3),
          action,
          ip: context.ip,
          country: geo?.country,
        });
      }

      return {
        score,
        action: this.resolveAction(action),
        mode: this.mode,
        signals,
        userId,
        ip: context.ip,
        timestamp: context.timestamp,
      };
    } catch (error) {
      log.error("[anomaly] Engine error — allowing login (fail-open):", error);
      return this.fallbackResult(userId, context.ip);
    }
  }

  /**
   * Records a failed login attempt in the user profile.
   */
  async recordFailure(userId: string): Promise<void> {
    if (!this.ready) return;
    await incrementFailedAttempts(userId);
  }

  /**
   * Reports whether the engine is active and scoring.
   */
  isActive(): boolean {
    return this.ready;
  }

  // ── Private helpers ──────────────────────────────────

  private classify(score: number): AnomalyAction {
    const thresholds = config.security.anomalyDetection.thresholds;
    if (score >= thresholds.block) return "BLOCK";
    if (score >= thresholds.suspect) return "SUSPECT";
    return "ALLOW";
  }

  /**
   * In monitor mode, BLOCK actions are downgraded to SUSPECT
   * so the login is never denied.
   */
  private resolveAction(action: AnomalyAction): AnomalyAction {
    if (this.mode === "monitor" && action === "BLOCK") return "SUSPECT";
    return action;
  }

  private fallbackResult(userId: string, ip: string): AssessResult {
    return {
      score: 0,
      action: "ALLOW",
      mode: this.mode,
      signals: [],
      userId,
      ip,
      timestamp: Date.now(),
    };
  }
}

/** Singleton exported for convenience */
export const anomalyDetector = new AnomalyDetector();
