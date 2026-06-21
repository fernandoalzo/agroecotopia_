// ─────────────────────────────────────────────────────────────
// Notification System — Centralized TypeScript Types
// ─────────────────────────────────────────────────────────────

// ─── Enums (mirror Prisma enums for client-side usage) ───
// Source: src/backend/prisma/schema/notification.model.prisma — keep in sync!

export const AudienceType = {
  INDIVIDUAL: "INDIVIDUAL",
  GROUP: "GROUP",
  BROADCAST: "BROADCAST",
} as const;

export type AudienceType = keyof typeof AudienceType;

export const RecipientStatus = {
  PENDING: "PENDING",
  DELIVERED: "DELIVERED",
  READ: "READ",
} as const;

export type RecipientStatus = keyof typeof RecipientStatus;

// ─── Creator (lightweight user reference) ───

export interface NotificationCreator {
  id: string;
  name: string | null;
  image: string | null;
}

// ─── Notification (logical unit) ───

export interface NotificationDetail {
  id: string;
  type: string;
  title: string;
  message: string;
  audienceType: AudienceType;
  metadata: Record<string, unknown>;
  createdAt: string;
  creator: NotificationCreator;
}

// ─── Recipient with its parent notification ───

export interface NotificationRecipientWithDetails {
  id: string;
  notificationId: string;
  status: RecipientStatus;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  notification: NotificationDetail;
}

// ─── Paginated response ───

export interface PaginatedNotifications {
  recipients: NotificationRecipientWithDetails[];
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
}

// ─── Dispatch params (used by services calling the engine) ───

export interface DispatchNotificationParams {
  eventType: string;
  actorId: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  notification: {
    type: string;
    title: string;
    message: string;
    audienceType: AudienceType;
    audienceRef?: string;
    metadata?: Record<string, unknown>;
  };
}

// ─── Realtime payload (sent over Socket.IO) ───

export interface RealtimeNotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  creator: NotificationCreator;
}

// ─── Broadcast virtual notification (lazy materialization) ───

export interface VirtualBroadcastNotification {
  id: string; // virtual ID: `broadcast:${notificationId}`
  notificationId: string;
  status: RecipientStatus;
  readAt: null;
  deliveredAt: null;
  createdAt: string;
  notification: NotificationDetail;
}
