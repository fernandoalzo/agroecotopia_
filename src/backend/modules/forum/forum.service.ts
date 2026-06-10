import { ForumRepository } from "./forum.repository";
import { notificationsService } from "@/backend/modules/notifications";
import { userRepository } from "@/backend/modules/user";
import logger from "@/utils/logger";
import { getForumNotificationStrings } from "./forum-notification-strings";
import { config } from "@/config/config";

const log = logger.child("src/backend/modules/forum/forum.service.ts");

export class ForumService {
  constructor(private readonly forumRepository: ForumRepository) { }

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

    // Notify all admins about the new post
    userRepository.findAdmins().then(admins => {
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

    return post;
  }

  async getPosts(activeFilters?: Record<string, string[]>, searchQuery?: string, limit?: number, cursor?: string, sortBy?: "newest" | "popular") {
    return await this.forumRepository.getPosts(activeFilters, searchQuery, limit, cursor, sortBy);
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

    return await this.forumRepository.deletePost(postId);
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
    return await this.forumRepository.updateAnswerAccepted(answerId, newAccepted);
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

    return await this.forumRepository.updatePost(postId, data);
  }

  async deleteAnswer(answerId: string, userId: string, role: string) {
    const answer = await this.forumRepository.getAnswerById(answerId);
    if (!answer) {
      throw new Error("Answer not found.");
    }

    if (answer.authorId !== userId && role !== "admin") {
      throw new Error("UNAUTHORIZED");
    }

    return await this.forumRepository.deleteAnswer(answerId);
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

    return await this.forumRepository.rateItem(userId, itemId, itemType, value);
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
}
