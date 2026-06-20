"use server";

import { wafService } from "./index";
import { withAdmin } from "@/lib/auth-guards";
import type { WafRuleData, WafRuleType } from "./waf.repository";
import { revalidatePath } from "next/cache";
import logger from "@/utils/logger";
import { getEntries, clear } from "@/lib/waf/request-buffer";
import { config } from "@/config/config";

const log = logger.child("src/backend/modules/waf/waf.actions.ts");

export async function getWafRequestLog(count?: number) {
  return withAdmin(async () => {
    const entries = getEntries(count);
    return {
      success: true,
      entries,
      maxVisible: config.security.waf.monitor.maxVisible,
    };
  });
}

export async function clearWafRequestLog() {
  return withAdmin(async () => {
    clear();
    return { success: true };
  });
}

export async function getWafRules() {
  return withAdmin(async () => {
    log.info("Obteniendo todas las reglas WAF");
    const rules = await wafService.listAll();
    return { success: true, rules };
  });
}

export async function getWafRulesByType(type: string) {
  return withAdmin(async () => {
    const rules = await wafService.listByType(type as WafRuleType);
    return { success: true, rules };
  });
}

export async function createWafRule(data: WafRuleData) {
  return withAdmin(async () => {
    try {
      const rule = await wafService.create({
        type: data.type as WafRuleType,
        value: data.value,
        action: data.action,
        description: data.description,
        isEnabled: data.isEnabled,
        priority: data.priority,
      });
      revalidatePath("/admin/seguridad");
      log.info("Regla WAF creada:", { id: rule.id, type: rule.type, value: rule.value });
      return { success: true, rule };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      log.warn("Error creando regla WAF:", { error: message });
      return { success: false, error: message };
    }
  });
}

export async function deleteWafRule(id: string) {
  return withAdmin(async () => {
    try {
      await wafService.delete(id);
      revalidatePath("/admin/seguridad");
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      return { success: false, error: message };
    }
  });
}

export async function toggleWafRule(id: string) {
  return withAdmin(async () => {
    try {
      const rule = await wafService.toggle(id);
      revalidatePath("/admin/seguridad");
      return { success: true, rule };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      return { success: false, error: message };
    }
  });
}
