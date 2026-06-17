"use server";

import { headers } from "next/headers";
import { forumService, forumPostEmbeddingService } from "./index";
import { withAuth, withAdmin } from "@/lib/auth-guards";
import logger from "@/utils/logger";
import { revalidatePath } from "next/cache";

const log = logger.child();

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Error desconocido";
}

async function getLocaleFromHeaders(): Promise<string> {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";
  return acceptLanguage.startsWith("en") ? "en" : "es";
}

export async function createPostAction(formData: { title: string; body: string; labels: string[] }) {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;
      const locale = await getLocaleFromHeaders();

      log.info(`User ${userId} creating a new post: ${formData.title}`);
      const post = await forumService.createPost(formData, userId, locale);
      return { success: true, post };
    } catch (error: unknown) {
      log.error("Failed to create post:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });
}

export async function getPostsAction(activeFilters?: Record<string, string[]>, searchQuery?: string, limit?: number, cursor?: string, sortBy?: "newest" | "popular") {
  try {
    const { posts, nextCursor, searchType, totalCount } = await forumService.getPosts(activeFilters, searchQuery, limit, cursor, sortBy);
    return { success: true, posts, nextCursor, searchType, totalCount };
  } catch (error: unknown) {
    log.error("Failed to get posts:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getPostByIdAction(id: string) {
  try {
    const post = await forumService.getPostById(id);
    return { success: true, post };
  } catch (error: unknown) {
    log.error(`Failed to get post by id ${id}:`, error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getRelatedPostsAction(postId: string, limit?: number) {
  try {
    const posts = await forumService.getRelatedPosts(postId, limit);
    return { success: true, posts };
  } catch (error: unknown) {
    log.error(`Failed to get related posts for id ${postId}:`, error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deletePostAction(postId: string) {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;

      log.info(`User ${userId} deleting post ${postId}`);
      await forumService.deletePost(postId, userId, session.user.role ?? "user");
      return { success: true };
    } catch (error: unknown) {
      log.error("Failed to delete post:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });
}

export async function createAnswerAction(formData: { content: string; postId: string; parentId?: string | null }) {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;
      const locale = await getLocaleFromHeaders();

      log.info(`User ${userId} creating an answer for post ${formData.postId}`);
      const answer = await forumService.createAnswer(formData, userId, locale);
      return { success: true, answer };
    } catch (error: unknown) {
      log.error("Failed to create answer:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });
}

export async function editAnswerAction(formData: { answerId: string; content: string }) {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;
      const locale = await getLocaleFromHeaders();

      log.info(`User ${userId} editing answer ${formData.answerId}`);
      const answer = await forumService.editAnswer(formData.answerId, formData.content, userId, session.user.role ?? "user", locale);
      return { success: true, answer };
    } catch (error: unknown) {
      log.error("Failed to edit answer:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });
}

export async function acceptAnswerAction(formData: { answerId: string; postId: string }) {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;

      log.info(`User ${userId} accepting answer ${formData.answerId}`);
      const answer = await forumService.acceptAnswer(formData.answerId, formData.postId, userId, session.user.role ?? "user");
      return { success: true, answer };
    } catch (error: unknown) {
      log.error("Failed to accept answer:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });
}

export async function editPostAction(formData: { postId: string; title?: string; body?: string; labels?: string[] }) {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;

      log.info(`User ${userId} editing post ${formData.postId}`);
      const post = await forumService.editPost(formData.postId, userId, session.user.role ?? "user", formData);
      return { success: true, post };
    } catch (error: unknown) {
      log.error("Failed to edit post:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });
}

export async function deleteAnswerAction(answerId: string) {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;

      log.info(`User ${userId} deleting answer ${answerId}`);
      await forumService.deleteAnswer(answerId, userId, session.user.role ?? "user");
      return { success: true };
    } catch (error: unknown) {
      log.error("Failed to delete answer:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });
}

export async function rateItemAction(data: { itemId: string; itemType: "post" | "answer"; value: number }) {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;

      log.info(`User ${userId} rating ${data.itemType} ${data.itemId} with ${data.value}`);
      const rating = await forumService.rateItem(userId, data.itemId, data.itemType, data.value);
      return { success: true, rating };
    } catch (error: unknown) {
      log.error("Failed to rate item:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });
}

export async function getCommunityStatsAction() {
  try {
    const stats = await forumService.getCommunityStats();
    return { success: true, stats };
  } catch (error: unknown) {
    log.error("Failed to get community stats:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getTopContributorsAction() {
  try {
    const contributors = await forumService.getTopContributors();
    return { success: true, contributors };
  } catch (error: unknown) {
    log.error("Failed to get top contributors:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getTrendingLabelsAction() {
  try {
    const labels = await forumService.getTrendingLabels();
    return { success: true, labels };
  } catch (error: unknown) {
    log.error("Failed to get trending labels:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function generateForumPostEmbeddingsAction() {
  return withAdmin(async () => {
    try {
      const result = await forumPostEmbeddingService.generateAll();
      const stats = await forumPostEmbeddingService.getStats();
      log.info("🤖 [Action] Embeddings de foro generados:", result);
      revalidatePath("/admin/foro");
      return { success: true, data: { ...result, total: stats?.total ?? 0 } };
    } catch (error) {
      log.error("🤖 [Action] Error generando embeddings de foro:", error);
      return { success: false, error: "Error al generar embeddings" };
    }
  });
}

export async function getForumPostEmbeddingStatsAction() {
  try {
    const stats = await forumPostEmbeddingService.getStats();
    return { success: true, data: stats ?? undefined };
  } catch (error) {
    log.error("Error obteniendo estadísticas de embeddings del foro:", error);
    return { success: false, error: "Error al obtener estadísticas" };
  }
}
