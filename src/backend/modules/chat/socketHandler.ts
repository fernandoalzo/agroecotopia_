import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { Role } from "@/types/auth.types";
import logger from "@/utils/logger";
import { socketRateLimiter } from "@/lib/rate-limit";
import { chatService } from "./index";
import eventBus from "@/utils/eventBus";
import { config } from "@/config/config";
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
export function initSocketServer(httpServer: HTTPServer, _prisma: any): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.app.url,
      methods: ["GET", "POST"],
      credentials: true,
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

    // ─── Order rooms ───
    socket.on("join_order", ({ pedidoId }: { pedidoId: string }) => {
      if (pedidoId) {
        socket.join(`order:${pedidoId}`);
        log.debug(`Socket ${socket.id} joined order room: order:${pedidoId}`);
      }
    });

    socket.on("leave_order", ({ pedidoId }: { pedidoId: string }) => {
      if (pedidoId) {
        socket.leave(`order:${pedidoId}`);
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

    // ─── WAF Monitor room ───
    socket.on("join_waf_monitor", (payload?: { role?: string }) => {
      if (payload?.role !== "admin") {
        log.warn(`Socket ${socket.id} attempted to join WAF monitor without admin role`);
        socket.emit("error", { message: "Acceso denegado al monitor WAF" });
        return;
      }
      socket.join("waf:monitor");
      log.debug(`Socket ${socket.id} joined WAF monitor room`);
    });

    socket.on("leave_waf_monitor", () => {
      socket.leave("waf:monitor");
      log.debug(`Socket ${socket.id} left WAF monitor room`);
    });

    socket.on("disconnect", () => {
      log.info("Socket disconnected:", socket.id);
    });
  });

  // ─── Custom Bridges (routing complejo, no generalizable) ───

  // notification_dispatched → emite a per-user rooms con nombre distinto
  eventBus.removeAllListeners("notification_dispatched");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("notification_dispatched", (payload: { userIds: string[]; notification: any }) => {
    log.debug("Broadcasting notification_dispatched to private channels", { recipientCount: payload.userIds.length });
    for (const userId of payload.userIds) {
      io.to(`user:${userId}:notifications`).emit("new_notification", payload.notification);
    }
  });

  // notification_broadcast → emite global con nombre distinto
  eventBus.removeAllListeners("notification_broadcast");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.on("notification_broadcast", (payload: { notification: any }) => {
    log.debug("Broadcasting notification_broadcast globally");
    io.emit("new_notification", payload.notification);
  });

  // ─── Auto-Bridge Genérico ───
  // Los eventos listados aquí se enlazan automáticamente:
  //   - Si el payload contiene _room → se emite solo a esa room (io.to)
  //   - Si no → se emite globalmente (io.emit)
  // Para agregar un nuevo evento en tiempo real, solo hay que:
  //   1. Agregar el nombre al array
  //   2. Emitirlo desde el service/action con eventBus.emit("nombre", payload)
  //   3. (opcional) Si es room-scoped, incluir _room en el payload
  const BRIDGE_EVENTS = [
    "store_request_updated",
    "unread_count_updated",
    "forum:post_created",
    "forum:answer_created",
    "forum:answer_edited",
    "forum:answer_deleted",
    "forum:post_updated",
    "forum:post_deleted",
    "forum:answer_accepted",
    "forum:item_rated",
    "order:created",
    "product:stock_updated",
    "order:status_updated",
    "order:status_updated_user",
    "order:status_updated_store",
    "order:deleted_store",
    "envio:created",
    "envio:status_updated",
    "notification_read_state_changed",
    "order:delivered",
    "product:rating_updated",
    "waf:request_live",
  ] as const;

  for (const eventName of BRIDGE_EVENTS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventBus.removeAllListeners(eventName as string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventBus.on(eventName as string, (payload: any) => {
      const room = payload?._room as string | undefined;
      if (room) {
        log.debug(`Bridging ${eventName} to room ${room}`);
        io.to(room).emit(eventName, payload);
      } else {
        log.debug(`Bridging ${eventName} globally`);
        io.emit(eventName, payload);
      }
    });
  }

  return io;
}
