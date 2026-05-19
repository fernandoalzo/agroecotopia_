const { createServer } = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Join room
  socket.on("join_room", ({ conversationId }) => {
    if (conversationId) {
      socket.join(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} joined room: conversation_${conversationId}`);
    }
  });

  // Leave room
  socket.on("leave_room", ({ conversationId }) => {
    if (conversationId) {
      socket.leave(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} left room: conversation_${conversationId}`);
    }
  });

  // Handle typing status
  socket.on("typing", ({ conversationId, senderId, isTyping }) => {
    socket.to(`conversation_${conversationId}`).emit("user_typing", {
      senderId,
      isTyping,
    });
  });

  // Handle sending messages
  socket.on("send_message", async ({ conversationId, content, senderId, senderRole }) => {
    try {
      if (!conversationId || !content || !senderId) return;

      // Save message to database
      const message = await prisma.message.create({
        data: {
          content,
          senderId,
          senderRole,
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
  socket.on("delete_conversation", ({ conversationId }) => {
    console.log(`Conversation deleted: ${conversationId}, broadcasting to room...`);
    io.to(`conversation_${conversationId}`).emit("conversation_deleted", { conversationId });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});
