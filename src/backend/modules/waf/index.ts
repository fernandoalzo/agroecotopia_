import { WafRepository } from "./waf.repository";
import { WafService } from "./waf.service";

export const wafRepository = new WafRepository();
export const wafService = new WafService(wafRepository);

export type { WafRuleRow, WafRuleData, WafRuleType } from "./waf.repository";
