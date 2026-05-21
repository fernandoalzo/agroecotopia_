"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/frontend/context/SocketContext";
import { MessageSquare, X, Send, Lock, Trash2, Leaf, Copy, Check } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { getOrCreateMyConversation, getConversationMessages, markAsRead, deleteConversationAction } from "@/backend/modules/chat/chat.actions";
import { SignalService } from "@/frontend/lib/signalService";
import { signalStore } from "@/frontend/lib/signalStore";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/chat/ChatWidget.tsx");

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  conversationId: string;
  isRead: boolean;
  isEncrypted?: boolean;
  encryptionType?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    senderRole: string;
    isEncrypted?: boolean;
    encryptionType?: number;
  } | null;
}

export default function ChatWidget() {
  const { data: session, status } = useSession();
  const isAdminUser = session?.user?.role === "admin";
  const chatUserId = session?.user?.id;
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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isE2EEReady, setIsE2EEReady] = useState(false);
  const [viewportHeight, setViewportHeight] = useState("100vh");

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasNewKeysRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolledRef = useRef(false);

  // Reset initial scroll state when widget opens or conversation ID changes
  useEffect(() => {
    hasInitialScrolledRef.current = false;
  }, [isOpen, conversation?.id]);


  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Lock body/html scroll and track visual viewport height when chat is open on mobile
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || window.innerWidth >= 768) return;

    const html = document.documentElement;
    const body = document.body;

    const originalHtmlHeight = html.style.height;
    const originalHtmlOverflow = html.style.overflow;
    const originalHtmlOverscroll = html.style.overscrollBehavior;
    const originalBodyHeight = body.style.height;
    const originalBodyOverflow = body.style.overflow;
    const originalBodyPosition = body.style.position;
    const originalBodyWidth = body.style.width;
    const originalBodyOverscroll = body.style.overscrollBehavior;

    html.style.height = "100%";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.overscrollBehavior = "none";

    const vv = window.visualViewport;
    const handleResize = () => {
      if (vv) {
        setViewportHeight(`${vv.height}px`);
        if (vv.offsetTop !== 0 || vv.offsetLeft !== 0) {
          window.scrollTo(0, 0);
        }
      }
    };

    if (vv) {
      vv.addEventListener("resize", handleResize);
      vv.addEventListener("scroll", handleResize);
      handleResize();
    }

    const handleScroll = () => {
      if (window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      html.style.height = originalHtmlHeight;
      html.style.overflow = originalHtmlOverflow;
      html.style.overscrollBehavior = originalHtmlOverscroll;
      body.style.height = originalBodyHeight;
      body.style.overflow = originalBodyOverflow;
      body.style.position = originalBodyPosition;
      body.style.width = originalBodyWidth;
      body.style.overscrollBehavior = originalBodyOverscroll;

      if (vv) {
        vv.removeEventListener("resize", handleResize);
        vv.removeEventListener("scroll", handleResize);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  // Prevent touchmove on non-scrollable areas (header, input) to stop page panning
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || window.innerWidth >= 768) return;
    const container = chatContainerRef.current;
    if (!container) return;

    const handleTouchMove = (e: TouchEvent) => {
      const scrollable = messagesScrollRef.current;
      // Allow scrolling only inside the messages area
      if (scrollable && scrollable.contains(e.target as Node)) return;
      e.preventDefault();
    };

    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOpen]);

  // Mark admin pages as exempt from rendering the widget
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const isRouteAdmin = isClient && window.location.pathname.startsWith("/admin");

  useEffect(() => {
    if (status !== "authenticated" || !chatUserId || isRouteAdmin || isAdminUser) return;
    const initE2EE = async () => {
      try {
        signalStore.setUserId(chatUserId);
        const didRegister = await SignalService.registerDevice();
        if (didRegister) {
          hasNewKeysRef.current = true;
        }
        setIsE2EEReady(config.chat.enableE2EE);
      } catch (err) {
        log.error("Fallo al inicializar Signal E2EE:", err);
      }
    };
    initE2EE();
  }, [chatUserId, status, isRouteAdmin, isAdminUser]);

  // Load conversation ID and calculate initial unread count on mount
  useEffect(() => {
    if (!chatUserId || isRouteAdmin || isAdminUser) return;

    let isCancelled = false;

    const initChat = async () => {
      // Show loading indicator only when opening the chat for the first time
      if (isOpen && messages.length === 0) {
        setIsLoading(true);
      }
      try {
        signalStore.setUserId(chatUserId);

        const res = await getOrCreateMyConversation();
        if (isCancelled) return;
        if (res && !("error" in res)) {
          setConversation(res);

          // Fetch existing messages to count unread ones
          const msgsRes = await getConversationMessages(res.id);
          if (isCancelled) return;
          if (msgsRes && !("error" in msgsRes)) {
            // Descifrar historial de mensajes
            const decryptedMsgs = await Promise.all(msgsRes.map(async (m: Message) => {
              let decryptedContent = m.content;
              let decryptedReplyContent = m.replyTo?.content;

              if (m.isEncrypted) {
                try {
                  const targetId = m.senderId === chatUserId ? "admin" : m.senderId;
                  decryptedContent = await SignalService.decryptMessage(targetId, m.content, m.encryptionType || 1);
                } catch (e) {
                  decryptedContent = "🔒 Mensaje de otra sesión";
                }
              }

              if (m.replyTo && m.replyTo.isEncrypted && m.replyTo.content) {
                try {
                  const replyTargetId = m.replyTo.senderId === chatUserId ? "admin" : m.replyTo.senderId;
                  decryptedReplyContent = await SignalService.decryptMessage(replyTargetId, m.replyTo.content, m.replyTo.encryptionType || 1);
                } catch (e) {
                  decryptedReplyContent = "🔒 Mensaje de otra sesión";
                }
              }

              return {
                ...m,
                content: decryptedContent,
                replyTo: m.replyTo ? {
                  ...m.replyTo,
                  content: decryptedReplyContent || ""
                } : null
              };
            }));

            if (!isCancelled) {
              setMessages(decryptedMsgs);
              if (isOpen) {
                await markAsRead(res.id);
                setUnreadCount(0);
              } else {
                const unread = msgsRes.filter((m: Message) => !m.isRead && m.senderRole === "admin").length;
                setUnreadCount(unread);
              }
            }
          }
        }
      } catch (err) {
        log.error("Error preloading conversation:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    initChat();

    return () => {
      isCancelled = true;
    };
  }, [chatUserId, isRouteAdmin, isAdminUser, isOpen]);

  // Handle WebSockets connection and event subscriptions
  useEffect(() => {
    if (!socket || !conversation?.id || isRouteAdmin || isAdminUser) return;

    // Join room
    socket.emit("join_room", { conversationId: conversation.id });

    // Request key sync if we registered a new key during initialization
    if (hasNewKeysRef.current && chatUserId) {
      log.info("Emitting request_key_sync due to new device registration");
      socket.emit("request_key_sync", { conversationId: conversation.id, userId: chatUserId });
      hasNewKeysRef.current = false;
    }

    // Listen for key synchronization requests from other users
    const handleKeySyncNeeded = async ({ userId }: { userId: string }) => {
      if (userId !== chatUserId) {
        log.info(`Clearing E2EE session for ${userId} because they changed device/key`);
        await signalStore.removeSession(userId);
        try {
          const bundle = await SignalService.fetchBundle(userId);
          const encoder = new TextEncoder();
          await signalStore.storeSession(userId, encoder.encode(bundle.signedPreKey.publicKey));
          log.info(`Successfully updated E2EE key for ${userId}`);
        } catch (e) {
          log.error(`Failed to refresh key for ${userId} during sync:`, e);
        }
      }
    };

    // Listen for new messages
    const handleReceiveMessage = async (message: Message) => {
      if (message.conversationId === conversation.id) {
        let finalMessage = { ...message };

        // Descifrar mensaje entrante si está encriptado
        if (message.isEncrypted) {
          try {
            const targetId = message.senderId === chatUserId ? "admin" : message.senderId;
            const decryptedContent = await SignalService.decryptMessage(targetId, message.content, message.encryptionType || 1);
            finalMessage.content = decryptedContent;
          } catch (e) {
            finalMessage.content = "🔒 Mensaje de otra sesión";
          }
        }

        // Descifrar mensaje citado si existe y está cifrado
        if (message.replyTo && message.replyTo.isEncrypted && message.replyTo.content) {
          try {
            const replyTargetId = message.replyTo.senderId === chatUserId ? "admin" : message.replyTo.senderId;
            const decryptedReplyContent = await SignalService.decryptMessage(replyTargetId, message.replyTo.content, message.replyTo.encryptionType || 1);
            finalMessage.replyTo = {
              ...message.replyTo,
              content: decryptedReplyContent
            };
          } catch (e) {
            finalMessage.replyTo = {
              ...message.replyTo,
              content: "🔒 Mensaje de otra sesión"
            };
          }
        }

        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === finalMessage.id)) return prev;
          return [...prev, finalMessage];
        });

        // Mark as read if open, otherwise increment unread count
        if (isOpenRef.current) {
          markAsRead(conversation.id);
        } else if (message.senderRole === "admin") {
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    // Listen for typing events
    const handleUserTyping = ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
      if (senderId !== chatUserId) {
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
    socket.on("key_sync_needed", handleKeySyncNeeded);

    return () => {
      socket.emit("leave_room", { conversationId: conversation.id });
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("conversation_deleted", handleConversationDeleted);
      socket.off("key_sync_needed", handleKeySyncNeeded);
    };
  }, [socket, conversation?.id, chatUserId, isRouteAdmin, isAdminUser]);

  // Scroll to first unread message or bottom whenever messages or typing state changes
  useEffect(() => {
    if (isLoading || messages.length === 0) return;

    const timer = setTimeout(() => {
      const container = messagesScrollRef.current;
      if (!container) return;

      if (!hasInitialScrolledRef.current) {
        if (firstUnreadRef.current) {
          const element = firstUnreadRef.current;
          const containerRect = container.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
          const targetScrollTop = relativeTop - (containerRect.height / 2) + (elementRect.height / 2);
          container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: "smooth"
          });
        } else {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "auto" // Scroll instantly on initial load for optimal UX
          });
        }
        hasInitialScrolledRef.current = true;
      } else {
        // Always scroll to the bottom smoothly for incoming/outgoing messages as the chat progresses
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
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
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !conversation?.id || !session?.user?.id) {
      inputRef.current?.focus();
      return;
    }

    // Stop typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing", {
      conversationId: conversation.id,
      senderId: session.user.id,
      isTyping: false,
    });

    let finalContent = inputMessage.trim();
    let isEncrypted = false;
    let encryptionType = 0;

    // Cifrar el mensaje antes de enviarlo
    if (config.chat.enableE2EE) {
      if (!isE2EEReady) {
        log.warn("E2EE está activado pero no está listo aún. Esperando...");
        inputRef.current?.focus();
        return;
      }
      try {
        const encrypted = await SignalService.encryptMessage("admin", finalContent);
        finalContent = encrypted.ciphertext;
        isEncrypted = encrypted.type !== 0;
        encryptionType = encrypted.type;
      } catch (err) {
        log.error("Error cifrando el mensaje, no se enviará en texto plano por seguridad:", err);
        inputRef.current?.focus();
        return; // Previene el envío en texto plano si falla
      }
    }

    // Emit send_message event
    socket.emit("send_message", {
      conversationId: conversation.id,
      content: finalContent,
      isEncrypted,
      encryptionType,
      senderId: session.user.id,
      senderRole: session.user.role || "user",
      ...(replyingTo ? { replyToId: replyingTo.id } : {}),
    });

    setInputMessage("");
    setReplyingTo(null);

    // Mantiene el foco en el input para evitar que se cierre el teclado en móviles
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Delete/Clear my own conversation as a user
  const handleDeleteConversation = async () => {
    if (!conversation?.id || !socket) return;
    setIsDeleting(true);
    try {
      const res = await deleteConversationAction(conversation.id);
      if (res && "error" in (res as any)) {
        log.error("Error deleting user conversation:", (res as any).error);
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
      log.error("Error executing deleteConversationAction for user:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isClient || isRouteAdmin || isAdminUser || status !== "authenticated") return null;

  const t = {
    es: {
      title: `Soporte ${config.app.name}`,
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
      replyingTo: "Respondiendo a",
    },
    en: {
      title: `${config.app.name} Support`,
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
      replyingTo: "Replying to",
    },
  }[language === "es" ? "es" : "en"];

  return (
    <>
      {/* Dynamic backdrop with soft photographic blur (depth of field focus effect) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/35 backdrop-blur-[3px] z-[998] cursor-pointer"
          />
        )}
      </AnimatePresence>

      <div
        className={isClient && isOpen && window.innerWidth < 768
          ? "fixed inset-x-0 top-0 bottom-auto z-[999] font-sans"
          : "fixed bottom-5 right-5 z-[999] md:bottom-8 md:right-8 font-sans"
        }
        style={isClient && isOpen && window.innerWidth < 768 ? { height: viewportHeight } : undefined}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              ref={chatContainerRef}
              className="relative w-full h-full md:absolute md:inset-auto md:bottom-20 md:right-0 md:w-[380px] md:h-[580px] md:rounded-2xl md:border md:border-border/80 md:shadow-2xl flex flex-col overflow-hidden bg-background z-50"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground flex items-center justify-between border-b border-primary/20">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-primary-foreground filter drop-shadow-sm" />
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-primary ${isConnected ? "bg-green-500" : "bg-zinc-400"
                        }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-none flex items-center gap-1.5">
                      {t.title}
                      {isE2EEReady && <span title="Cifrado de extremo a extremo"><Lock className="w-3.5 h-3.5 text-primary-foreground/80" /></span>}
                    </h3>
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
              <div ref={messagesScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-secondary/5 min-h-0 overscroll-y-contain">
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
                            className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"
                              }`}
                          >
                            <div
                              onClick={() => setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}
                              className={`p-3 rounded-2xl text-sm shadow-sm relative group/msg ${isMe
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-card text-card-foreground border border-border/60 rounded-tl-none"
                                } md:cursor-default cursor-pointer`}
                            >
                              {msg.replyTo && (
                                <div className={`mb-1.5 p-2 rounded-lg text-xs border-l-2 ${isMe
                                  ? "bg-primary-foreground/10 border-primary-foreground/40 text-primary-foreground/80"
                                  : "bg-muted/50 border-primary/40 text-muted-foreground"
                                  }`}>
                                  <div className={`font-semibold mb-0.5 ${isMe ? "text-primary-foreground" : "text-primary/80"}`}>
                                    {msg.replyTo.senderId === session?.user?.id ? "Tú" : t.title}
                                  </div>
                                  <div className="truncate opacity-90">{msg.replyTo.content}</div>
                                </div>
                              )}
                              {msg.content}
                              {/* Desktop: hover-based side buttons */}
                              <div className={`hidden md:flex absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity items-center gap-0.5 ${isMe ? "-left-[60px]" : "-right-[60px]"
                                }`}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopy(msg.id, msg.content); }}
                                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                                  title="Copiar"
                                >
                                  {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReplyingTo(msg);
                                    setTimeout(() => inputRef.current?.focus(), 50);
                                  }}
                                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                                  title="Responder"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
                                </button>
                              </div>
                            </div>
                            {/* Mobile: tap-toggled inline buttons below the bubble */}
                            <AnimatePresence>
                              {activeMessageId === msg.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0, y: -4 }}
                                  animate={{ opacity: 1, height: "auto", y: 0 }}
                                  exit={{ opacity: 0, height: 0, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  className={`flex md:hidden items-center gap-1 mt-1 overflow-hidden ${isMe ? "justify-end" : "justify-start"
                                    }`}
                                >
                                  <button
                                    onClick={() => handleCopy(msg.id, msg.content)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground text-[11px] font-medium transition-colors"
                                  >
                                    {copiedId === msg.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    {copiedId === msg.id ? "✓" : "Copiar"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyingTo(msg);
                                      setActiveMessageId(null);
                                      setTimeout(() => inputRef.current?.focus(), 50);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground text-[11px] font-medium transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
                                    Responder
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
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
                {replyingTo && (
                  <div className="px-3 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2 border-l-2 border-primary pl-2">
                      <div className="text-[10px] font-semibold text-primary">
                        {t.replyingTo} {replyingTo.senderId === session?.user?.id ? "ti" : t.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{replyingTo.content}</div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="p-1 hover:bg-secondary rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="p-3 flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    onFocus={() => {
                      // Force viewport scroll reset during keyboard show
                      let count = 0;
                      const interval = setInterval(() => {
                        window.scrollTo(0, 0);
                        count++;
                        if (count > 10) clearInterval(interval);
                      }, 50);
                    }}
                    disabled={!isConnected}
                    placeholder={isConnected ? t.placeholder : t.disconnectedPlaceholder}
                    className="flex-1 h-10 px-3 border border-border hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none bg-secondary/10 transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={!inputMessage.trim() || !isConnected || (config.chat.enableE2EE && !isE2EEReady)}
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
          className={`relative h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 md:h-16 md:w-16 ${isOpen ? "hidden md:flex" : "flex"
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
    </>
  );
}
