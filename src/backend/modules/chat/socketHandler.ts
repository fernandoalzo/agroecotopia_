import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { PrismaClient } from "@prisma/client";

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
    console.log("Socket connected:", socket.id);

    // Join room
    socket.on("join_room", ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.join(`conversation_${conversationId}`);
        console.log(`Socket ${socket.id} joined room: conversation_${conversationId}`);
      }
    });

    // Leave room
    socket.on("leave_room", ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
        console.log(`Socket ${socket.id} left room: conversation_${conversationId}`);
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
    socket.on("send_message", async ({ conversationId, content, senderId, senderRole }: { conversationId: string; content: string; senderId: string; senderRole: string }) => {
      try {
        if (!conversationId || !content || !senderId) return;

        // Save message to database
        const message = await prisma.message.create({
          data: {
            content,
            senderId,
            senderRole: senderRole as any,
            conversationId,
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
        console.error("Error saving/sending message:", error);
        socket.emit("error", { message: "Error enviando el mensaje" });
      }
    });

    // Handle deleting conversation
    socket.on("delete_conversation", ({ conversationId }: { conversationId: string }) => {
      console.log(`Conversation deleted: ${conversationId}, broadcasting to room...`);
      io.to(`conversation_${conversationId}`).emit("conversation_deleted", { conversationId });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}
