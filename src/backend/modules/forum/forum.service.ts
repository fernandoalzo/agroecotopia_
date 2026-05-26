import { ForumRepository } from "./forum.repository";

export class ForumService {
  constructor(private readonly forumRepository: ForumRepository) {}

  async createPost(
    data: { title: string; body: string; labels: string[] },
    authorId: string
  ) {
    if (!data.title || data.title.length < 5) {
      throw new Error("Title must be at least 5 characters long.");
    }
    if (!data.body || data.body.length < 20) {
      throw new Error("Body must be at least 20 characters long.");
    }
    if (!data.labels || data.labels.length === 0) {
      throw new Error("You must select at least one label.");
    }

    return await this.forumRepository.createPost(data, authorId);
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
    data: { content: string; postId: string },
    authorId: string
  ) {
    if (!data.content || data.content.length < 10) {
      throw new Error("Answer must be at least 10 characters long.");
    }

    // Verify post exists
    await this.getPostById(data.postId);

    return await this.forumRepository.createAnswer(data, authorId);
  }

  async editAnswer(answerId: string, content: string, userId: string, role: string) {
    if (!content || content.length < 10) {
      throw new Error("Answer must be at least 10 characters long.");
    }

    const answer = await this.forumRepository.getAnswerById(answerId);
    if (!answer) {
      throw new Error("Answer not found.");
    }

    if (answer.authorId !== userId && role !== "admin") {
      throw new Error("UNAUTHORIZED");
    }

    return await this.forumRepository.updateAnswer(answerId, content);
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
    if (value < 1 || value > 5) {
      throw new Error("Rating must be between 1 and 5.");
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
