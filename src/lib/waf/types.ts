export type WafMode = "disabled" | "monitor" | "enforce";

export type WafAction = "ALLOW" | "BLOCK" | "CHALLENGE";

export interface WafRequest {
  ip: string;
  method: string;
  path: string;
  rawUrl: string;
  userAgent: string;
  headers: Record<string, string | string[] | undefined>;
  country?: string;
}

export interface WafRuleResult {
  ruleId: string;
  ruleName: string;
  action: WafAction;
  severity: string;
  blocked: boolean;
  reason: string;
}

export interface WafResult {
  action: WafAction;
  blocked: boolean;
  reason: string;
  ruleResults: WafRuleResult[];
  elapsedMs: number;
}

export interface GeoIpResult {
  country: string | null;
  city: string | null;
  lat: number;
  lon: number;
}

export interface WafRateLimitConfig {
  id: string;
  path: string;
  points: number;
  duration: number;
  blockDuration: number;
}

export interface WafConfig {
  mode: WafMode;
  ipBlocklist: string[];
  geoBlocked: string[];
  sensitivePaths: string[];
  blockedMethods: string[];
  botBlock: string[];
  botKnown: string[];
  blockEmptyUserAgent: boolean;
  attackPatterns: string[];
  rateLimit: WafRateLimitConfig[];
}

export interface DbRules {
  ipBlocklist: string[];
  geoBlocked: string[];
  sensitivePaths: string[];
  blockedMethods: string[];
  botBlock: string[];
  botKnown: string[];
  blockEmptyUserAgent: boolean;
  attackPatterns: string[];
  rateLimit: WafRateLimitConfig[];
}

export interface ParsedCidr {
  network: number;
  mask: number;
  original: string;
}

export interface CompiledWafConfig extends WafConfig {
  compiledIpBlocklist: ParsedCidr[];
  botBlockSet: Set<string>;
  botKnownSet: Set<string>;
  blockedMethodsSet: Set<string>;
  sensitivePathsLower: string[];
  compiledAttackPatterns: RegExp[];
  compiledRateLimits: (WafRateLimitConfig & { compiledPathRegex: RegExp })[];
}
