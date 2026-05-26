import prisma from "@/backend/db/prisma";
import { Prisma } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child();

let cachedCommunityStats: { totalMembers: number; onlineNow: number } | null = null;
let statsLastFetched: number = 0;
const STATS_TTL = 1000 * 60 * 5; // 5 minutes

let cachedTrendingLabels: string[] | null = null;
let trendingLabelsLastFetched: number = 0;
const TRENDING_TTL = 1000 * 60 * 5; // 5 minutes

export class ForumRepository {
  async createPost(
    data: { title: string; body: string; labels: string[] },
    authorId: string
  ) {
    try {
      return await prisma.forumPost.create({
        data: {
          title: data.title,
          body: data.body,
          labels: data.labels,
          authorId,
        },
        include: {
          author: {
            select: { id: true, name: true, image: true, role: true },
          },
        },
      });
    } catch (error) {
      log.error("Error creating post in repository:", error);
      throw new Error("Failed to create post.");
    }
  }

  async getPosts(activeFilters?: Record<string, string[]>, searchQuery?: string, limit: number = 10, cursor?: string, sortBy?: "newest" | "popular") {
    try {
      // Build the where clause
      let where: Prisma.ForumPostWhereInput = {};

      if (searchQuery && searchQuery.trim() !== "") {
        const formattedQuery = searchQuery.trim().split(/\s+/).join(" | ");
        where.OR = [
          { title: { search: formattedQuery } },
          { body: { search: formattedQuery } },
        ];
      }

      if (activeFilters && Object.keys(activeFilters).length > 0) {
        // For each category, require the post to have at least one of the selected labels (hasSome).
        // Across categories, we use AND: the post must match every active category.
        const labelConditions: Prisma.ForumPostWhereInput[] = [];

        for (const [, selectedLabels] of Object.entries(activeFilters)) {
          if (selectedLabels.length > 0) {
            labelConditions.push({
              labels: { hasSome: selectedLabels },
            });
          }
        }

        if (labelConditions.length > 0) {
          where.AND = labelConditions;
        }
      }

      const orderBy: Prisma.ForumPostOrderByWithRelationInput | Prisma.ForumPostOrderByWithRelationInput[] = 
        sortBy === "popular" 
          ? [{ ratingTotal: "desc" }, { createdAt: "desc" }] 
          : { createdAt: "desc" };

      const posts = await prisma.forumPost.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy,
        include: {
          author: {
            select: { id: true, name: true, image: true, role: true },
          },
          _count: {
            select: { answers: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop(); // Remove the extra item
        nextCursor = nextItem?.id;
      }

      return { posts, nextCursor };
    } catch (error) {
      log.error("Error fetching posts from repository:", error);
      throw new Error("Failed to fetch posts.");
    }
  }

  async getPostById(id: string) {
    try {
      return await prisma.forumPost.findUnique({
        where: { id },
        include: {
          author: {
            select: { id: true, name: true, image: true, role: true },
          },
          answers: {
            include: {
              author: {
                select: { id: true, name: true, image: true, role: true },
              },
            },
            orderBy: [
              { isAccepted: "desc" },
              { ratingTotal: "desc" },
              { createdAt: "asc" },
            ],
          },
        },
      });
    } catch (error) {
      log.error(`Error fetching post by ID (${id}) from repository:`, error);
      throw new Error("Failed to fetch post.");
    }
  }

  async deletePost(id: string) {
    try {
      return await prisma.forumPost.delete({
        where: { id },
      });
    } catch (error) {
      log.error(`Error deleting post in repository:`, error);
      throw new Error("Failed to delete post.");
    }
  }

  async createAnswer(
    data: { content: string; postId: string },
    authorId: string
  ) {
    try {
      return await prisma.forumAnswer.create({
        data: {
          content: data.content,
          postId: data.postId,
          authorId,
        },
        include: {
          author: {
            select: { id: true, name: true, image: true, role: true },
          },
        },
      });
    } catch (error) {
      log.error("Error creating answer in repository:", error);
      throw new Error("Failed to create answer.");
    }
  }

  async getAnswerById(id: string) {
    try {
      return await prisma.forumAnswer.findUnique({
        where: { id },
      });
    } catch (error) {
      log.error(`Error fetching answer by ID (${id}) from repository:`, error);
      throw new Error("Failed to fetch answer.");
    }
  }

  async updateAnswer(id: string, content: string) {
    try {
      return await prisma.forumAnswer.update({
        where: { id },
        data: { content },
        include: {
          author: {
            select: { id: true, name: true, image: true, role: true },
          },
        },
      });
    } catch (error) {
      log.error(`Error updating answer in repository:`, error);
      throw new Error("Failed to update answer.");
    }
  }

  async deleteAnswer(id: string) {
    try {
      return await prisma.forumAnswer.delete({
        where: { id },
      });
    } catch (error) {
      log.error(`Error deleting answer in repository:`, error);
      throw new Error("Failed to delete answer.");
    }
  }

  async rateItem(
    userId: string,
    itemId: string,
    itemType: "post" | "answer",
    value: number
  ) {
    try {
      // Upsert the rating
      const rating = await prisma.forumRating.upsert({
        where: itemType === "post"
          ? { userId_postId: { userId, postId: itemId } }
          : { userId_answerId: { userId, answerId: itemId } },
        create: {
          userId,
          value,
          postId: itemType === "post" ? itemId : null,
          answerId: itemType === "answer" ? itemId : null,
        },
        update: {
          value,
        },
      });

      // Recalculate aggregates
      if (itemType === "post") {
        const aggr = await prisma.forumRating.aggregate({
          where: { postId: itemId },
          _avg: { value: true },
          _count: { id: true },
        });

        await prisma.forumPost.update({
          where: { id: itemId },
          data: {
            ratingTotal: aggr._avg.value || 0,
            ratingCount: aggr._count.id || 0,
          },
        });
      } else {
        const aggr = await prisma.forumRating.aggregate({
          where: { answerId: itemId },
          _avg: { value: true },
          _count: { id: true },
        });

        await prisma.forumAnswer.update({
          where: { id: itemId },
          data: {
            ratingTotal: aggr._avg.value || 0,
            ratingCount: aggr._count.id || 0,
          },
        });
      }

      return rating;
    } catch (error) {
      log.error("Error rating item in repository:", error);
      throw new Error("Failed to rate item.");
    }
  }

  async getCommunityStats() {
    try {
      if (cachedCommunityStats && Date.now() - statsLastFetched < STATS_TTL) {
        return cachedCommunityStats;
      }

      // Get distinct authors from posts
      const activePosters = await prisma.forumPost.findMany({
        select: { authorId: true },
        distinct: ['authorId'],
      });
      
      // Get distinct authors from answers
      const activeAnswerers = await prisma.forumAnswer.findMany({
        select: { authorId: true },
        distinct: ['authorId'],
      });

      const uniqueActiveMembers = new Set([
        ...activePosters.map(p => p.authorId),
        ...activeAnswerers.map(a => a.authorId)
      ]);

      const totalMembers = uniqueActiveMembers.size;
      const onlineNow = Math.min(Math.floor(totalMembers * 0.1) + 15, totalMembers);

      cachedCommunityStats = {
        totalMembers,
        onlineNow,
      };
      statsLastFetched = Date.now();

      return cachedCommunityStats;
    } catch (error) {
      log.error("Error getting community stats in repository:", error);
      throw new Error("Failed to get community stats.");
    }
  }

  async getTopContributors() {
    try {
      // Professional approach: Execute aggregation and sorting directly in PostgreSQL
      // This avoids fetching potentially thousands of records into Node.js memory.
      const rankedUsers = await prisma.$queryRaw<
        Array<{
          id: string;
          name: string | null;
          image: string | null;
          role: string;
          points: number;
        }>
      >`
        SELECT 
          u.id, 
          u.name, 
          u.image, 
          CAST(u.role AS TEXT) as role,
          (COALESCE(p.post_count, 0) * 10 + COALESCE(a.answer_count, 0) * 5) as points
        FROM "User" u
        LEFT JOIN (
          SELECT "authorId", COUNT(id) as post_count
          FROM "ForumPost"
          GROUP BY "authorId"
        ) p ON u.id = p."authorId"
        LEFT JOIN (
          SELECT "authorId", COUNT(id) as answer_count
          FROM "ForumAnswer"
          GROUP BY "authorId"
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
    } catch (error) {
      log.error("Error getting top contributors in repository:", error);
      throw new Error("Failed to get top contributors.");
    }
  }

  async getTrendingLabels(limit: number = 5): Promise<string[]> {
    try {
      if (cachedTrendingLabels && Date.now() - trendingLabelsLastFetched < TRENDING_TTL) {
        return cachedTrendingLabels;
      }

      // Unnest the labels array column and count frequency across all posts
      const result = await prisma.$queryRaw<Array<{ label: string; count: bigint }>>`
        SELECT label, COUNT(*) as count
        FROM "ForumPost", unnest(labels) AS label
        GROUP BY label
        ORDER BY count DESC
        LIMIT ${limit};
      `;

      cachedTrendingLabels = result.map(r => r.label);
      trendingLabelsLastFetched = Date.now();

      return cachedTrendingLabels;
    } catch (error) {
      log.error("Error getting trending labels in repository:", error);
      throw new Error("Failed to get trending labels.");
    }
  }
}
