import prisma from "@/backend/db/prisma";
import { AudienceType, Prisma, RecipientStatus } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child();

/**
 * Notification-specific select clause for the creator.
 * Reused across all queries that join with the Notification model.
 */
const CREATOR_SELECT = {
  id: true,
  name: true,
  image: true,
} as const;

/**
 * Standard include for recipient queries — always includes the parent notification + creator.
 */
const RECIPIENT_WITH_NOTIFICATION_INCLUDE = {
  notification: {
    include: {
      creator: {
        select: CREATOR_SELECT,
      },
    },
  },
} as const;

export class NotificationsRepository {
  // ─── Domain Events ──────────────────────────────────────

  async createDomainEvent(data: {
    eventType: string;
    actorId: string;
    entityType: string;
    entityId: string;
    payload?: Prisma.InputJsonValue;
  }) {
    log.debug("Creando DomainEvent:", { eventType: data.eventType, actorId: data.actorId });
    return await prisma.domainEvent.create({
      data: {
        eventType: data.eventType,
        actorId: data.actorId,
        entityType: data.entityType,
        entityId: data.entityId,
        payload: data.payload ?? {},
      },
    });
  }

  // ─── Notifications ─────────────────────────────────────

  async createNotification(data: {
    type: string;
    title: string;
    message: string;
    creatorId: string;
    audienceType: AudienceType;
    audienceRef?: string | null;
    eventId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    log.debug("Creando Notification:", { type: data.type, audienceType: data.audienceType });
    return await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        creatorId: data.creatorId,
        audienceType: data.audienceType,
        audienceRef: data.audienceRef ?? null,
        eventId: data.eventId ?? null,
        metadata: data.metadata ?? {},
      },
      include: {
        creator: {
          select: CREATOR_SELECT,
        },
      },
    });
  }

  // ─── Recipients ─────────────────────────────────────────

  /**
   * Bulk insert recipients for a notification.
   * Uses createMany for optimal performance on GROUP/INDIVIDUAL dispatches.
   */
  async createManyRecipients(
    notificationId: string,
    userIds: string[],
  ) {
    if (userIds.length === 0) return { count: 0 };
    log.debug("Creando recipients en bulk:", { notificationId, count: userIds.length });
    return await prisma.notificationRecipient.createMany({
      data: userIds.map((userId) => ({
        notificationId,
        userId,
        status: RecipientStatus.PENDING,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Find paginated recipients for a user (INDIVIDUAL + GROUP notifications only).
   * Broadcast notifications are merged in the service layer (lazy materialization).
   */
  async findRecipientsByUserId(
    userId: string,
    params: { page: number; limit: number; status?: RecipientStatus },
  ) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationRecipientWhereInput = { userId, deletedAt: null };
    if (status) {
      where.status = status;
    }

    log.debug("Buscando recipients paginados:", { userId, page, limit, status });

    const [totalCount, recipients] = await Promise.all([
      prisma.notificationRecipient.count({ where }),
      prisma.notificationRecipient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: RECIPIENT_WITH_NOTIFICATION_INCLUDE,
      }),
    ]);

    return {
      recipients,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit,
    };
  }

  /**
   * Count unread notifications for a user (explicit recipients only).
   * Broadcast unread count is calculated separately in the service layer.
   */
  async countUnreadByUserId(userId: string): Promise<number> {
    log.debug("Contando notificaciones no leídas:", { userId });
    return await prisma.notificationRecipient.count({
      where: {
        userId,
        status: { not: RecipientStatus.READ },
        deletedAt: null,
      },
    });
  }

  /**
   * Mark a specific recipient as read.
   * Enforces ownership via userId check.
   */
  async markAsRead(recipientId: string, userId: string) {
    log.debug("Marcando notificación como leída:", { recipientId, userId });
    return await prisma.notificationRecipient.updateMany({
      where: {
        id: recipientId,
        userId,
      },
      data: {
        status: RecipientStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    log.debug("Marcando todas las notificaciones como leídas:", { userId });
    return await prisma.notificationRecipient.updateMany({
      where: {
        userId,
        status: { not: RecipientStatus.READ },
      },
      data: {
        status: RecipientStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark a recipient as delivered (realtime delivery confirmation).
   */
  async markAsDelivered(recipientId: string, userId: string) {
    log.debug("Marcando notificación como entregada:", { recipientId, userId });
    return await prisma.notificationRecipient.updateMany({
      where: {
        id: recipientId,
        userId,
        status: RecipientStatus.PENDING,
      },
      data: {
        status: RecipientStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });
  }

  /**
   * Find a specific recipient by ID (for ownership validation).
   */
  async findRecipientById(id: string) {
    return await prisma.notificationRecipient.findUnique({
      where: { id },
      include: RECIPIENT_WITH_NOTIFICATION_INCLUDE,
    });
  }

  /**
   * Soft-delete a recipient (for broadcasts — keeps the row so it won't re-appear).
   */
  async softDeleteRecipient(recipientId: string, userId: string) {
    log.debug("Soft-borrando notificación:", { recipientId, userId });
    return await prisma.notificationRecipient.updateMany({
      where: {
        id: recipientId,
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Hard-delete a recipient (physically removes the row from the database).
   */
  async hardDeleteRecipient(recipientId: string, userId: string) {
    log.debug("Hard-borrando notificación:", { recipientId, userId });

    // Find the recipient first to get the notificationId
    const recipient = await prisma.notificationRecipient.findFirst({
      where: { id: recipientId, userId },
      select: { notificationId: true },
    });

    if (!recipient) return { count: 0 };

    // Delete the recipient
    const result = await prisma.notificationRecipient.deleteMany({
      where: {
        id: recipientId,
        userId,
      },
    });

    // If no recipients remain, also delete the parent Notification and its DomainEvent
    const remainingCount = await prisma.notificationRecipient.count({
      where: { notificationId: recipient.notificationId },
    });

    if (remainingCount === 0) {
      // Fetch the Notification to get the eventId before deleting
      const notification = await prisma.notification.findUnique({
        where: { id: recipient.notificationId },
        select: { eventId: true },
      });

      await prisma.notification.delete({
        where: { id: recipient.notificationId },
      });

      // Delete the DomainEvent if it exists
      if (notification?.eventId) {
        await prisma.domainEvent.delete({
          where: { id: notification.eventId },
        });
        log.debug("DomainEvent también eliminado:", { eventId: notification.eventId });
      }

      log.debug("Notification padre también eliminada (sin recipients restantes):", {
        notificationId: recipient.notificationId,
      });
    }

    return result;
  }

  // ─── Broadcast (Lazy Materialization) ───────────────────

  /**
   * Find all BROADCAST notifications that a user has NOT yet interacted with.
   * These are "virtual" recipients — no NotificationRecipient row exists yet.
   * Used for lazy materialization of broadcast notifications.
   */
  async findUnreadBroadcastsForUser(
    userId: string,
    params: { page: number; limit: number },
  ) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    // Find broadcast notification IDs the user has already interacted with
    const interactedIds = await prisma.notificationRecipient.findMany({
      where: {
        userId,
        notification: { audienceType: AudienceType.BROADCAST },
      },
      select: { notificationId: true },
    });

    const excludeIds = interactedIds.map((r) => r.notificationId);

    const where: Prisma.NotificationWhereInput = {
      audienceType: AudienceType.BROADCAST,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    };

    log.debug("Buscando broadcasts no materializados:", {
      userId,
      excludedCount: excludeIds.length,
    });

    const [totalCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: CREATOR_SELECT,
          },
        },
      }),
    ]);

    return {
      notifications,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit,
    };
  }

  /**
   * Count unread broadcasts for a user (notifications without a recipient row).
   */
  async countUnreadBroadcastsForUser(userId: string): Promise<number> {
    const interactedIds = await prisma.notificationRecipient.findMany({
      where: {
        userId,
        notification: { audienceType: AudienceType.BROADCAST },
      },
      select: { notificationId: true },
    });

    const excludeIds = interactedIds.map((r) => r.notificationId);

    return await prisma.notification.count({
      where: {
        audienceType: AudienceType.BROADCAST,
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      },
    });
  }

  /**
   * Materialize a broadcast notification for a user (create the recipient when they read it).
   */
  async materializeBroadcastRecipient(notificationId: string, userId: string) {
    log.debug("Materializando broadcast recipient:", { notificationId, userId });
    return await prisma.notificationRecipient.upsert({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
      update: {
        status: RecipientStatus.READ,
        readAt: new Date(),
      },
      create: {
        notificationId,
        userId,
        status: RecipientStatus.READ,
        readAt: new Date(),
        deliveredAt: new Date(),
      },
    });
  }

  // ─── User Queries (for audience resolution) ─────────────

  /**
   * Get all active user IDs in the system (for BROADCAST audience resolution).
   */
  async findAllUserIds(): Promise<string[]> {
    log.debug("Obteniendo todos los userIds del sistema.");
    const users = await prisma.user.findMany({
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
}
