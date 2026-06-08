"use client";

import React, { createContext, useCallback, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "./SocketContext";
import { useSocketRefresh } from "@/frontend/hooks/useSocketRefresh";
import {
  getMyNotificationsAction,
  getMyUnreadCountAction,
  getNotificationInitialDataAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
} from "@/backend/modules/notifications/notifications.actions";
import logger from "@/utils/logger";
import { RecipientStatus } from "@prisma/client";

import type { NotificationRecipientWithDetails } from "@/types/notification.types";

const log = logger.child();

type NotificationContextType = {
  unreadCount: number;
  notifications: NotificationRecipientWithDetails[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  markAsRead: (recipientId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (recipientId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
};

export const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const userId = session?.user?.id;

  const [notifications, setNotifications] = useState<NotificationRecipientWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 20;

  const initialized = useRef(false);

  // 1. Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await getMyUnreadCountAction();
      if (typeof result === "number") {
        setUnreadCount(result);
      }
    } catch (error) {
      log.error("Error fetching unread count:", error);
    }
  }, [userId]);

  // 2. Fetch notifications (paginated)
  const fetchNotifications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!userId) return;
    try {
      if (!append) setIsLoading(true);
      const result = await getMyNotificationsAction(pageNum, LIMIT);

      if ("error" in result) {
        log.error("Error fetching notifications:", result.error);
        return;
      }

      setNotifications((prev) => (append ? [...prev, ...result.recipients] : result.recipients));
      setHasMore(result.page < result.totalPages);
      setPage(result.page);
    } catch (error) {
      log.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Combined initial load — single action, single auth check, parallel queries
  const fetchInitialData = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const result = await getNotificationInitialDataAction();
      if ("error" in result) {
        log.error("Error fetching initial notification data:", result.error);
        return;
      }
      setUnreadCount(result.unreadCount);
      setNotifications(result.recipients);
      setHasMore(result.page < result.totalPages);
      setPage(result.page);
    } catch (error) {
      log.error("Failed to fetch initial notification data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (userId && !initialized.current) {
      initialized.current = true;
      fetchInitialData();
    }
  }, [userId, fetchInitialData]);

  // Realtime Socket.IO connection
  useEffect(() => {
    if (isConnected && socket && userId) {
      log.debug("Joining notifications room via WS", { userId });
      socket.emit("join_notifications", { userId });

      return () => {
        socket.emit("leave_notifications", { userId });
      };
    }
  }, [isConnected, socket, userId]);

  // Handle incoming realtime notifications
  const handleNewNotification = useCallback(() => {
    // When a new notification arrives, refresh the lists
    fetchUnreadCount();
    fetchNotifications(1, false); // Reload first page to show the new one at the top
  }, [fetchUnreadCount, fetchNotifications]);

  // Use the event-driven socket refresh hook
  useSocketRefresh({
    socket,
    enabled: !!userId,
    refresh: handleNewNotification,
    events: ["new_notification", "notification_read_state_changed"],
  });

  // Actions
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchNotifications(page + 1, true);
  }, [hasMore, isLoading, page, fetchNotifications]);

  const markAsRead = useCallback(async (recipientId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === recipientId
          ? { ...n, status: RecipientStatus.READ, readAt: new Date().toISOString() }
          : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    const result = await markNotificationAsReadAction(recipientId);
    if (result.error) {
      // Revert on failure (simplified)
      fetchUnreadCount();
      fetchNotifications(1, false);
    }
  }, [fetchUnreadCount, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: RecipientStatus.READ, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    const result = await markAllNotificationsAsReadAction();
    if (result.error) {
      fetchUnreadCount();
      fetchNotifications(1, false);
    }
  }, [fetchUnreadCount, fetchNotifications]);

  const deleteNotification = useCallback(async (recipientId: string) => {
    // Optimistic update: remove from list
    const notificationToDelete = notifications.find(n => n.id === recipientId);
    if (notificationToDelete && notificationToDelete.status !== RecipientStatus.READ) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    setNotifications(prev => prev.filter(n => n.id !== recipientId));

    const result = await deleteNotificationAction(recipientId);
    if (result?.error) {
      fetchUnreadCount();
      fetchNotifications(1, false);
    }
  }, [notifications, fetchUnreadCount, fetchNotifications]);

  const refreshNotifications = useCallback(async () => {
    await fetchUnreadCount();
    await fetchNotifications(1, false);
  }, [fetchUnreadCount, fetchNotifications]);

  const value = {
    unreadCount,
    notifications,
    isLoading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
