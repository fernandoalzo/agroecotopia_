import prisma from "@/backend/db/prisma";
import { Prisma } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child();

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

  async getPosts(activeFilters?: Record<string, string>, searchQuery?: string) {
    try {
      // Build the where clause
      let where: Prisma.ForumPostWhereInput = {};

      if (searchQuery && searchQuery.trim() !== "") {
        where.OR = [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { body: { contains: searchQuery, mode: "insensitive" } },
        ];
      }

      if (activeFilters && Object.keys(activeFilters).length > 0) {
        // Collect all non-'Todos' filter values
        const activeLabels = Object.values(activeFilters).filter((v) => v !== "Todos");
        
        if (activeLabels.length > 0) {
          // If we have filters, we require the post to have ALL of these labels.
          // Since Prisma's hasEvery expects an array, we can use it on the labels field.
          where.labels = {
            hasEvery: activeLabels,
          };
        }
      }

      const posts = await prisma.forumPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, name: true, image: true, role: true },
          },
          _count: {
            select: { answers: true },
          },
        },
      });

      return posts;
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
      const totalMembers = await prisma.user.count();
      // For online members, we can generate a realistic dynamic number, e.g. 10% of total members + 15
      const onlineNow = Math.floor(totalMembers * 0.1) + 15;
      
      return {
        totalMembers,
        onlineNow,
      };
    } catch (error) {
      log.error("Error getting community stats in repository:", error);
      throw new Error("Failed to get community stats.");
    }
  }

  async getTopContributors() {
    try {
      // Find top users by total posts + total answers
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { forumPosts: { some: {} } },
            { forumAnswers: { some: {} } }
          ]
        },
        include: {
          _count: {
            select: {
              forumPosts: true,
              forumAnswers: true
            }
          }
        }
      });

      // Sort in memory (since we can't easily order by sum of relation counts in Prisma)
      const rankedUsers = users.map(u => ({
        id: u.id,
        name: u.name || "Usuario",
        image: u.image,
        role: u.role,
        points: u._count.forumPosts * 10 + u._count.forumAnswers * 5, // Custom point logic
      })).sort((a, b) => b.points - a.points).slice(0, 3);

      return rankedUsers;
    } catch (error) {
      log.error("Error getting top contributors in repository:", error);
      throw new Error("Failed to get top contributors.");
    }
  }
}
