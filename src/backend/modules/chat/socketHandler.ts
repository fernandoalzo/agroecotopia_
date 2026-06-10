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

    // ─── Forum post rooms ───
    socket.on("join_post", ({ postId }: { postId: string }) => {
      if (postId) {
        socket.join(`forum:post:${postId}`);
        log.debug(`Socket ${socket.id} joined forum room: forum:post:${postId}`);
      }
    });

    socket.on("leave_post", ({ postId }: { postId: string }) => {
      if (postId) {
        socket.leave(`forum:post:${postId}`);
      }
    });

    // ─── Notification private channels ───
    socket.on("join_notifications", ({ userId }: { userId: string }) => {
      if (userId) {
        socket.join(`user:${userId}:notifications`);
        log.debug(`Socket ${socket.id} joined notifications room: user:${userId}:notifications`);
      }
    });

    socket.on("leave_notifications", ({ userId }: { userId: string }) => {
      if (userId) {
        socket.leave(`user:${userId}:notifications`);
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

  // ─── Notifications Bridge ───
  eventBus.removeAllListeners("notification_dispatched");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("notification_dispatched", (payload: { userIds: string[]; notification: any }) => {
    log.info("Broadcasting notification_dispatched to private channels", { recipientCount: payload.userIds.length });
    for (const userId of payload.userIds) {
      io.to(`user:${userId}:notifications`).emit("new_notification", payload.notification);
    }
  });

  eventBus.removeAllListeners("notification_broadcast");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("notification_broadcast", (payload: { notification: any }) => {
    log.info("Broadcasting notification_broadcast globally");
    io.emit("new_notification", payload.notification);
  });

  // ─── Forum Events Bridge ───
  eventBus.removeAllListeners("forum:post_created");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("forum:post_created", (payload: { postId: string; post: any }) => {
    log.info(`Broadcasting forum:post_created globally: ${payload.postId}`);
    io.emit("forum:post_created", payload);
  });

  eventBus.removeAllListeners("forum:answer_created");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("forum:answer_created", (payload: { postId: string; answer: any }) => {
    log.info(`Broadcasting forum:answer_created to room forum:post:${payload.postId}`);
    io.to(`forum:post:${payload.postId}`).emit("forum:answer_created", payload);
  });

  eventBus.removeAllListeners("forum:answer_edited");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("forum:answer_edited", (payload: { postId: string; answerId: string; answer: any }) => {
    log.info(`Broadcasting forum:answer_edited to room forum:post:${payload.postId}`);
    io.to(`forum:post:${payload.postId}`).emit("forum:answer_edited", payload);
  });

  eventBus.removeAllListeners("forum:answer_deleted");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("forum:answer_deleted", (payload: { postId: string; answerId: string }) => {
    log.info(`Broadcasting forum:answer_deleted to room forum:post:${payload.postId}`);
    io.to(`forum:post:${payload.postId}`).emit("forum:answer_deleted", payload);
  });

  eventBus.removeAllListeners("forum:post_updated");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("forum:post_updated", (payload: { postId: string; post: any }) => {
    log.info(`Broadcasting forum:post_updated to room forum:post:${payload.postId}`);
    io.to(`forum:post:${payload.postId}`).emit("forum:post_updated", payload);
  });

  eventBus.removeAllListeners("forum:post_deleted");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("forum:post_deleted", (payload: { postId: string }) => {
    log.info(`Broadcasting forum:post_deleted globally`);
    io.emit("forum:post_deleted", payload);
  });

  eventBus.removeAllListeners("forum:answer_accepted");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("forum:answer_accepted", (payload: { postId: string; answerId: string; isAccepted: boolean }) => {
    log.info(`Broadcasting forum:answer_accepted to room forum:post:${payload.postId}`);
    io.to(`forum:post:${payload.postId}`).emit("forum:answer_accepted", payload);
  });

  eventBus.removeAllListeners("forum:item_rated");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("forum:item_rated", (payload: { itemId: string; itemType: string }) => {
    log.info("Broadcasting forum:item_rated globally");
    io.emit("forum:item_rated", payload);
  });

  return io;
}
