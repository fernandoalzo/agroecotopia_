import { ChatRepository } from "./chat.repository";
import { Role } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/chat/chat.service.ts");

export class ChatService {
  constructor(private chatRepository: ChatRepository) {}

  async getOrCreateConversationForUser(userId: string) {
    let conversation = await this.chatRepository.findConversationByUserId(userId);
    if (!conversation) {
      log.info("No se encontró conversación existente. Creando nueva conversación para el usuario:", { userId });
      conversation = await this.chatRepository.createConversation(userId);
    } else {
      log.debug("Conversación existente encontrada para el usuario:", { userId, conversationId: conversation.id });
    }
    return conversation;
  }

  async getConversationById(id: string, currentUserId: string, userRole: Role) {
    const conversation = await this.chatRepository.findConversationById(id);
    if (!conversation) {
      log.warn("Conversación no encontrada:", { conversationId: id });
      throw new Error("CONVERSATION_NOT_FOUND");
    }

    // Access control: User can only see their own conversation, admin can see any
    if (userRole !== "admin" && conversation.userId !== currentUserId) {
      log.warn("Acceso no autorizado a conversación:", { conversationId: id, currentUserId, ownerUserId: conversation.userId });
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return conversation;
  }

  async getMessages(conversationId: string, currentUserId: string, userRole: Role) {
    // Check if conversation exists and user has access
    await this.getConversationById(conversationId, currentUserId, userRole);
    log.debug("Obteniendo mensajes de la conversación:", { conversationId });
    return this.chatRepository.findMessagesByConversationId(conversationId);
  }

  async getAdminConversations() {
    log.debug("Obteniendo todas las conversaciones para panel de administración.");
    return this.chatRepository.findAllConversations();
  }

  async markAsRead(conversationId: string, currentUserId: string) {
    log.debug("Marcando mensajes como leídos:", { conversationId, excludeSenderId: currentUserId });
    return this.chatRepository.markMessagesAsRead(conversationId, currentUserId);
  }

  async deleteConversation(conversationId: string, currentUserId: string, userRole: Role) {
    const conversation = await this.chatRepository.findConversationById(conversationId);
    if (!conversation) {
      log.warn("Intento de eliminar conversación inexistente:", { conversationId });
      throw new Error("CONVERSATION_NOT_FOUND");
    }

    // Access control: User can only delete their own conversation, admin can delete any
    if (userRole !== "admin" && conversation.userId !== currentUserId) {
      log.warn("Acceso no autorizado para eliminar conversación:", { conversationId, currentUserId, ownerUserId: conversation.userId });
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    log.info("Eliminando conversación:", { conversationId, deletedBy: currentUserId, role: userRole });
    return this.chatRepository.deleteConversation(conversationId);
  }

  async getUsersForAdminChat(searchQuery?: string, page: number = 1) {
    log.debug("Buscando usuarios paginados para chat de admin:", { searchQuery, page });
    return this.chatRepository.findUsersPaginated(searchQuery, page);
  }
}
