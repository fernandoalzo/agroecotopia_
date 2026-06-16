import { ForumRepository } from "./forum.repository";
import { ForumPostEmbeddingService } from "./forumPostEmbedding.service";
import { notificationsService } from "@/backend/modules/notifications";
import type { UserRepository } from "@/backend/modules/user/user.repository";
import logger from "@/utils/logger";
import { getForumNotificationStrings } from "./forum-notification-strings";
import { config } from "@/config/config";
import eventBus from "@/utils/eventBus";

const log = logger.child("src/backend/modules/forum/forum.service.ts");

export class ForumService {
  constructor(
    private readonly forumRepository: ForumRepository,
    private readonly userRepository: UserRepository,
    private readonly embeddingService?: ForumPostEmbeddingService,
  ) { }

  async getPosts(activeFilters?: Record<string, string[]>, searchQuery?: string, limit?: number, cursor?: string, sortBy?: "newest" | "popular") {
    if (searchQuery && searchQuery.trim() !== "" && this.embeddingService && config.ai.features.semanticSearch) {
      try {
        const labels = activeFilters
          ? Object.values(activeFilters).flat().filter(Boolean)
          : undefined;
        const similar = await this.embeddingService.searchSimilar(searchQuery, 200, labels);
        if (similar.length > 0) {
          const postIds = similar.map(s => s.id);
          const posts = await this.forumRepository.getPostsByIds(postIds, labels);
          const total = posts.length;
          const pageLimit = limit ?? 10;
          const startIndex = cursor ? postIds.indexOf(cursor) + 1 : 0;
          const sliced = posts.slice(startIndex, startIndex + pageLimit);
          const nextCursor = sliced.length === pageLimit ? sliced[sliced.length - 1].id : undefined;
          return { posts: sliced, nextCursor };
        }
      } catch (error) {
        log.warn("Búsqueda semántica en foro falló, usando fallback textual:", error);
      }
    }

    return await this.forumRepository.getPosts(activeFilters, searchQuery, limit, cursor, sortBy);
  }
  async createPost(
    data: { title: string; body: string; labels: string[] },
    authorId: string,
    locale: string = "es",
  ) {
    if (!data.title || data.title.length < config.forum.validation.post.titleMin) {
      throw new Error(`Title must be at least ${config.forum.validation.post.titleMin} characters long.`);
    }
    if (!data.body || data.body.length < config.forum.validation.post.bodyMin) {
      throw new Error(`Body must be at least ${config.forum.validation.post.bodyMin} characters long.`);
    }
    if (!data.labels || data.labels.length < config.forum.validation.post.labelsMin) {
      throw new Error("You must select at least one label.");
    }

    const post = await this.forumRepository.createPost(data, authorId);
    const nls = getForumNotificationStrings(locale);

    // Generate embedding asynchronously if semantic search is enabled
    if (this.embeddingService && config.ai.features.semanticSearch) {
      this.embeddingService.generateForPost({
        id: post.id,
        title: post.title,
        body: post.body,
        labels: post.labels,
      }).catch((err) => {
        log.warn("🤖 [Embedding] Error async al generar embedding para post del foro:", err);
      });
    }

    // Notify all admins about the new post
    this.userRepository.findAdmins().then(admins => {
      for (const admin of admins) {
        notificationsService.dispatchNotification({
          eventType: "post_created",
          actorId: authorId,
          entityType: "Post",
          entityId: post.id,
          notification: {
            type: "new_forum_post",
            title: nls.postCreated.title,
            message: nls.postCreated.message(post.title),
            audienceType: "INDIVIDUAL",
            audienceRef: admin.id,
            metadata: { actionUrl: `/comunidad/post/${post.id}` },
          },
        }).catch(err => {
          log.error("Error al despachar notificación a admin:", err);
        });
      }
    }).catch(err => {
      log.error("Error al buscar admins para notificación:", err);
    });

    eventBus.emit("forum:post_created", { postId: post.id, post });

    return post;
  }

