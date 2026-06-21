import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";
import type { WafRuleType as PrismaWafRuleType } from "@prisma/client";
import { CacheKeys, type CacheService } from "@/backend/cache";
import { config } from "@/config/config";

export type WafRuleType = PrismaWafRuleType;

const log = logger.child("src/backend/modules/waf/waf.repository.ts");

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

export class WafRepository {
  constructor(private cacheService?: CacheService) {}

  async findAll(): Promise<WafRuleRow[]> {
    const key = CacheKeys.waf.allRules;
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Obteniendo todas las reglas WAF");
        return prisma.wafRule.findMany({ orderBy: [{ type: "asc" }, { priority: "asc" }] });
      },
      config.cache?.ttl?.productDetail || 300 // default fallback
    ) ?? prisma.wafRule.findMany({ orderBy: [{ type: "asc" }, { priority: "asc" }] });
  }

  async findActiveRules(): Promise<WafRuleRow[]> {
    const key = CacheKeys.waf.activeRules;
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Obteniendo reglas WAF activas");
        return prisma.wafRule.findMany({
          where: { isEnabled: true },
          orderBy: [{ priority: "asc" }],
        });
      },
      config.cache?.ttl?.productDetail || 300
    ) ?? prisma.wafRule.findMany({
      where: { isEnabled: true },
      orderBy: [{ priority: "asc" }],
    });
  }

  async findByType(type: WafRuleType): Promise<WafRuleRow[]> {
    const key = CacheKeys.waf.byType(type);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Obteniendo reglas WAF por tipo:", { type });
        return prisma.wafRule.findMany({
          where: { type },
          orderBy: [{ priority: "asc" }],
        });
      },
      config.cache?.ttl?.productDetail || 300
    ) ?? prisma.wafRule.findMany({
      where: { type },
      orderBy: [{ priority: "asc" }],
    });
  }

  async create(data: WafRuleData): Promise<WafRuleRow> {
    log.info("[db] Creando regla WAF:", { type: data.type, value: data.value });
    const rule = await prisma.wafRule.create({
      data: {
        type: data.type,
        value: data.value,
        action: data.action ?? "BLOCK",
        description: data.description ?? null,
        isEnabled: data.isEnabled ?? true,
        priority: data.priority ?? 0,
      },
    });
    await this.cacheService?.delPattern(CacheKeys.waf.allPattern);
    return rule;
  }

  async update(id: string, data: Partial<WafRuleData>): Promise<WafRuleRow> {
    log.info("[db] Actualizando regla WAF:", { id });
    const rule = await prisma.wafRule.update({ where: { id }, data });
    await this.cacheService?.delPattern(CacheKeys.waf.allPattern);
    return rule;
  }

  async delete(id: string): Promise<void> {
    log.info("[db] Eliminando regla WAF:", { id });
    await prisma.wafRule.delete({ where: { id } });
    await this.cacheService?.delPattern(CacheKeys.waf.allPattern);
  }

  async toggleEnabled(id: string): Promise<WafRuleRow> {
    log.info("[db] Alternando estado de regla WAF:", { id });
    const rule = await prisma.wafRule.findUniqueOrThrow({ where: { id } });
    const updated = await prisma.wafRule.update({
      where: { id },
      data: { isEnabled: !rule.isEnabled },
    });
    await this.cacheService?.delPattern(CacheKeys.waf.allPattern);
    return updated;
  }
}
