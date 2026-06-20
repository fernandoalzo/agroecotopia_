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
}
