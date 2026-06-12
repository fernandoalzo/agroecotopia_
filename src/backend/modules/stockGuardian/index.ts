import { redisClient } from "@/backend/cache/client";
import { StockGuardianRepository } from "./stockGuardian.repository";
import { StockGuardianService } from "./stockGuardian.service";

export const stockGuardianRepository = new StockGuardianRepository();
export const stockGuardianService = new StockGuardianService(
  redisClient,
  stockGuardianRepository
);

export * from "./stockGuardian.service";
export * from "./stockGuardian.actions";
