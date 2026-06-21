// Source: src/backend/modules/waf/waf.repository.ts

export type WafRuleType =
  | "IP_BLOCKLIST"
  | "GEO_BLOCK"
  | "SENSITIVE_PATH"
  | "METHOD_BLOCK"
  | "BOT_BLOCK"
  | "BOT_KNOWN"
  | "BOT_EMPTY_UA"
  | "ATTACK_PATTERN";

export interface WafRuleData {
  type: WafRuleType;
  value: string;
  action?: string;
  description?: string;
  isEnabled?: boolean;
  priority?: number;
}

export interface WafRuleRow {
  id: string;
  type: WafRuleType;
  value: string;
  action: string;
  description: string | null;
  isEnabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}
