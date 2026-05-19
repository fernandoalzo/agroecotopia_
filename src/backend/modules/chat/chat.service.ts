import { ChatRepository } from "./chat.repository";
import { Role } from "@prisma/client";

export class ChatService {
  constructor(private chatRepository: ChatRepository) {}

  async getOrCreateConversationForUser(userId: string) {
    let conversation = await this.chatRepository.findConversationByUserId(userId);
    if (!conversation) {
      conversation = await this.chatRepository.createConversation(userId);
    }
    return conversation;
  }

  async getConversationById(id: string, currentUserId: string, userRole: Role) {
    const conversation = await this.chatRepository.findConversationById(id);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }

    // Access control: User can only see their own conversation, admin can see any
    if (userRole !== "admin" && conversation.userId !== currentUserId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return conversation;
  }

  async getMessages(conversationId: string, currentUserId: string, userRole: Role) {
    // Check if conversation exists and user has access
    await this.getConversationById(conversationId, currentUserId, userRole);
    return this.chatRepository.findMessagesByConversationId(conversationId);
  }

  async getAdminConversations() {
    return this.chatRepository.findAllConversations();
  }

  async markAsRead(conversationId: string, currentUserId: string) {
    return this.chatRepository.markMessagesAsRead(conversationId, currentUserId);
  }

  async deleteConversation(conversationId: string, currentUserId: string, userRole: Role) {
    const conversation = await this.chatRepository.findConversationById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }

    // Access control: User can only delete their own conversation, admin can delete any
    if (userRole !== "admin" && conversation.userId !== currentUserId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return this.chatRepository.deleteConversation(conversationId);
  }

  async getUsersForAdminChat(searchQuery?: string, page: number = 1) {
    return this.chatRepository.findUsersPaginated(searchQuery, page);
  }
}
