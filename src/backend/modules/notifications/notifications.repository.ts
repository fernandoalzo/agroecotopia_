import prisma from "@/backend/db/prisma";
import type { AudienceType } from "@prisma/client";
import { Prisma, RecipientStatus } from "@prisma/client";
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

type RawBroadcastRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  creatorId: string;
  audienceType: string;
  audienceRef: string | null;
  eventId: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  creator_id: string;
  creator_name: string | null;
  creator_image: string | null;
};

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
    const result = await prisma.notificationRecipient.createMany({
      data: userIds.map((userId) => ({
        notificationId,
        userId,
        status: RecipientStatus.PENDING,
      })),
    });
    if (result.count > 0) {
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { unreadNotificationCount: { increment: 1 } },
      });
    }
    return result;
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

    // Use limit+1 to determine hasMore without a separate COUNT query
    const allRecipients = await prisma.notificationRecipient.findMany({
      where,
      skip,
      take: limit + 1,
      orderBy: { createdAt: "desc" },
      include: RECIPIENT_WITH_NOTIFICATION_INCLUDE,
    });

    const hasMore = allRecipients.length > limit;
    const recipients = hasMore ? allRecipients.slice(0, limit) : allRecipients;
    // Approximate totalCount — only used to compute hasMore via totalPages
    const totalCount = hasMore ? (page - 1) * limit + limit + 1 : (page - 1) * limit + recipients.length;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      recipients,
      totalCount,
      totalPages,
      page,
      limit,
    };
  }

  /**
   * Count unread notifications for a user (explicit recipients only).
   * Broadcast unread count is calculated separately in the service layer.
   */
  async countUnreadByUserId(userId: string): Promise<number> {
    log.debug("Leyendo contador de no leídas:", { userId });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { unreadNotificationCount: true },
    });
    return user?.unreadNotificationCount ?? 0;
  }

  /**
   * Mark a specific recipient as read.
   * Enforces ownership via userId check.
   */
  async markAsRead(recipientId: string, userId: string) {
    log.debug("Marcando notificación como leída:", { recipientId, userId });
    const result = await prisma.notificationRecipient.updateMany({
      where: {
        id: recipientId,
        userId,
        status: { not: RecipientStatus.READ },
      },
      data: {
        status: RecipientStatus.READ,
        readAt: new Date(),
      },
    });
    if (result.count > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { unreadNotificationCount: { decrement: 1 } },
      });
    }
    return result;
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    log.debug("Marcando todas las notificaciones como leídas:", { userId });
    const result = await prisma.notificationRecipient.updateMany({
      where: {
        userId,
        status: { not: RecipientStatus.READ },
      },
      data: {
        status: RecipientStatus.READ,
        readAt: new Date(),
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { unreadNotificationCount: 0 },
    });
    return result;
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
    const recipient = await prisma.notificationRecipient.findFirst({
      where: { id: recipientId, userId, status: { not: RecipientStatus.READ }, deletedAt: null },
      select: { id: true },
    });
    const result = await prisma.notificationRecipient.updateMany({
      where: { id: recipientId, userId },
      data: { deletedAt: new Date() },
    });
    if (recipient) {
      await prisma.user.update({
        where: { id: userId },
        data: { unreadNotificationCount: { decrement: 1 } },
      });
    }
    return result;
  }

  /**
   * Hard-delete a recipient (physically removes the row from the database).
   */
  async hardDeleteRecipient(recipientId: string, userId: string) {
    log.debug("Hard-borrando notificación:", { recipientId, userId });

    const recipient = await prisma.notificationRecipient.findFirst({
      where: { id: recipientId, userId },
      select: { notificationId: true, status: true },
    });

    if (!recipient) return { count: 0 };

    const result = await prisma.notificationRecipient.deleteMany({
      where: { id: recipientId, userId },
    });

    if (recipient.status !== RecipientStatus.READ && result.count > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { unreadNotificationCount: { decrement: 1 } },
      });
    }

    const remainingCount = await prisma.notificationRecipient.count({
      where: { notificationId: recipient.notificationId },
    });

    if (remainingCount === 0) {
      const notification = await prisma.notification.findUnique({
        where: { id: recipient.notificationId },
        select: { eventId: true },
      });

      await prisma.notification.delete({
        where: { id: recipient.notificationId },
      });

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
   * Use NOT EXISTS anti-join instead of JOIN + NOT IN for optimal performance.
   * Scans Notification by audienceType (small set) and checks each against
   * NotificationRecipient via the unique index on (notificationId, userId).
   */
  async findUnreadBroadcastsForUser(
    userId: string,
    params: { page: number; limit: number },
  ) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    log.debug("Buscando broadcasts no materializados:", { userId });

    const allRows: RawBroadcastRow[] = await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          n.id, n.type, n.title, n.message, n."creatorId",
          n."audienceType", n."audienceRef", n."eventId",
          n.metadata, n."createdAt",
          u.id AS creator_id, u.name AS creator_name, u.image AS creator_image
        FROM "Notification" n
        LEFT JOIN "User" u ON u.id = n."creatorId"
        WHERE n."audienceType" = 'BROADCAST'
          AND NOT EXISTS (
            SELECT 1 FROM "NotificationRecipient" nr
            WHERE nr."notificationId" = n.id AND nr."userId" = ${userId}
          )
        ORDER BY n."createdAt" DESC
        LIMIT ${limit + 1}
        OFFSET ${skip}
      `,
    );

    const hasMore = allRows.length > limit;
    const rows = hasMore ? allRows.slice(0, limit) : allRows;
    const notifications = rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      creatorId: r.creatorId,
      audienceType: r.audienceType,
      audienceRef: r.audienceRef,
      eventId: r.eventId,
      metadata: r.metadata,
      createdAt: r.createdAt,
      creator: {
        id: r.creator_id,
        name: r.creator_name,
        image: r.creator_image,
      },
    }));

    const totalCount = hasMore ? skip + limit + 1 : skip + rows.length;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      notifications,
      totalCount,
      totalPages,
      page,
      limit,
    };
  }

  /**
   * Count unread broadcasts using NOT EXISTS anti-join.
   * Limits to 100 rows — UI caps display at "99+".
   */
  async countUnreadBroadcastsForUser(userId: string): Promise<number> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM (
          SELECT 1 FROM "Notification" n
          WHERE n."audienceType" = 'BROADCAST'
            AND NOT EXISTS (
              SELECT 1 FROM "NotificationRecipient" nr
              WHERE nr."notificationId" = n.id AND nr."userId" = ${userId}
            )
          LIMIT 100
        ) sub
      `,
    );

    return Number(result[0]?.count ?? 0);
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

  // ─── TTL / Purge ────────────────────────────────────────

  /**
   * Purge NotificationRecipient rows older than `before` that have been READ.
   * Also cleans up orphaned Notification and DomainEvent rows.
   * Designed to be called by a cron job (e.g., daily at midnight).
   * Returns the number of recipients deleted.
   */
  async purgeOldNotifications(before: Date): Promise<number> {
    log.info("Purgando notificaciones anteriores a:", { before });

    // Delete old recipient rows (only those already READ to avoid data loss)
    const deleted = await prisma.notificationRecipient.deleteMany({
      where: {
        createdAt: { lt: before },
        status: RecipientStatus.READ,
        deletedAt: null,
      },
    });

    if (deleted.count === 0) return 0;

    // Clean up orphaned Notifications (no remaining recipients)
    const orphanedNotifications = await prisma.notification.findMany({
      where: {
        recipients: { none: {} },
      },
      select: { id: true, eventId: true },
    });

    if (orphanedNotifications.length > 0) {
      const orphanedIds = orphanedNotifications.map((n) => n.id);
      const eventIds = orphanedNotifications
        .map((n) => n.eventId)
        .filter((id): id is string => id !== null);

      await prisma.notification.deleteMany({
        where: { id: { in: orphanedIds } },
      });

      if (eventIds.length > 0) {
        await prisma.domainEvent.deleteMany({
          where: { id: { in: eventIds } },
        });
      }

      log.info("Limpieza de notificaciones completada:", {
        recipientsDeleted: deleted.count,
        notificationsDeleted: orphanedIds.length,
        eventsDeleted: eventIds.length,
      });
    }

    return deleted.count;
  }

  /**
   * Initialize unreadNotificationCount for all existing users.
   * One-time operation — safe to run multiple times (idempotent).
   */
  async initializeUnreadCounters(): Promise<number> {
    log.info("Inicializando contadores de no leídas para todos los usuarios...");
    const result = await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "User" u
        SET "unreadNotificationCount" = (
          SELECT COUNT(*)::int
          FROM "NotificationRecipient" nr
          WHERE nr."userId" = u.id
            AND nr."status" != 'READ'
            AND nr."deletedAt" IS NULL
        )
      `,
    );
    log.info("Contadores inicializados — usuarios actualizados:", result);
    return result;
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