  async getPostById(id: string) {
    const post = await this.forumRepository.getPostById(id);
    if (!post) {
      throw new Error("Post not found.");
    }
    return post;
  }

  async deletePost(postId: string, userId: string, role: string) {
    const post = await this.forumRepository.getPostById(postId);
    if (!post) {
      throw new Error("Post not found.");
    }

    if (post.authorId !== userId && role !== "admin") {
      throw new Error("UNAUTHORIZED");
    }

    await this.forumRepository.deletePost(postId);

    eventBus.emit("forum:post_deleted", { postId });

    return { success: true };
  }

  async createAnswer(
    data: { content: string; postId: string; parentId?: string | null },
    authorId: string,
    locale: string = "es",
  ) {
    if (!data.content || data.content.length < config.forum.validation.answer.contentMin) {
      throw new Error(`Answer must be at least ${config.forum.validation.answer.contentMin} characters long.`);
    }

    // Verify post exists and check business rules
    const post = await this.getPostById(data.postId);

    const answer = await this.forumRepository.createAnswer(data, authorId);
    const nls = getForumNotificationStrings(locale);

    // Notify the relevant owner
    let recipientId: string;
    if (data.parentId) {
      const parentAnswer = await this.forumRepository.getAnswerById(data.parentId);
      recipientId = parentAnswer ? parentAnswer.authorId : post.authorId;
    } else {
      recipientId = post.authorId;
    }

    const actorName = answer.author?.name || "Alguien";
    const isReply = !!data.parentId;

    notificationsService.dispatchNotification({
      eventType: "answer_created",
      actorId: authorId,
      entityType: "Answer",
      entityId: answer.id,
      notification: {
        type: "new_forum_answer",
        title: nls.answerCreated.title(isReply),
        message: nls.answerCreated.message(actorName, isReply, post.title),
        audienceType: "INDIVIDUAL",
        audienceRef: recipientId,
        metadata: { actionUrl: `/comunidad/post/${data.postId}` },
      },
    }).catch(err => {
      log.error("Error al despachar notificación de respuesta:", err);
    });

    eventBus.emit("forum:answer_created", { postId: data.postId, answer, answerId: answer.id, _room: `forum:post:${data.postId}` });

    return answer;
  }

  async editAnswer(answerId: string, content: string, userId: string, role: string, locale: string = "es") {
    if (!content || content.length < config.forum.validation.answer.contentMin) {
      throw new Error(`Answer must be at least ${config.forum.validation.answer.contentMin} characters long.`);
    }

    const answer = await this.forumRepository.getAnswerById(answerId);
    if (!answer) {
      throw new Error("Answer not found.");
    }

    if (answer.authorId !== userId && role !== "admin") {
      throw new Error("UNAUTHORIZED");
    }

    const updated = await this.forumRepository.updateAnswer(answerId, content);
    const nls = getForumNotificationStrings(locale);

    // Notify all direct repliers about the edit
    const replies = await this.forumRepository.getDirectReplies(answerId);
    if (replies.length > 0) {
      const post = await this.getPostById(answer.postId);
      const actorName = updated.author?.name || "Alguien";

      for (const reply of replies) {
        notificationsService.dispatchNotification({
          eventType: "answer_edited",
          actorId: userId,
          entityType: "Answer",
          entityId: answerId,
          notification: {
            type: "answer_edited",
            title: nls.answerEdited.title,
            message: nls.answerEdited.message(actorName, post.title),
            audienceType: "INDIVIDUAL",
            audienceRef: reply.authorId,
            metadata: { actionUrl: `/comunidad/post/${answer.postId}` },
          },
        }).catch(err => {
          log.error("Error al despachar notificación de edición:", err);
        });
      }
    }

    eventBus.emit("forum:answer_edited", { postId: answer.postId, answerId, answer: updated, _room: `forum:post:${answer.postId}` });

    return updated;
  }

