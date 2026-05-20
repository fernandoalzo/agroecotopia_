"use server";

import { withAuth, withAdmin } from "@/lib/auth-guards";
import { chatService } from "./index";
import { authService } from "@/backend/modules/auth";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/chat/chat.actions.ts");

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
    const userRole = session.user?.role as any;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    log.debug("Obteniendo mensajes de la conversación:", { conversationId, userId });
    return chatService.getMessages(conversationId, userId, userRole);
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
    const userRole = session.user?.role as any;
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

