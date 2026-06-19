import type { UserProfile, GeoInfo, AnomalyEvent, SignalResult } from "./types";
import { getRedisClient } from "./redis";
import logger from "@/utils/logger";

const log = logger.child("src/lib/anomaly-detector/store.ts");

const PROFILE_TTL = 7 * 24 * 60 * 60; // 7 days
const ANOMALY_STREAM_MAX = 500; // Max stored events in the admin stream

function profileKey(userId: string): string {
  return `anomaly:profile:${userId}`;
}

function anomalyStreamKey(): string {
  return "anomaly:events:admin";
}

/**
 * Loads the user's behaviour profile from Redis.
 * Returns null if no profile exists (new user or expired).
 */
export async function loadProfile(userId: string): Promise<UserProfile | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const raw = await redis.get(profileKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch (error) {
    log.error("[anomaly] Error loading profile:", { userId, error });
    return null;
  }
}

/**
 * Saves (or creates) the user's behaviour profile to Redis.
 * Extends TTL on every write.
 */
export async function saveProfile(profile: UserProfile, userId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.setex(profileKey(userId), PROFILE_TTL, JSON.stringify(profile));
  } catch (error) {
    log.error("[anomaly] Error saving profile:", { userId, error });
  }
}

/**
 * Updates the user profile with data from a new login event.
 * Mutates the profile object in place, then persists.
 */
export function updateProfile(
  profile: UserProfile,
  ip: string,
  geo: GeoInfo | null,
  userAgent: string,
  timestamp: number,
  failedAttempts: number,
): UserProfile {
  const hour = new Date(timestamp).getHours();

  if (!profile.knownIps.includes(ip)) {
    profile.knownIps.push(ip);
  }
  profile.lastIp = ip;
  if (geo) profile.lastGeo = geo;
  if (!profile.hourBuckets.includes(hour)) {
    profile.hourBuckets.push(hour);
    profile.hourBuckets.sort((a, b) => a - b);
  }
  if (!profile.knownAgents.includes(userAgent)) {
    profile.knownAgents.push(userAgent);
  }
  profile.totalLogins += 1;
  profile.failedAttempts = Math.max(0, failedAttempts);
  profile.lastLogin = timestamp;
  profile.updatedAt = timestamp;

  return profile;
}

/**
 * Creates a fresh profile for a first-time user.
 */
export function createProfile(
  ip: string,
  geo: GeoInfo | null,
  userAgent: string,
  timestamp: number,
): UserProfile {
  return {
    knownIps: [ip],
    lastIp: ip,
    lastGeo: geo,
    hourBuckets: [new Date(timestamp).getHours()],
    knownAgents: [userAgent],
    totalLogins: 1,
    failedAttempts: 0,
    lastLogin: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Increments the failed attempt counter for a user profile.
 */
export async function incrementFailedAttempts(userId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const raw = await redis.get(profileKey(userId));
    if (!raw) return;

    const profile: UserProfile = JSON.parse(raw);
    profile.failedAttempts = (profile.failedAttempts || 0) + 1;
    profile.updatedAt = Date.now();

    await redis.setex(profileKey(userId), PROFILE_TTL, JSON.stringify(profile));
  } catch (error) {
    log.error("[anomaly] Error incrementing failed attempts:", { userId, error });
  }
}

/**
 * Persists an anomaly event to the admin stream (Redis list).
 * Trims to ANOMALY_STREAM_MAX to prevent unbounded growth.
 */
export async function pushAnomalyEvent(event: AnomalyEvent): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = anomalyStreamKey();
    await redis.lpush(key, JSON.stringify(event));
    await redis.ltrim(key, 0, ANOMALY_STREAM_MAX - 1);
    await redis.expire(key, 14 * 24 * 60 * 60); // 14 day TTL on stream
  } catch (error) {
    log.error("[anomaly] Error pushing anomaly event:", error);
  }
}

/**
 * Retrieves recent anomaly events for the admin dashboard.
 */
export async function getAnomalyEvents(limit = 50): Promise<AnomalyEvent[]> {
  const redis = getRedisClient();
  if (!redis) return [];

  try {
    const raw = await redis.lrange(anomalyStreamKey(), 0, limit - 1);
    return raw.map((r) => JSON.parse(r) as AnomalyEvent);
  } catch (error) {
    log.error("[anomaly] Error fetching anomaly events:", error);
    return [];
  }
}
