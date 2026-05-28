"use server";

import { withAuth, withAdmin } from "@/lib/auth-guards";
import { chatService } from "./index";
import { authService } from "@/backend/modules/auth";
import logger from "@/utils/logger";
import { Role } from "@prisma/client";

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
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    log.info("Obteniendo o creando conversación para el usuario:", { userId });
    return chatService.getOrCreateConversationForUser(userId);
  });
}

export async function getConversationMessages(conversationId: string) {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    const userRole = session.user?.role as Role;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

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
  return withAdmin(async () => {
    log.debug("Admin obteniendo lista de todas las conversaciones.");
    return chatService.getAdminConversations();
  });
}

export async function markAsRead(conversationId: string) {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    log.debug("Marcando mensajes como leídos:", { conversationId, userId });
    return chatService.markAsRead(conversationId, userId);
  });
}

export async function deleteConversationAction(conversationId: string) {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    const userRole = session.user?.role as Role;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

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
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    const userRole = session.user?.role as Role;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

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
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    const userRole = session.user?.role as Role;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

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
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    const userRole = session.user?.role as Role;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

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
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    const userRole = session.user?.role as Role;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

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

      return createdMessages;
    } catch (error) {
      log.warn("No se pudieron enviar los mensajes de asesor a conversaciones de pedido:", { userId, error });
      return { error: getChatActionErrorMessage(error as unknown as Error) };
    }
  });
}
