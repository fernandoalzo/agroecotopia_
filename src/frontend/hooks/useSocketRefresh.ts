"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";

const DEFAULT_EVENTS = ["new_message_notification", "conversation_deleted"] as const;

type UseSocketRefreshOptions = {
  socket?: Socket | null;
  enabled: boolean;
  refresh: () => void | Promise<void>;
  intervalMs?: number;
  events?: readonly string[];
};

export function useSocketRefresh({
  socket,
  enabled,
  refresh,
  intervalMs,
  events = DEFAULT_EVENTS,
}: UseSocketRefreshOptions) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !socket) return;

    let cancelled = false;
    const eventList = [...events];

    const triggerRefresh = () => {
      if (cancelled) return;
      void refreshRef.current();
    };

    triggerRefresh();

    const interval = typeof intervalMs === "number" ? window.setInterval(triggerRefresh, intervalMs) : null;

    eventList.forEach((eventName) => {
      socket.on(eventName, triggerRefresh);
    });

    return () => {
      cancelled = true;
      if (interval !== null) {
        window.clearInterval(interval);
      }
      eventList.forEach((eventName) => {
        socket.off(eventName, triggerRefresh);
      });
    };
  }, [socket, enabled, intervalMs, events.join("|")]);
}
