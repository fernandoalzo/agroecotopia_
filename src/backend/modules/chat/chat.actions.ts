"use server";

import { withAuth, withAdmin } from "@/lib/auth-guards";
import { chatService } from "./index";
import logger from "@/utils/logger";
import { Role } from "@/types";
import eventBus from "@/utils/eventBus";

const log = logger.child("src/backend/modules/chat/chat.actions.ts");

function getChatActionErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Ocurrió un error inesperado en el chat.";

  const messages: Record<string, string> = {
    ORDER_STORE_NOT_FOUND: "Este pedido no está asociado a la tienda seleccionada.",
    ORDER_CLOSED: "El chat solo está disponible mientras el pedido esté abierto.",
    UNAUTHORIZED_ACCESS: "No tienes permiso para acceder a esta conversación.",
    CONVERSATION_NOT_FOUND: "No se encontró la conversación solicitada.",
    DELETE_NOT_ALLOWED: "Los chats de pedido se conservan como historial y no se pueden eliminar.",
  };

  return messages[error.message] || "Ocurrió un error inesperado en el chat.";
}

export async function getOrCreateMyConversation() {
  return withAuth(async (session) => {
    const userId = session.user.id;
    log.info("Obteniendo o creando conversación para el usuario:", { userId });
    return chatService.getOrCreateConversationForUser(userId);
  });
}

export async function getConversationMessages(conversationId: string) {
  return withAuth(async (session) => {
    const userId = session.user.id;
    const userRole = session.user.role as Role;

    try {
      log.debug("Obteniendo mensajes de la conversación:", { conversationId, userId });
      return await chatService.getMessages(conversationId, userId, userRole);
    } catch (error) {
      log.warn("No se pudieron obtener mensajes de la conversación:", { conversationId, userId, error });
      return { error: getChatActionErrorMessage(error) };
    }
  });
}

export async function getAdminConversations() {
  return withAdmin(async (session) => {
    const adminUserId = session.user.id;
    log.debug("Admin obteniendo lista de todas las conversaciones.");
    return chatService.getAdminConversations(adminUserId);
  });
}

export async function markAsRead(conversationId: string) {
  return withAuth(async (session) => {
    const userId = session.user.id;
    log.debug("Marcando mensajes como leídos:", { conversationId, userId });
    const result = await chatService.markAsRead(conversationId, userId);
    eventBus.emit("unread_count_updated", { conversationId });
    return result;
  });
}

export async function deleteConversationAction(conversationId: string) {
  return withAuth(async (session) => {
    const userId = session.user.id;
    const userRole = session.user.role as Role;
    log.info("Eliminando conversación:", { conversationId, userId, userRole });
    return chatService.deleteConversation(conversationId, userId, userRole);
  });
}

export async function getAdminUsersList(searchQuery?: string, page: number = 1) {
  return withAdmin(async () => {
    log.debug("Admin buscando usuarios para chat:", { searchQuery, page });
    return chatService.getUsersForAdminChat(searchQuery, page);
  });
}

export async function getOrCreateConversationForAdmin(targetUserId: string) {
  return withAdmin(async () => {
    log.info("Admin creando/obteniendo conversación para usuario:", { targetUserId });
    return chatService.getOrCreateConversationForUser(targetUserId);
  });
}

export async function getOrCreateOrderConversationAction(pedidoId: string, storeId: string) {
  return withAuth(async (session) => {
    const userId = session.user.id;
    const userRole = session.user.role as Role;

    try {
      log.info("Obteniendo o creando conversación de pedido:", { pedidoId, storeId, userId });
      return await chatService.getOrCreateOrderConversation(pedidoId, storeId, userId, userRole);
    } catch (error) {
      log.warn("No se pudo obtener o crear conversación de pedido:", { pedidoId, storeId, userId, error });
      return { error: getChatActionErrorMessage(error) };
    }
  });
}

export async function getSellerOrderConversationsAction(storeId: string) {
  return withAuth(async (session) => {
    const userId = session.user.id;
    const userRole = session.user.role as Role;

    try {
      log.debug("Obteniendo conversaciones de pedidos para vendedor:", { storeId, userId });
      return await chatService.getSellerOrderConversations(storeId, userId, userRole);
    } catch (error) {
      log.warn("No se pudieron obtener conversaciones de pedidos para vendedor:", { storeId, userId, error });
      return { error: getChatActionErrorMessage(error) };
    }
  });
}

