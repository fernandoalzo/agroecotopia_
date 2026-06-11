import { redisClient } from "@/backend/cache/client";
import { StockGuardianService } from "./stockGuardian.service";

export const stockGuardianService = new StockGuardianService(redisClient);

export * from "./stockGuardian.service";
export * from "./stockGuardian.actions";
