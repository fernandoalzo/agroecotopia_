import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";
import logger from "@/utils/logger";
import { socketRateLimiter } from "@/lib/rate-limit";
import { chatService } from "./index";
import eventBus from "@/utils/eventBus";
const log = logger.child("src/backend/modules/chat/socketHandler.ts");

function getSocketChatErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Error enviando el mensaje";

  const messages: Record<string, string> = {
    ORDER_CLOSED: "El chat solo está disponible mientras el pedido esté abierto.",
    UNAUTHORIZED_ACCESS: "No tienes permiso para enviar mensajes en esta conversación.",
    CONVERSATION_NOT_FOUND: "No se encontró la conversación.",
  };

  return messages[error.message] || "Error enviando el mensaje";
}

/**
 * Initializes the Socket.IO server on top of the given HTTP server.
 * Encapsulates all real-time events, database persistence, and room broadcasting.
 *
 * @param httpServer - The Node.js HTTP server.
 * @param prisma - The Prisma Client instance.
 * @returns The initialized Socket.IO server instance.
 */
export function initSocketServer(httpServer: HTTPServer, _prisma: PrismaClient): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    log.info("Socket connected:", socket.id);

    // Join room
    socket.on("join_room", ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.join(`conversation_${conversationId}`);
        log.debug(`Socket ${socket.id} joined room: conversation_${conversationId}`);
      }
    });

    // Leave room
    socket.on("leave_room", ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
        log.debug(`Socket ${socket.id} left room: conversation_${conversationId}`);
      }
    });

    // Handle typing status
    socket.on("typing", ({ conversationId, senderId, isTyping }: { conversationId: string; senderId: string; isTyping: boolean }) => {
      socket.to(`conversation_${conversationId}`).emit("user_typing", {
        senderId,
        isTyping,
      });
    });

    // Handle sending messages
    socket.on("send_message", async ({
      conversationId,
      content,
      isEncrypted,
      encryptionType,
      senderId,
      senderRole,
      replyToId
    }: {
      conversationId: string;
      content: string;
      isEncrypted?: boolean;
      encryptionType?: number;
      senderId: string;
      senderRole: string;
      replyToId?: string
    }) => {
      try {
        if (!conversationId || !content || !senderId) return;

        // Rate Limit check
        try {
          await socketRateLimiter.consume(socket.id);
        } catch (rejRes) {
          log.warn(`[Socket Rate Limit Exceeded] Socket ID: ${socket.id}, User: ${senderId}`);
          socket.emit("error", { message: "Estás enviando mensajes demasiado rápido. Espera un momento." });
          return;
        }

        const normalizedRole = senderRole as Role;
        const message = await chatService.sendRealtimeMessage({
          conversationId,
          content,
          isEncrypted,
          encryptionType,
          senderId,
          senderRole: normalizedRole,
          replyToId,
        });

        // Broadcast the message to the room
        io.to(`conversation_${conversationId}`).emit("receive_message", message);

        // Emit a global event to notify the admin
        io.emit("new_message_notification", {
          conversationId,
          message,
        });

      } catch (error) {
        log.error("Error saving/sending message:", error);
        const message = getSocketChatErrorMessage(error);
        socket.emit("chat_error", { conversationId, message });
        socket.emit("error", { message });
      }
    });

    // Handle deleting conversation
    socket.on("delete_conversation", ({ conversationId }: { conversationId: string }) => {
      log.info(`Conversation deleted: ${conversationId}, broadcasting to room...`);
      io.to(`conversation_${conversationId}`).emit("conversation_deleted", { conversationId });
    });

    // Handle E2EE key synchronization request (e.g., on new device login or decryption failure)
    socket.on("request_key_sync", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      if (conversationId && userId) {
        log.info(`Key sync requested by ${userId} in conversation ${conversationId}`);
        socket.to(`conversation_${conversationId}`).emit("key_sync_needed", { userId });
      }
    });

    socket.on("disconnect", () => {
      log.info("Socket disconnected:", socket.id);
    });
  });

  // Attach eventBus listeners to bridge Server Actions and Socket.IO
  eventBus.removeAllListeners("store_request_updated");
  eventBus.on("store_request_updated", () => {
    log.info("Broadcasting store_request_updated via Socket.IO");
    io.emit("store_request_updated");
  });

  eventBus.removeAllListeners("unread_count_updated");
  eventBus.on("unread_count_updated", (payload) => {
    log.info("Broadcasting unread_count_updated via Socket.IO");
    io.emit("unread_count_updated", payload);
  });

  return io;
}
