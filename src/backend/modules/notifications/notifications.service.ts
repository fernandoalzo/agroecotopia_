import { AudienceType, Prisma, RecipientStatus } from "@prisma/client";
import { NotificationsRepository } from "./notifications.repository";
import { AudienceResolver } from "./audience-resolver";
import eventBus from "@/utils/eventBus";
import logger from "@/utils/logger";

import type {
  DispatchNotificationParams,
  NotificationRecipientWithDetails,
  PaginatedNotifications,
  RealtimeNotificationPayload,
} from "@/types/notification.types";

const log = logger.child();

/**
 * NotificationsService — The Notification Engine.
 *
 * Core responsibilities:
 * 1. Orchestrate the full dispatch pipeline (event → notification → recipients → realtime)
 * 2. Merge explicit recipients with lazy-materialized broadcasts for user queries
 * 3. Manage read/unread state
 *
 * This service does NOT interact with Socket.IO directly.
 * It emits events via the eventBus, which the socketHandler bridges to Socket.IO.
 */
export class NotificationsService {
  constructor(
    private repo: NotificationsRepository,
    private audienceResolver: AudienceResolver,
  ) { }

  // ═══════════════════════════════════════════════════════════
  // ─── Core Dispatch Pipeline ────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  /**
   * Full notification dispatch pipeline:
   *
   * 1. Create immutable DomainEvent (audit log)
   * 2. Create Notification (logical unit)
   * 3. Resolve audience → userIds[]
   * 4. Exclude actor (don't self-notify)
   * 5. Create NotificationRecipients (bulk insert) — skipped for BROADCAST
   * 6. Emit "notification_dispatched" via eventBus for realtime delivery
   */
  async dispatchNotification(params: DispatchNotificationParams) {
    const { eventType, actorId, entityType, entityId, payload, notification: notifData } = params;

    log.info("Despachando notificación:", {
      eventType,
      actorId,
      audienceType: notifData.audienceType,
      type: notifData.type,
    });

    // 1. Create immutable DomainEvent
    const domainEvent = await this.repo.createDomainEvent({
      eventType,
      actorId,
      entityType,
      entityId,
      payload: (payload as Prisma.InputJsonValue) ?? {},
    });

    // 2. Create Notification linked to the event
    const notification = await this.repo.createNotification({
      type: notifData.type,
      title: notifData.title,
      message: notifData.message,
      creatorId: actorId,
      audienceType: notifData.audienceType as AudienceType,
      audienceRef: notifData.audienceRef,
      eventId: domainEvent.id,
      metadata: (notifData.metadata as Prisma.InputJsonValue) ?? {},
    });

    // 3. Resolve audience
    const targetUserIds = await this.audienceResolver.resolve(
      notifData.audienceType as AudienceType,
      notifData.audienceRef,
    );

    // 4. Exclude actor (no self-notifications)
    const recipientUserIds = targetUserIds.filter((uid) => uid !== actorId);

    // 5. Create recipients (skipped for BROADCAST — lazy materialization)
    let recipientCount = 0;
    if (notifData.audienceType !== "BROADCAST" && recipientUserIds.length > 0) {
      const result = await this.repo.createManyRecipients(notification.id, recipientUserIds);
      recipientCount = result.count;
    }

    // 6. Build realtime payload and emit via eventBus
    const realtimePayload: RealtimeNotificationPayload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata as Record<string, unknown>,
      createdAt: notification.createdAt.toISOString(),
      creator: notification.creator,
    };

    if (notifData.audienceType === "BROADCAST") {
      // For broadcast: emit to ALL connected users via a special broadcast event
      eventBus.emit("notification_broadcast", { notification: realtimePayload });
      log.info("Broadcast notification dispatched (lazy materialization):", {
        notificationId: notification.id,
      });
    } else if (recipientUserIds.length > 0) {
      // For individual/group: emit to specific user channels
      eventBus.emit("notification_dispatched", {
        userIds: recipientUserIds,
        notification: realtimePayload,
      });
      log.info("Notificación despachada exitosamente:", {
        notificationId: notification.id,
        recipientCount,
        audienceType: notifData.audienceType,
      });
    }

    return {
      event: domainEvent,
      notification,
      recipientCount,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // ─── User-Facing Queries ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  /**
   * Get paginated notifications for a user.
   *
   * Merges two data sources:
   * 1. Explicit recipients (INDIVIDUAL + GROUP notifications)
   * 2. Virtual broadcast notifications (lazy materialization)
   *
   * Both are combined, sorted by createdAt DESC, and paginated.
   */
  async getMyNotifications(
    userId: string,
    params: { page: number; limit: number; status?: RecipientStatus },
  ): Promise<PaginatedNotifications> {
    log.debug("Obteniendo notificaciones del usuario:", { userId, ...params });

    // Parallel: fetch explicit recipients and (if no status filter) broadcasts simultaneously
    const [explicitResult, broadcastResult] = await Promise.all([
      this.repo.findRecipientsByUserId(userId, params),
      params.status
        ? Promise.resolve(null)
        : this.repo.findUnreadBroadcastsForUser(userId, params),
    ]);

    // If filtering by status, only return explicit recipients (broadcasts are virtual)
    if (params.status || !broadcastResult) {
      return {
        recipients: explicitResult.recipients.map((r) => this.mapRecipientToDTO(r)),
        totalCount: explicitResult.totalCount,
        totalPages: explicitResult.totalPages,
        page: explicitResult.page,
        limit: explicitResult.limit,
      };
    }

    // Merge and sort by createdAt DESC
    const merged: NotificationRecipientWithDetails[] = [
      ...explicitResult.recipients.map((r) => this.mapRecipientToDTO(r)),
      ...broadcastResult.notifications.map((n) => this.mapBroadcastToVirtualRecipient(n)),
    ];

    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination to merged results
    const totalCount = explicitResult.totalCount + broadcastResult.totalCount;
    const paginatedMerged = merged.slice(0, params.limit);

    return {
      recipients: paginatedMerged,
      totalCount,
      totalPages: Math.ceil(totalCount / params.limit),
      page: params.page,
      limit: params.limit,
    };
  }

  /**
   * Get total unread count for a user.
   * Combines explicit unread recipients + unread broadcast count.
   */
  async getUnreadCount(userId: string): Promise<number> {
    log.debug("Obteniendo conteo de no leídas:", { userId });

    const [explicitCount, broadcastCount] = await Promise.all([
      this.repo.countUnreadByUserId(userId),
      this.repo.countUnreadBroadcastsForUser(userId),
    ]);

    return explicitCount + broadcastCount;
  }

  /**
   * Combined initial data fetch — unread count + first page of notifications
   * in a single call. Runs all queries in parallel to minimize latency.
   */
  async getNotificationInitialData(userId: string) {
    log.debug("Obteniendo datos iniciales de notificaciones:", { userId });

    const [notificationsResult, unreadCount] = await Promise.all([
      this.getMyNotifications(userId, { page: 1, limit: 20 }),
      this.getUnreadCount(userId),
    ]);

    return {
      unreadCount,
      recipients: notificationsResult.recipients,
      totalCount: notificationsResult.totalCount,
      totalPages: notificationsResult.totalPages,
      page: notificationsResult.page,
      limit: notificationsResult.limit,
    };
  }

  /**
   * Mark a notification as read.
   * Handles both explicit recipients and broadcast materialization.
   */
  async markAsRead(recipientId: string, userId: string): Promise<void> {
    log.debug("Marcando como leída:", { recipientId, userId });

    // Check if this is a virtual broadcast ID (format: "broadcast:{notificationId}")
    if (recipientId.startsWith("broadcast:")) {
      const notificationId = recipientId.replace("broadcast:", "");
      await this.repo.materializeBroadcastRecipient(notificationId, userId);
      log.debug("Broadcast materializado y marcado como leído:", { notificationId, userId });
      return;
    }

    // Standard recipient — verify ownership and mark as read
    const result = await this.repo.markAsRead(recipientId, userId);
    if (result.count === 0) {
      log.warn("No se encontró recipient o no pertenece al usuario:", { recipientId, userId });
      throw new Error("NOTIFICATION_NOT_FOUND");
    }
  }

  /**
   * Delete a notification.
   * - BROADCAST: soft delete (keeps the row so it won't re-appear as unread).
   * - INDIVIDUAL/GROUP: hard delete (physically removes from the database).
   */
  async deleteNotification(recipientId: string, userId: string): Promise<void> {
    log.debug("Borrando notificación:", { recipientId, userId });

    // Check if this is a virtual broadcast ID (format: "broadcast:{notificationId}")
    if (recipientId.startsWith("broadcast:")) {
      const notificationId = recipientId.replace("broadcast:", "");
      const recipient = await this.repo.materializeBroadcastRecipient(notificationId, userId);
      await this.repo.softDeleteRecipient(recipient.id, userId);
      log.debug("Broadcast materializado y soft-borrado:", { notificationId, userId });
      return;
    }

    // Look up the recipient to determine the audience type
    const recipient = await this.repo.findRecipientById(recipientId);
    if (!recipient || recipient.userId !== userId) {
      log.warn("No se encontró recipient o no pertenece al usuario:", { recipientId, userId });
      throw new Error("NOTIFICATION_NOT_FOUND");
    }

    if (recipient.notification.audienceType === "BROADCAST") {
      // Broadcast recipient already materialized — soft delete to prevent re-appearance
      await this.repo.softDeleteRecipient(recipientId, userId);
      log.debug("Broadcast recipient soft-borrado:", { recipientId, userId });
    } else {
      // INDIVIDUAL/GROUP — hard delete (physically remove from DB)
      const result = await this.repo.hardDeleteRecipient(recipientId, userId);
      if (result.count === 0) {
        throw new Error("NOTIFICATION_NOT_FOUND");
      }
      log.debug("Notificación individual/grupo hard-borrada:", { recipientId, userId });
    }
  }

  /**
   * Mark all notifications as read for a user.
   * Also materializes all unread broadcasts.
   */
  async markAllAsRead(userId: string): Promise<void> {
    log.debug("Marcando todas como leídas:", { userId });

    // 1. Mark all explicit recipients as read
    await this.repo.markAllAsRead(userId);

    // 2. Materialize all unread broadcasts
    const unreadBroadcasts = await this.repo.findUnreadBroadcastsForUser(userId, {
      page: 1,
      limit: 1000, // Materialize up to 1000 broadcasts at once
    });

    for (const notification of unreadBroadcasts.notifications) {
      await this.repo.materializeBroadcastRecipient(notification.id, userId);
    }

    log.info("Todas las notificaciones marcadas como leídas:", {
      userId,
      broadcastsMaterialized: unreadBroadcasts.notifications.length,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // ─── Private Mappers ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  /**
   * Map a Prisma NotificationRecipient (with includes) to the DTO shape.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRecipientToDTO(recipient: any): NotificationRecipientWithDetails {
    return {
      id: recipient.id,
      notificationId: recipient.notificationId,
      status: recipient.status as NotificationRecipientWithDetails["status"],
      readAt: recipient.readAt?.toISOString() ?? null,
      deliveredAt: recipient.deliveredAt?.toISOString() ?? null,
      createdAt: recipient.createdAt.toISOString(),
      notification: {
        id: recipient.notification.id,
        type: recipient.notification.type,
        title: recipient.notification.title,
        message: recipient.notification.message,
        audienceType: recipient.notification.audienceType,
        metadata: recipient.notification.metadata as Record<string, unknown>,
        createdAt: recipient.notification.createdAt.toISOString(),
        creator: recipient.notification.creator,
      },
    };
  }

  /**
   * Map a broadcast Notification to a "virtual" recipient DTO.
   * The virtual ID uses the format "broadcast:{notificationId}" so the client
   * can distinguish it when calling markAsRead.
   */
  private mapBroadcastToVirtualRecipient(notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    audienceType: string;
    metadata: Prisma.JsonValue;
    createdAt: Date;
    creator: { id: string; name: string | null; image: string | null };
  }): NotificationRecipientWithDetails {
    return {
      id: `broadcast:${notification.id}`,
      notificationId: notification.id,
      status: "PENDING" as NotificationRecipientWithDetails["status"],
      readAt: null,
      deliveredAt: null,
      createdAt: notification.createdAt.toISOString(),
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        audienceType: notification.audienceType as AudienceType,
        metadata: notification.metadata as Record<string, unknown>,
        createdAt: notification.createdAt.toISOString(),
        creator: notification.creator,
      },
    };
  }
}
