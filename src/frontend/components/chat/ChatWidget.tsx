"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/frontend/context/SocketContext";
import { MessageSquare, X, Send, Lock, Trash2, Leaf } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { getOrCreateMyConversation, getConversationMessages, markAsRead, deleteConversationAction } from "@/backend/modules/chat/chat.actions";
export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  conversationId: string;
  isRead: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function ChatWidget() {
  const { data: session, status } = useSession();
  const isAdminUser = session?.user?.role === "admin";
  const { socket, isConnected } = useSocket();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lock body scroll when chat is open on mobile
  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Mark admin pages as exempt from rendering the widget
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const isRouteAdmin = isClient && window.location.pathname.startsWith("/admin");

  // Load conversation ID and calculate initial unread count on mount
  useEffect(() => {
    if (!session?.user || isRouteAdmin || isAdminUser) return;

    const initChat = async () => {
      // Show loading indicator only when opening the chat for the first time
      if (isOpen && messages.length === 0) {
        setIsLoading(true);
      }
      try {
        const res = await getOrCreateMyConversation();
        if (res && !("error" in res)) {
          setConversation(res);
          
          // Fetch existing messages to count unread ones
          const msgsRes = await getConversationMessages(res.id);
          if (msgsRes && !("error" in msgsRes)) {
            setMessages(msgsRes);
            if (isOpen) {
              await markAsRead(res.id);
              setUnreadCount(0);
            } else {
              const unread = msgsRes.filter((m: Message) => !m.isRead && m.senderRole === "admin").length;
              setUnreadCount(unread);
            }
          }
        }
      } catch (err) {
        console.error("Error preloading conversation:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [session, isRouteAdmin, isAdminUser, isOpen]);

  // Handle WebSockets connection and event subscriptions
  useEffect(() => {
    if (!socket || !conversation?.id || isRouteAdmin || isAdminUser) return;

    // Join room
    socket.emit("join_room", { conversationId: conversation.id });

    // Listen for new messages
    const handleReceiveMessage = (message: Message) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        // Mark as read if open, otherwise increment unread count
        if (isOpen) {
          markAsRead(conversation.id);
        } else if (message.senderRole === "admin") {
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    // Listen for typing events
    const handleUserTyping = ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
      if (senderId !== session?.user?.id) {
        setIsAdminTyping(isTyping);
      }
    };

    // Listen for conversation deleted by admin in real time
    const handleConversationDeleted = ({ conversationId }: { conversationId: string }) => {
      if (conversation?.id === conversationId) {
        setMessages([]);
        setConversation(null);
        setIsOpen(false);
        setUnreadCount(0);
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("conversation_deleted", handleConversationDeleted);

    return () => {
      socket.emit("leave_room", { conversationId: conversation.id });
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("conversation_deleted", handleConversationDeleted);
    };
  }, [socket, conversation, isOpen, session, isRouteAdmin, isAdminUser]);

  // Scroll to first unread message or bottom whenever messages or typing state changes
  useEffect(() => {
    if (isLoading || messages.length === 0) return;

    const timer = setTimeout(() => {
      if (firstUnreadRef.current) {
        firstUnreadRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, isAdminTyping, isLoading]);

  // Handle typing input status
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (!socket || !conversation?.id || !session?.user?.id) return;

    // Emit typing status
    socket.emit("typing", {
      conversationId: conversation.id,
      senderId: session.user.id,
      isTyping: true,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set timeout to stop typing status after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        conversationId: conversation.id,
        senderId: session.user.id,
        isTyping: false,
      });
    }, 2000);
  };

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !conversation?.id || !session?.user?.id) return;

    // Stop typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing", {
      conversationId: conversation.id,
      senderId: session.user.id,
      isTyping: false,
    });

    // Emit send_message event
    socket.emit("send_message", {
      conversationId: conversation.id,
      content: inputMessage.trim(),
      senderId: session.user.id,
      senderRole: session.user.role || "user",
    });

    setInputMessage("");
  };

  // Delete/Clear my own conversation as a user
  const handleDeleteConversation = async () => {
    if (!conversation?.id || !socket) return;
    setIsDeleting(true);
    try {
      const res = await deleteConversationAction(conversation.id);
      if (res && "error" in (res as any)) {
        console.error("Error deleting user conversation:", (res as any).error);
      } else {
        // Emit socket event to notify other participants in real-time
        socket.emit("delete_conversation", { conversationId: conversation.id });

        // Reset state
        setMessages([]);
        setConversation(null);
        setShowDeleteConfirm(false);
        setIsOpen(false);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error executing deleteConversationAction for user:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isClient || isRouteAdmin || isAdminUser || status !== "authenticated") return null;

  const t = {
    es: {
      title: "Soporte Agroecotopia",
      online: "En línea",
      offline: "Desconectado",
      placeholder: "Escribe tu mensaje...",
      noMessages: "¡Hola! ¿En qué podemos ayudarte hoy?",
      loginRequired: "Por favor, inicia sesión para chatear con soporte.",
      loginBtn: "Iniciar Sesión",
      typing: "El administrador está escribiendo...",
      clearConfirmTitle: "¿Limpiar historial?",
      clearConfirmDesc: "Esta acción vaciará toda la conversación y no se podrá deshacer.",
      clearConfirmBtn: "Vaciar",
      cancelBtn: "Cancelar",
      tooltipClear: "Limpiar chat",
      disconnectedWarning: "Servidor de chat desconectado. Reconectando...",
      disconnectedPlaceholder: "Desconectado...",
    },
    en: {
      title: "Agroecotopia Support",
      online: "Online",
      offline: "Offline",
      placeholder: "Type your message...",
      noMessages: "Hi! How can we help you today?",
      loginRequired: "Please log in to chat with support.",
      loginBtn: "Log In",
      typing: "Support is typing...",
      clearConfirmTitle: "Clear history?",
      clearConfirmDesc: "This will empty all of your conversation history and cannot be undone.",
      clearConfirmBtn: "Clear",
      cancelBtn: "Cancel",
      tooltipClear: "Clear chat",
      disconnectedWarning: "Chat server disconnected. Reconnecting...",
      disconnectedPlaceholder: "Disconnected...",
    },
  }[language === "es" ? "es" : "en"];

  return (
    <div className="fixed bottom-5 right-5 z-[999] md:bottom-8 md:right-8 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 w-full h-full md:absolute md:inset-auto md:bottom-20 md:right-0 md:w-[380px] md:h-[580px] md:rounded-2xl md:border md:border-border/80 md:shadow-2xl flex flex-col overflow-hidden bg-background z-50"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground flex items-center justify-between border-b border-primary/20">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-primary-foreground filter drop-shadow-sm" />
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-primary ${
                      isConnected ? "bg-green-500" : "bg-zinc-400"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-none">{t.title}</h3>
                  <span className="text-[11px] opacity-80">
                    {isConnected ? t.online : t.offline}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {conversation?.id && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 hover:bg-primary-foreground/15 rounded-full transition-colors cursor-pointer"
                    title={t.tooltipClear}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-primary-foreground/15 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-secondary/5 min-h-0">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loading text="" subtext="" className="py-0 scale-75" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none bg-gradient-to-b from-transparent to-primary/[0.02]">
                  {(() => {
                    const { title, subtitle } = (() => {
                      const parts = t.noMessages.split("! ");
                      if (parts.length > 1) {
                        return { title: parts[0] + "!", subtitle: parts[1] };
                      }
                      return { title: t.noMessages, subtitle: "" };
                    })();

                    return (
                      <div className="flex flex-col items-center justify-center">
                        {/* Elegant Logo Container with float animation & radial glow */}
                        <div className="relative mb-6 flex items-center justify-center">
                          {/* Radial glowing background aura */}
                          <div className="absolute inset-0 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse" />
                          
                          {/* Outer pulsing thin ring */}
                          <motion.div
                            initial={{ scale: 0.85, opacity: 0.5 }}
                            animate={{ scale: 1.15, opacity: 0 }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeOut"
                            }}
                            className="absolute w-16 h-16 rounded-full border border-primary/30"
                          />

                          {/* Inner glassmorphism badge with floating animation */}
                          <motion.div
                            animate={{
                              y: [0, -6, 0],
                              rotate: [0, 2, -2, 0]
                            }}
                            transition={{
                              duration: 5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/25 flex items-center justify-center shadow-lg backdrop-blur-sm"
                          >
                            <Leaf className="w-8 h-8 text-primary filter drop-shadow-[0_2px_8px_rgba(34,197,94,0.3)]" />
                          </motion.div>
                        </div>

                        {/* Title - Bold Display font */}
                        <motion.h4 
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.5 }}
                          className="font-display font-black text-2xl text-foreground tracking-tight mb-2"
                        >
                          {title}
                        </motion.h4>

                        {/* Subtitle - Professional clean font */}
                        <motion.p
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                          className="font-sans text-sm text-muted-foreground max-w-[245px] leading-relaxed font-medium"
                        >
                          {subtitle}
                        </motion.p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <>
                  {(() => {
                    const firstUnreadIndex = messages.findIndex(
                      (m) => !m.isRead && m.senderId !== session?.user?.id
                    );
                    return messages.map((msg, idx) => {
                      const isMe = msg.senderId === session?.user?.id;
                      const isFirstUnread = idx === firstUnreadIndex;
                      return (
                        <div
                          key={msg.id}
                          ref={isFirstUnread ? firstUnreadRef : null}
                          className={`flex flex-col max-w-[80%] ${
                            isMe ? "ml-auto items-end" : "mr-auto items-start"
                          }`}
                        >
                          <div
                            className={`p-3 rounded-2xl text-sm shadow-sm ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-card text-card-foreground border border-border/60 rounded-tl-none"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    });
                  })()}
                  {isAdminTyping && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic px-1">
                      <span className="flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </span>
                      <span>{t.typing}</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Box */}
            <div className="border-t border-border bg-background">
              {!isConnected && (
                <div className="px-3 py-1 bg-amber-500/10 border-b border-amber-500/15 text-amber-500 text-[10px] font-medium flex items-center gap-1.5 animate-pulse">
                  <span className="w-1 h-1 bg-amber-500 rounded-full" />
                  {t.disconnectedWarning}
                </div>
              )}
              <form onSubmit={handleSendMessage} className="p-3 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  disabled={!isConnected}
                  placeholder={isConnected ? t.placeholder : t.disconnectedPlaceholder}
                  className="flex-1 h-10 px-3 border border-border hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none bg-secondary/10 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || !isConnected}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-40 disabled:hover:bg-primary shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Local confirmation overlay */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className="w-full max-w-[320px] rounded-2xl bg-card border border-border/80 p-5 shadow-xl flex flex-col items-center text-center"
                  >
                    <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-3 shadow-inner">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground mb-1">
                      {t.clearConfirmTitle}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                      {t.clearConfirmDesc}
                    </p>
                    <div className="flex w-full gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="flex-1 h-9 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-xs transition-all cursor-pointer"
                      >
                        {t.cancelBtn}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteConversation}
                        disabled={isDeleting}
                        className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10 cursor-pointer"
                      >
                        {isDeleting ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          t.clearConfirmBtn
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir chat de soporte"
        className={`relative h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 md:h-16 md:w-16 ${
          isOpen ? "hidden md:flex" : "flex"
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white animate-pulse shadow-md shadow-red-500/30 border-2 border-background">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
