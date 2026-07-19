import { StatsRepository } from "./stats.repository";
import { StatsService } from "./stats.service";
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();
export const statsRepository = new StatsRepository(cacheService);
export const statsService = new StatsService(statsRepository);