export async function getUserOrderConversationsAction() {
  return withAuth(async (session) => {
    const userId = session.user.id;
    const userRole = session.user.role as Role;

    try {
      log.debug("Obteniendo conversaciones de pedidos para comprador:", { userId });
      return await chatService.getUserOrderConversations(userId, userRole);
    } catch (error) {
      log.warn("No se pudieron obtener conversaciones de pedidos para comprador:", { userId, error });
      return { error: getChatActionErrorMessage(error) };
    }
  });
}

export async function sendAdvisorOrderMessagesAction(params: {
  messages: Array<{
    pedidoId: string;
    storeId: string;
    content: string;
  }>;
}) {
  return withAuth(async (session) => {
    const userId = session.user.id;
    const userRole = session.user.role as Role;

    try {
      const createdMessages = [];

      for (const messageData of params.messages || []) {
        if (!messageData?.pedidoId || !messageData?.storeId || !messageData?.content) continue;
        const conversation = await chatService.getOrCreateOrderConversation(
          String(messageData.pedidoId),
          String(messageData.storeId),
          String(userId),
          userRole
        );

        if (!conversation?.id) continue;

        const message = await chatService.sendRealtimeMessage({
          conversationId: conversation.id,
          content: messageData.content,
          senderId: userId,
          senderRole: userRole,
        });
        createdMessages.push(message);
      }

      log.info("Mensajes de asesor enviados a conversaciones de pedido:", {
        userId,
        pedidoIds: params.messages.map((m) => m.pedidoId),
        count: createdMessages.length,
      });

      // Notificar que hay nuevos mensajes para que se actualicen los contadores
      eventBus.emit("unread_count_updated", { role: userRole });

      return createdMessages;
    } catch (error) {
      log.warn("No se pudieron enviar los mensajes de asesor a conversaciones de pedido:", { userId, error });
      return { error: getChatActionErrorMessage(error as unknown as Error) };
    }
  });
}

export async function sendCryptoTransactionMessageAction(params: {
  messages: Array<{
    pedidoId: string;
    storeId: string;
    content: string;
  }>;
}) {
  return withAuth(async (session) => {
    const userId = session.user.id;
    const userRole = session.user.role as Role;

    try {
      const createdMessages = [];

      for (const msgData of params.messages || []) {
        if (!msgData?.pedidoId || !msgData?.storeId || !msgData?.content) continue;
        const conversation = await chatService.getOrCreateOrderConversation(
          String(msgData.pedidoId),
          String(msgData.storeId),
          String(userId),
          userRole
        );

        if (!conversation?.id) continue;

        const message = await chatService.sendRealtimeMessage({
          conversationId: conversation.id,
          content: msgData.content,
          senderId: userId,
          senderRole: userRole,
        });
        createdMessages.push(message);
      }

      log.info("Mensajes de transacción cripto enviados a conversaciones de pedido:", {
        userId,
        transactionCount: createdMessages.length,
      });

      eventBus.emit("unread_count_updated", { role: userRole });

      return createdMessages;
    } catch (error) {
      log.warn("No se pudieron enviar los mensajes de transacción cripto:", { userId, error });
      return { error: getChatActionErrorMessage(error as unknown as Error) };
    }
  });
}

export async function openOrderChatAction(pedidoId: string, storeId: string) {
  return withAuth(async (session) => {
    const userId = session.user.id;
    const userRole = session.user.role as Role;

    try {
      log.info("Abriendo chat consolidado de pedido:", { pedidoId, storeId, userId });
      const conversation = await chatService.getOrCreateOrderConversation(pedidoId, storeId, userId, userRole);
      
      const [messages] = await Promise.all([
        chatService.getMessages(conversation.id, userId, userRole),
        chatService.markAsRead(conversation.id, userId),
      ]);
      
      eventBus.emit("unread_count_updated", { conversationId: conversation.id });

      return { conversation, messages };
    } catch (error) {
      log.warn("No se pudo abrir el chat consolidado de pedido:", { pedidoId, storeId, userId, error });
      return { error: getChatActionErrorMessage(error) };
    }
  });
}

