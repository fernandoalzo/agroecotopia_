export type AnomalyMode = "disabled" | "monitor" | "enforce";

export type AnomalyAction = "ALLOW" | "SUSPECT" | "BLOCK";

export interface AssessContext {
  ip: string;
  userAgent: string;
  timestamp: number;
}

export interface UserProfile {
  knownIps: string[];
  lastIp: string;
  lastGeo: GeoInfo | null;
  hourBuckets: number[];
  knownAgents: string[];
  totalLogins: number;
  failedAttempts: number;
  lastLogin: number;
  updatedAt: number;
}

export interface GeoInfo {
  lat: number;
  lng: number;
  country: string;
  city: string;
}

export interface AssessResult {
  score: number;
  action: AnomalyAction;
  mode: AnomalyMode;
  signals: SignalResult[];
  userId: string;
  ip: string;
  timestamp: number;
}

export interface SignalResult {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

export interface AnomalyEvent {
  id: string;
  userId: string;
  email: string;
  ip: string;
  userAgent: string;
  score: number;
  action: AnomalyAction;
  signals: SignalResult[];
  timestamp: number;
  country?: string;
  city?: string;
}

export interface WeightConfig {
  unknownIp: number;
  geoAnomaly: number;
  timeAnomaly: number;
  deviceAnomaly: number;
  ipReputation: number;
  velocity: number;
}
