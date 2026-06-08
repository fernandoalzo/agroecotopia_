"use server";

import { withAuth, withAdmin } from "@/lib/auth-guards";
import { notificationsService } from "./index";
import { authService } from "@/backend/modules/auth";
import logger from "@/utils/logger";
import { RecipientStatus } from "@prisma/client";
import eventBus from "@/utils/eventBus";
import type { DispatchNotificationParams } from "@/types/notification.types";

const log = logger.child();

/**
 * Helper to handle errors uniformly in Server Actions
 */
function getNotificationActionErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Ocurrió un error inesperado con las notificaciones.";

  const messages: Record<string, string> = {
    NOTIFICATION_NOT_FOUND: "No se encontró la notificación o no tienes permiso para acceder a ella.",
    UNKNOWN_AUDIENCE_TYPE: "Tipo de audiencia inválido.",
  };

  return messages[error.message] || "Ocurrió un error inesperado al procesar la notificación.";
}

// ═══════════════════════════════════════════════════════════
// ─── Queries (Client Consumption) ──────────────────────────
// ═══════════════════════════════════════════════════════════

export async function getMyNotificationsAction(page = 1, limit = 20, status?: RecipientStatus) {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    log.debug("Obteniendo notificaciones para usuario:", { userId, page, limit, status });
    try {
      return await notificationsService.getMyNotifications(userId, { page, limit, status });
    } catch (error) {
      console.error("DEBUG ERROR IN getMyNotificationsAction:", error);
      log.error("Error obteniendo notificaciones:", error);
      return { error: getNotificationActionErrorMessage(error) };
    }
  });
}

export async function getMyUnreadCountAction() {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    try {
      return await notificationsService.getUnreadCount(userId);
    } catch (error) {
      log.error("Error obteniendo conteo de no leídas:", error);
      return { error: getNotificationActionErrorMessage(error) };
    }
  });
}

export async function getNotificationInitialDataAction() {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    try {
      return await notificationsService.getNotificationInitialData(userId);
    } catch (error) {
      log.error("Error obteniendo datos iniciales de notificaciones:", error);
      return { error: getNotificationActionErrorMessage(error) };
    }
  });
}

export async function markNotificationAsReadAction(recipientId: string) {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    try {
      await notificationsService.markAsRead(recipientId, userId);
      // Notificar cliente vía WS (por si hay múltiples ventanas abiertas)
      eventBus.emit("notification_read_state_changed", { userId });
      return { success: true };
    } catch (error) {
      log.warn("No se pudo marcar notificación como leída:", { recipientId, userId, error });
      return { error: getNotificationActionErrorMessage(error) };
    }
  });
}

export async function deleteNotificationAction(recipientId: string) {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    try {
      await notificationsService.deleteNotification(recipientId, userId);
      eventBus.emit("notification_read_state_changed", { userId });
      return { success: true };
    } catch (error) {
      console.error("DEBUG ERROR IN deleteNotificationAction:", error);
      log.warn("No se pudo borrar notificación:", { recipientId, userId, error });
      return { error: getNotificationActionErrorMessage(error) };
    }
  });
}

export async function markAllNotificationsAsReadAction() {
  return withAuth(async () => {
    const session = await authService.ensureAuthenticated();
    const userId = session.user?.id;
    if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

    try {
      await notificationsService.markAllAsRead(userId);
      eventBus.emit("notification_read_state_changed", { userId });
      return { success: true };
    } catch (error) {
      log.warn("No se pudieron marcar todas las notificaciones como leídas:", { userId, error });
      return { error: getNotificationActionErrorMessage(error) };
    }
  });
}

// ═══════════════════════════════════════════════════════════
// ─── Dispatch / Creation (Internal/Admin Usage) ────────────
// ═══════════════════════════════════════════════════════════

/**
 * Dispatch a generic notification.
 * Protected by admin guard for general usage from the frontend, but typically
 * other services (like orders/forum) will call `notificationsService.dispatchNotification()` directly.
 */
export async function dispatchNotificationAction(params: Omit<DispatchNotificationParams, "actorId">) {
  return withAdmin(async () => {
    const session = await authService.ensureAuthenticated();
    const actorId = session.user?.id;
    if (!actorId) throw new Error("ID de usuario no encontrado en la sesión");

    try {
      return await notificationsService.dispatchNotification({
        ...params,
        actorId,
      });
    } catch (error) {
      log.error("Error despachando notificación:", error);
      return { error: getNotificationActionErrorMessage(error) };
    }
  });
}

/**
 * Convenience action for admins to send a global broadcast announcement.
 */
export async function sendGlobalAnnouncementAction(title: string, message: string) {
  return withAdmin(async () => {
    const session = await authService.ensureAuthenticated();
    const actorId = session.user?.id;
    if (!actorId) throw new Error("ID de usuario no encontrado en la sesión");

    try {
      return await notificationsService.dispatchNotification({
        eventType: "admin_global_announcement",
        actorId,
        entityType: "System",
        entityId: "global",
        notification: {
          type: "announcement",
          title,
          message,
          audienceType: "BROADCAST",
        },
      });
    } catch (error) {
      log.error("Error enviando anuncio global:", error);
      return { error: getNotificationActionErrorMessage(error) };
    }
  });
}
