import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { PrismaClient } from "@prisma/client";
import logger from "@/utils/logger";
const log = logger.child("src/backend/modules/chat/socketHandler.ts");

/**
 * Initializes the Socket.IO server on top of the given HTTP server.
 * Encapsulates all real-time events, database persistence, and room broadcasting.
 *
 * @param httpServer - The Node.js HTTP server.
 * @param prisma - The Prisma Client instance.
 * @returns The initialized Socket.IO server instance.
 */
export function initSocketServer(httpServer: HTTPServer, prisma: PrismaClient): Server {
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
    socket.on("send_message", async ({ conversationId, content, isEncrypted, encryptionType, senderId, senderRole, replyToId }: { conversationId: string; content: string; isEncrypted?: boolean; encryptionType?: number; senderId: string; senderRole: string; replyToId?: string }) => {
      try {
        if (!conversationId || !content || !senderId) return;

        // Save message to database (with optional reply reference)
        const message = await prisma.message.create({
          data: {
            content,
            isEncrypted: isEncrypted || false,
            encryptionType: encryptionType || 0,
            senderId,
            senderRole: senderRole as any,
            conversationId,
            ...(replyToId ? { replyToId } : {}),
          },
          include: {
            replyTo: {
              select: {
                id: true,
                content: true,
                senderId: true,
                senderRole: true,
                isEncrypted: true,
                encryptionType: true,
              },
            },
          },
        });

        // Update conversation updatedAt timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
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
        socket.emit("error", { message: "Error enviando el mensaje" });
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

  return io;
}
