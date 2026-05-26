"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io as ClientIO, Socket } from "socket.io-client";
import logger from "@/utils/logger";
const log = logger.child("src/frontend/context/SocketContext.tsx");

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Default to the standalone WebSocket server port (3001) since it was separated from Next.js
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || window.location.origin.replace(/:\d+$/, ':3001');
    log.info("Connecting to socket server at:", socketUrl);

    // Connect to the unified socket.io server
    const socketInstance = ClientIO(socketUrl, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      log.info("Socket connected client-side");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      log.info("Socket disconnected client-side");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
