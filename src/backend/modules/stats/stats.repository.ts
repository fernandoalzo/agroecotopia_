import prisma from "@/backend/db/prisma";

export class StatsRepository {
  async getHomeStats() {
    const [users, posts, products] = await Promise.all([
      prisma.user.count(),
      prisma.forumPost.count(),
      prisma.product.count(),
    ]);

    return { users, posts, products };
  }
}
