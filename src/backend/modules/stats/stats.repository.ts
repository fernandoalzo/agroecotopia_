import prisma from "@/backend/db/prisma";
import { CacheService, CacheKeys } from "@/backend/cache";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child();

export class StatsRepository {
  constructor(private readonly cacheService?: CacheService) {}

  async getHomeStats() {
    const key = CacheKeys.forum.communityStats;
    const fetcher = async () => {
      log.debug("[db] Consultando estadísticas globales de la plataforma.");
      const [users, posts, products] = await Promise.all([
        prisma.user.count(),
        prisma.forumPost.count(),
        prisma.product.count(),
      ]);
      return { users, posts, products };
    };

    return this.cacheService?.getOrSet(
      key,
      fetcher,
      config.cache.ttl.forumCommunityStats,
    ) ?? fetcher();
  }
}
