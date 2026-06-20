import { z } from "zod";

export const WAF_RULE_TYPES = [
  "IP_BLOCKLIST",
  "GEO_BLOCK",
  "SENSITIVE_PATH",
  "METHOD_BLOCK",
  "BOT_BLOCK",
] as const;

export const wafRuleSchema = z.object({
  type: z.enum(WAF_RULE_TYPES, { message: "Selecciona un tipo de regla" }),
  value: z.string().min(1, "El valor no puede estar vacío").max(255),
  action: z.enum(["BLOCK", "ALLOW"]).default("BLOCK"),
  description: z.string().max(500).optional(),
  isEnabled: z.boolean().default(true),
  priority: z.coerce.number().int().min(0).max(999).default(0),
});

export type WafRuleFormValues = z.infer<typeof wafRuleSchema>;
