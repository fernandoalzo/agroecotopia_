"use server";

import { withAuth, withAdmin } from "@/lib/auth-guards";
import { chatService } from "./index";
import { authService } from "@/backend/modules/auth";

export async function getOrCreateMyConversation() {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    return chatService.getOrCreateConversationForUser(userId);
  });
}

export async function getConversationMessages(conversationId: string) {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    const userRole = session.user?.role as any;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    return chatService.getMessages(conversationId, userId, userRole);
  });
}

export async function getAdminConversations() {
  return withAdmin(async () => {
    return chatService.getAdminConversations();
  });
}

export async function markAsRead(conversationId: string) {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    return chatService.markAsRead(conversationId, userId);
  });
}

export async function deleteConversationAction(conversationId: string) {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    const userRole = session.user?.role as any;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    return chatService.deleteConversation(conversationId, userId, userRole);
  });
}

export async function getAdminUsersList(searchQuery?: string, page: number = 1) {
  return withAdmin(async () => {
    return chatService.getUsersForAdminChat(searchQuery, page);
  });
}

export async function getOrCreateConversationForAdmin(targetUserId: string) {
  return withAdmin(async () => {
    return chatService.getOrCreateConversationForUser(targetUserId);
  });
}

