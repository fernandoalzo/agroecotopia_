import { WafRepository } from "./waf.repository";
import { WafService } from "./waf.service";
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();
export const wafRepository = new WafRepository(cacheService);
export const wafService = new WafService(wafRepository);

export type { WafRuleRow, WafRuleData, WafRuleType } from "./waf.repository";
