import { WafRepository, type WafRuleRow, type WafRuleData } from "./waf.repository";
import type { WafRuleType } from "./waf.repository";
import logger from "@/utils/logger";
import { waf } from "@/lib/waf";

const log = logger.child("src/backend/modules/waf/waf.service.ts");

const VALID_TYPES: WafRuleType[] = [
  "IP_BLOCKLIST", "GEO_BLOCK",
  "SENSITIVE_PATH", "METHOD_BLOCK", "BOT_BLOCK",
  "BOT_KNOWN", "BOT_EMPTY_UA", "ATTACK_PATTERN",
];

export class WafService {
  constructor(private repository: WafRepository) {}

  async listAll(): Promise<WafRuleRow[]> {
    return this.repository.findAll();
  }

  async listByType(type: WafRuleType): Promise<WafRuleRow[]> {
    return this.repository.findByType(type);
  }

  async create(data: WafRuleData): Promise<WafRuleRow> {
    if (!VALID_TYPES.includes(data.type)) {
      throw new Error(`Tipo de regla inválido: ${data.type}`);
    }

    if (!data.value || data.value.trim().length === 0) {
      throw new Error("El valor de la regla no puede estar vacío");
    }

    if (data.type === "SENSITIVE_PATH") {
      const val = data.value.startsWith("/") ? data.value : `/${data.value}`;
      data.value = val;
    }

    const rule = await this.repository.create(data);
    await this.reloadWaf();
    return rule;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
    await this.reloadWaf();
  }

  async toggle(id: string): Promise<WafRuleRow> {
    const rule = await this.repository.toggleEnabled(id);
    await this.reloadWaf();
    return rule;
  }

  async update(id: string, data: Partial<WafRuleData>): Promise<WafRuleRow> {
    const rule = await this.repository.update(id, data);
    await this.reloadWaf();
    return rule;
  }

  public async reloadWaf(): Promise<void> {
    const rules = await this.repository.findActiveRules();
    const db: Parameters<typeof waf.updateDbRules>[0] = {
      ipBlocklist: rules.filter((r) => r.type === "IP_BLOCKLIST").map((r) => r.value),
      geoBlocked: rules.filter((r) => r.type === "GEO_BLOCK").map((r) => r.value),
      sensitivePaths: rules.filter((r) => r.type === "SENSITIVE_PATH").map((r) => r.value),
      blockedMethods: rules.filter((r) => r.type === "METHOD_BLOCK").map((r) => r.value.toUpperCase()),
      botBlock: rules.filter((r) => r.type === "BOT_BLOCK").map((r) => r.value),
      botKnown: rules.filter((r) => r.type === "BOT_KNOWN").map((r) => r.value),
      blockEmptyUserAgent: rules.some((r) => r.type === "BOT_EMPTY_UA"),
      attackPatterns: rules.filter((r) => r.type === "ATTACK_PATTERN").map((r) => r.value),
    };

    waf.updateDbRules(db);

    log.info("🛡️ [waf] Reglas de seguridad sincronizadas en memoria:", {
      ipBlocklist: db.ipBlocklist.length,
      geoBlocked: db.geoBlocked.length,
      sensitivePaths: db.sensitivePaths.length,
      blockedMethods: db.blockedMethods.length,
      botBlock: db.botBlock.length,
      botKnown: db.botKnown.length,
      blockEmptyUserAgent: db.blockEmptyUserAgent,
      attackPatterns: db.attackPatterns.length,
    });
  }
}
