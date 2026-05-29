"use client";

import { useEffect, useRef, useMemo } from "react";
import type { Socket } from "socket.io-client";

const DEFAULT_EVENTS = ["new_message_notification", "conversation_deleted", "unread_count_updated"] as const;

type UseSocketRefreshOptions = {
  socket?: Socket | null;
  enabled: boolean;
  refresh: () => void | Promise<void>;
  events?: readonly string[];
};

export function useSocketRefresh({
  socket,
  enabled,
  refresh,
  events = DEFAULT_EVENTS,
}: UseSocketRefreshOptions) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // Memoize the events key so the dependency is a stable string reference
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const eventsKey = useMemo(() => events.join("|"), [events.join("|")]);

  useEffect(() => {
    if (!enabled || !socket) return;

    let cancelled = false;
    const eventList = eventsKey.split("|");

    const triggerRefresh = () => {
      if (cancelled) return;
      void refreshRef.current();
    };

    // Subscribe to socket events only — no immediate call.
    // Consumers should handle their own initial data loading via useEffect.
    eventList.forEach((eventName) => {
      socket.on(eventName, triggerRefresh);
    });

    return () => {
      cancelled = true;
      eventList.forEach((eventName) => {
        socket.off(eventName, triggerRefresh);
      });
    };
  }, [socket, enabled, eventsKey]);
}
