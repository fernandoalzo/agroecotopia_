"use server";

import { forumService } from "./index";
import { withAuth } from "@/lib/auth-guards";
import { authService } from "@/backend/modules/auth";
import logger from "@/utils/logger";

const log = logger.child();

export async function createPostAction(formData: { title: string; body: string; labels: string[] }) {
  return withAuth(async () => {
    try {
      const session = await authService.ensureAuthenticated();
      const userId = session.user?.id;
      if (!userId) throw new Error("User ID not found");

      log.info(`User ${userId} creating a new post: ${formData.title}`);
      const post = await forumService.createPost(formData, userId);
      return { success: true, post };
    } catch (error: any) {
      log.error("Failed to create post:", error);
      return { success: false, error: error.message };
    }
  });
}

export async function getPostsAction(activeFilters?: Record<string, string>, searchQuery?: string) {
  try {
    const posts = await forumService.getPosts(activeFilters, searchQuery);
    return { success: true, posts };
  } catch (error: any) {
    log.error("Failed to get posts:", error);
    return { success: false, error: error.message };
  }
}

export async function getPostByIdAction(id: string) {
  try {
    const post = await forumService.getPostById(id);
    return { success: true, post };
  } catch (error: any) {
    log.error(`Failed to get post by id ${id}:`, error);
    return { success: false, error: error.message };
  }
}

export async function createAnswerAction(formData: { content: string; postId: string }) {
  return withAuth(async () => {
    try {
      const session = await authService.ensureAuthenticated();
      const userId = session.user?.id;
      if (!userId) throw new Error("User ID not found");

      log.info(`User ${userId} creating an answer for post ${formData.postId}`);
      const answer = await forumService.createAnswer(formData, userId);
      return { success: true, answer };
    } catch (error: any) {
      log.error("Failed to create answer:", error);
      return { success: false, error: error.message };
    }
  });
}

export async function editAnswerAction(formData: { answerId: string; content: string }) {
  return withAuth(async () => {
    try {
      const session = await authService.ensureAuthenticated();
      const userId = session.user?.id;
      if (!userId) throw new Error("User ID not found");

      log.info(`User ${userId} editing answer ${formData.answerId}`);
      const answer = await forumService.editAnswer(formData.answerId, formData.content, userId, session.user.role ?? "user");
      return { success: true, answer };
    } catch (error: any) {
      log.error("Failed to edit answer:", error);
      return { success: false, error: error.message };
    }
  });
}

export async function deleteAnswerAction(answerId: string) {
  return withAuth(async () => {
    try {
      const session = await authService.ensureAuthenticated();
      const userId = session.user?.id;
      if (!userId) throw new Error("User ID not found");

      log.info(`User ${userId} deleting answer ${answerId}`);
      await forumService.deleteAnswer(answerId, userId, session.user.role ?? "user");
      return { success: true };
    } catch (error: any) {
      log.error("Failed to delete answer:", error);
      return { success: false, error: error.message };
    }
  });
}

export async function rateItemAction(data: { itemId: string; itemType: "post" | "answer"; value: number }) {
  return withAuth(async () => {
    try {
      const session = await authService.ensureAuthenticated();
      const userId = session.user?.id;
      if (!userId) throw new Error("User ID not found");

      log.info(`User ${userId} rating ${data.itemType} ${data.itemId} with ${data.value}`);
      const rating = await forumService.rateItem(userId, data.itemId, data.itemType, data.value);
      return { success: true, rating };
    } catch (error: any) {
      log.error("Failed to rate item:", error);
      return { success: false, error: error.message };
    }
  });
}

export async function getCommunityStatsAction() {
  try {
    const stats = await forumService.getCommunityStats();
    return { success: true, stats };
  } catch (error: any) {
    log.error("Failed to get community stats:", error);
    return { success: false, error: error.message };
  }
}

export async function getTopContributorsAction() {
  try {
    const contributors = await forumService.getTopContributors();
    return { success: true, contributors };
  } catch (error: any) {
    log.error("Failed to get top contributors:", error);
    return { success: false, error: error.message };
  }
}
