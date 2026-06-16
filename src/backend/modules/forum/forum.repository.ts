import prisma from "@/backend/db/prisma";
import { Prisma } from "@prisma/client";
import { CacheService, CacheKeys } from "@/backend/cache";
import { orderByIds } from "@/backend/modules/shared/embedding";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child();

type FiltersJSON = Record<string, string[]>;

export class ForumRepository {
  constructor(private cacheService?: CacheService) {}

  private async invalidateCache(): Promise<void> {
    await this.cacheService?.delPattern(CacheKeys.forum.allPattern);
  }

  private serializeFilters(filters: FiltersJSON | undefined): string {
    if (!filters || Object.keys(filters).length === 0) return "";
    return Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v.sort().join(",")}`)
      .join("|");
  }

  async createPost(data: { title: string; body: string; labels: string[] }, authorId: string) {
    try {
      const post = await prisma.forumPost.create({
        data: { title: data.title, body: data.body, labels: data.labels, authorId },
        include: {
          author: { select: { id: true, name: true, image: true, role: true } },
        },
      });
      await this.invalidateCache();
      return post;
    } catch (error) {
      log.error("Error creating post in repository:", error);
      throw new Error("Failed to create post.");
    }
  }

  async getPosts(activeFilters?: FiltersJSON, searchQuery?: string, limit: number = 10, cursor?: string, sortBy?: "newest" | "popular") {
    const filtersStr = this.serializeFilters(activeFilters);
    const key = CacheKeys.forum.posts(filtersStr, searchQuery ?? "", limit, cursor, sortBy ?? "newest");

    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Obteniendo posts del foro:", { filters: activeFilters, searchQuery, limit, cursor, sortBy });
        const where: Prisma.ForumPostWhereInput = {};

        const andConditions: Prisma.ForumPostWhereInput[] = [];

        if (searchQuery && searchQuery.trim() !== "") {
          const terms = searchQuery.trim().split(/\s+/);
          terms.forEach(term => {
            andConditions.push({
              OR: [
                { title: { contains: term, mode: "insensitive" as const } },
                { body: { contains: term, mode: "insensitive" as const } },
              ],
            });
          });
        }

        if (activeFilters && Object.keys(activeFilters).length > 0) {
          for (const [, selectedLabels] of Object.entries(activeFilters)) {
            if (selectedLabels.length > 0) {
              andConditions.push({ labels: { hasSome: selectedLabels } });
            }
          }
        }

        if (andConditions.length > 0) {
          where.AND = andConditions;
        }

        const orderBy: Prisma.ForumPostOrderByWithRelationInput | Prisma.ForumPostOrderByWithRelationInput[] =
          sortBy === "popular"
            ? [{ ratingTotal: "desc" }, { createdAt: "desc" }]
            : { createdAt: "desc" };

        const [posts, totalCount] = await prisma.$transaction([
          prisma.forumPost.findMany({
            where,
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy,
            include: {
              author: { select: { id: true, name: true, image: true, role: true } },
              _count: { select: { answers: true } },
            },
          }),
          prisma.forumPost.count({ where }),
        ]);

        let nextCursor: string | undefined;
        if (posts.length > limit) {
          const nextItem = posts.pop();
          nextCursor = nextItem?.id;
        }

        return { posts, nextCursor, totalCount };
      },
      config.cache.ttl.forumPosts,
    ) ?? { posts: [], nextCursor: undefined, totalCount: 0 };
  }

  async getPostById(id: string) {
    const key = CacheKeys.forum.byId(id);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Buscando post por id:", { id });
        return prisma.forumPost.findUnique({
          where: { id },
          include: {
            author: { select: { id: true, name: true, image: true, role: true } },
            answers: {
              include: {
                author: { select: { id: true, name: true, image: true, role: true } },
              },
              orderBy: [
                { isAccepted: "desc" },
                { ratingTotal: "desc" },
                { createdAt: "asc" },
              ],
            },
          },
        });
      },
      config.cache.ttl.forumPostDetail,
    ) ?? null;
  }

  async getPostsByIds(ids: string[], labels?: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    const where: Prisma.ForumPostWhereInput = { id: { in: ids } };
    if (labels?.length) {
      where.labels = { hasSome: labels };
    }
    const posts = await prisma.forumPost.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        _count: { select: { answers: true } },
      },
    });
    return orderByIds(posts, ids);
  }

  async deletePost(id: string) {
    try {
      const post = await prisma.forumPost.delete({ where: { id } });
      await this.invalidateCache();
      return post;
    } catch (error) {
      log.error(`Error deleting post in repository:`, error);
      throw new Error("Failed to delete post.");
    }
  }

  async createAnswer(data: { content: string; postId: string; parentId?: string | null }, authorId: string) {
    try {
      const answer = await prisma.forumAnswer.create({
        data: {
          content: data.content,
          postId: data.postId,
          parentId: data.parentId ?? null,
          authorId,
        },
        include: {
          author: { select: { id: true, name: true, image: true, role: true } },
        },
      });
      await this.invalidateCache();
      return answer;
    } catch (error) {
      log.error("Error creating answer in repository:", error);
      throw new Error("Failed to create answer.");
    }
  }

  async getAnswerById(id: string) {
    const key = CacheKeys.forum.answerById(id);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Buscando answer por id:", { id });
        return prisma.forumAnswer.findUnique({ where: { id } });
      },
      config.cache.ttl.forumAnswerDetail,
    ) ?? null;
  }

  async updateAnswer(id: string, content: string) {
    try {
      const answer = await prisma.forumAnswer.update({
        where: { id },
        data: { content },
        include: {
          author: { select: { id: true, name: true, image: true, role: true } },
        },
      });
      await this.invalidateCache();
      return answer;
    } catch (error) {
      log.error(`Error updating answer in repository:`, error);
      throw new Error("Failed to update answer.");
    }
  }

  async updateAnswerAccepted(id: string, accepted: boolean) {
    try {
      const answer = await prisma.forumAnswer.update({
        where: { id },
        data: { isAccepted: accepted },
        include: {
          author: { select: { id: true, name: true, image: true, role: true } },
        },
      });
      await this.invalidateCache();
      return answer;
    } catch (error) {
      log.error(`Error updating answer accepted in repository:`, error);
      throw new Error("Failed to update answer acceptance.");
    }
  }

  async updatePost(id: string, data: { title?: string; body?: string; labels?: string[] }) {
    try {
      const post = await prisma.forumPost.update({
        where: { id },
        data,
        include: {
          author: { select: { id: true, name: true, image: true, role: true } },
        },
      });
      await this.invalidateCache();
      return post;
    } catch (error) {
      log.error(`Error updating post in repository:`, error);
      throw new Error("Failed to update post.");
    }
  }

  async deleteAnswer(id: string) {
    try {
      const answer = await prisma.forumAnswer.delete({ where: { id } });
      await this.invalidateCache();
      return answer;
    } catch (error) {
      log.error(`Error deleting answer in repository:`, error);
      throw new Error("Failed to delete answer.");
    }
  }

  async countAnswerReplies(id: string): Promise<number> {
    try {
      return prisma.forumAnswer.count({ where: { parentId: id } });
    } catch (error) {
      log.error(`Error counting replies for answer ${id}:`, error);
      throw new Error("Failed to count answer replies.");
    }
  }

  async getDirectReplies(answerId: string): Promise<{ id: string; authorId: string }[]> {
    try {
      return prisma.forumAnswer.findMany({
        where: { parentId: answerId },
        select: { id: true, authorId: true },
      });
    } catch (error) {
      log.error(`Error fetching direct replies for answer ${answerId}:`, error);
      throw new Error("Failed to fetch direct replies.");
    }
  }

  async rateItem(userId: string, itemId: string, itemType: "post" | "answer", value: number) {
    try {
      if (value === 0) {
        const where = itemType === "post"
          ? { userId_postId: { userId, postId: itemId } }
          : { userId_answerId: { userId, answerId: itemId } };
        try {
          await prisma.forumRating.delete({ where });
        } catch {
          // Rating doesn't exist — ignore
        }
      } else {
        await prisma.forumRating.upsert({
          where: itemType === "post"
            ? { userId_postId: { userId, postId: itemId } }
            : { userId_answerId: { userId, answerId: itemId } },
          create: {
            userId,
            value,
            postId: itemType === "post" ? itemId : null,
            answerId: itemType === "answer" ? itemId : null,
          },
          update: { value },
        });
      }

      if (itemType === "post") {
        const aggr = await prisma.forumRating.aggregate({
          where: { postId: itemId },
          _sum: { value: true },
          _count: { id: true },
        });
        await prisma.forumPost.update({
          where: { id: itemId },
          data: { ratingTotal: aggr._sum.value || 0, ratingCount: aggr._count.id || 0 },
        });
      } else {
        const aggr = await prisma.forumRating.aggregate({
          where: { answerId: itemId },
          _sum: { value: true },
          _count: { id: true },
        });
        await prisma.forumAnswer.update({
          where: { id: itemId },
          data: { ratingTotal: aggr._sum.value || 0, ratingCount: aggr._count.id || 0 },
        });
      }

      await this.invalidateCache();

      return { success: true };
    } catch (error) {
      log.error("Error rating item in repository:", error);
      throw new Error("Failed to rate item.");
    }
  }

  async getCommunityStats() {
    return this.cacheService?.getOrSet(
      CacheKeys.forum.communityStats,
      async () => {
        log.debug("[db] Obteniendo community stats desde PostgreSQL");
        const activePosters = await prisma.forumPost.findMany({
          select: { authorId: true },
          distinct: ["authorId"],
        });

        const activeAnswerers = await prisma.forumAnswer.findMany({
          select: { authorId: true },
          distinct: ["authorId"],
        });

        const uniqueActiveMembers = new Set([
          ...activePosters.map(p => p.authorId),
          ...activeAnswerers.map(a => a.authorId),
        ]);

        const totalMembers = uniqueActiveMembers.size;
        const onlineNow = Math.min(Math.floor(totalMembers * 0.1) + 15, totalMembers);

        return { totalMembers, onlineNow };
      },
      config.cache.ttl.forumCommunityStats,
    ) ?? { totalMembers: 0, onlineNow: 0 };
  }

  async getTopContributors() {
    return this.cacheService?.getOrSet(
      CacheKeys.forum.topContributors,
      async () => {
        log.debug("[db] Obteniendo top contributors desde PostgreSQL");
        const rankedUsers = await prisma.$queryRaw<
          Array<{ id: string; name: string | null; image: string | null; role: string; points: number }>
        >`
          SELECT 
            u.id, u.name, u.image, CAST(u.role AS TEXT) as role,
            (COALESCE(p.post_count, 0) * 10 + COALESCE(a.answer_count, 0) * 5) as points
          FROM "User" u
          LEFT JOIN (
            SELECT "authorId", COUNT(id) as post_count FROM "ForumPost" GROUP BY "authorId"
          ) p ON u.id = p."authorId"
          LEFT JOIN (
            SELECT "authorId", COUNT(id) as answer_count FROM "ForumAnswer" GROUP BY "authorId"
          ) a ON u.id = a."authorId"
          WHERE (COALESCE(p.post_count, 0) > 0 OR COALESCE(a.answer_count, 0) > 0)
          ORDER BY points DESC
          LIMIT 3;
        `;

        return rankedUsers.map(u => ({
          id: u.id,
          name: u.name || "Usuario",
          image: u.image,
          role: u.role,
          points: Number(u.points),
        }));
      },
      config.cache.ttl.forumTopContributors,
    ) ?? [];
  }

  async getTrendingLabels(limit: number = 5): Promise<string[]> {
    return this.cacheService?.getOrSet(
      CacheKeys.forum.trendingLabels,
      async () => {
        log.debug("[db] Obteniendo trending labels desde PostgreSQL");
        const result = await prisma.$queryRaw<Array<{ label: string; count: bigint }>>`
          SELECT label, COUNT(*) as count
          FROM "ForumPost", unnest(labels) AS label
          GROUP BY label
          ORDER BY count DESC
          LIMIT ${limit};
        `;
        return result.map(r => r.label);
      },
      config.cache.ttl.forumTrendingLabels,
    ) ?? [];
  }
}