  async acceptAnswer(answerId: string, postId: string, userId: string, role: string) {
    const post = await this.getPostById(postId);
    if (!post) {
      throw new Error("Post not found.");
    }

    if (post.authorId !== userId && role !== "admin") {
      throw new Error("UNAUTHORIZED");
    }

    const answer = await this.forumRepository.getAnswerById(answerId);
    if (!answer) {
      throw new Error("Answer not found.");
    }

    if (answer.postId !== postId) {
      throw new Error("Answer does not belong to this post.");
    }

    // Toggle acceptance — if already accepted, unaccept
    const newAccepted = !answer.isAccepted;
    const updated = await this.forumRepository.updateAnswerAccepted(answerId, newAccepted);

    eventBus.emit("forum:answer_accepted", { postId, answerId, isAccepted: newAccepted, _room: `forum:post:${postId}` });

    return updated;
  }

  async editPost(postId: string, userId: string, role: string, data: { title?: string; body?: string; labels?: string[] }) {
    const post = await this.forumRepository.getPostById(postId);
    if (!post) {
      throw new Error("Post not found.");
    }

    if (post.authorId !== userId && role !== "admin") {
      throw new Error("UNAUTHORIZED");
    }

    if (data.title !== undefined && data.title.length < config.forum.validation.post.titleMin) {
      throw new Error(`Title must be at least ${config.forum.validation.post.titleMin} characters long.`);
    }

    if (data.body !== undefined && data.body.length < config.forum.validation.post.bodyMin) {
      throw new Error(`Body must be at least ${config.forum.validation.post.bodyMin} characters long.`);
    }

    if (data.labels !== undefined && data.labels.length < config.forum.validation.post.labelsMin) {
      throw new Error("You must select at least one label.");
    }

    const updatedPost = await this.forumRepository.updatePost(postId, data);

    // Regenerate embedding asynchronously if semantic search is enabled
    if (this.embeddingService && config.ai.features.semanticSearch) {
      this.embeddingService.generateForPost({
        id: postId,
        title: updatedPost.title,
        body: updatedPost.body,
        labels: updatedPost.labels,
      }).catch((err) => {
        log.warn("🤖 [Embedding] Error async al regenerar embedding para post del foro:", err);
      });
    }

    eventBus.emit("forum:post_updated", { postId, post: updatedPost, _room: `forum:post:${postId}` });

    return updatedPost;
  }

  async deleteAnswer(answerId: string, userId: string, role: string) {
    const answer = await this.forumRepository.getAnswerById(answerId);
    if (!answer) {
      throw new Error("Answer not found.");
    }

    if (answer.authorId !== userId && role !== "admin") {
      throw new Error("UNAUTHORIZED");
    }

    const deletedAnswerPostId = answer.postId;
    const deletedAnswerId = answer.id;
    await this.forumRepository.deleteAnswer(answerId);

    eventBus.emit("forum:answer_deleted", { postId: deletedAnswerPostId, answerId: deletedAnswerId, _room: `forum:post:${deletedAnswerPostId}` });

    return { success: true };
  }

  async rateItem(
    userId: string,
    itemId: string,
    itemType: "post" | "answer",
    value: number
  ) {
    if (![-1, 0, 1].includes(value)) {
      throw new Error("Rating must be 1 (upvote), -1 (downvote), or 0 (remove vote).");
    }

    const result = await this.forumRepository.rateItem(userId, itemId, itemType, value);

    eventBus.emit("forum:item_rated", { itemId, itemType });

    return result;
  }

  async getCommunityStats() {
    return await this.forumRepository.getCommunityStats();
  }

  async getTopContributors() {
    return await this.forumRepository.getTopContributors();
  }

  async getTrendingLabels() {
    return await this.forumRepository.getTrendingLabels();
  }

  async getEmbeddingStats() {
    if (!this.embeddingService) return null;
    return this.embeddingService.getStats();
  }

  async generateAllEmbeddings(): Promise<{ success: number; failed: number; skipped: number }> {
    if (!this.embeddingService) return { success: 0, failed: 0, skipped: 0 };
    return this.embeddingService.generateAll();
  }
}
