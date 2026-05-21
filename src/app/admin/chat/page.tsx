"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/frontend/context/SocketContext";
import { getAdminConversations, getConversationMessages, markAsRead, deleteConversationAction, getAdminUsersList, getOrCreateConversationForAdmin } from "@/backend/modules/chat/chat.actions";
import { Message } from "@/frontend/components/chat/ChatWidget";
import { SignalService } from "@/frontend/lib/signalService";
import { signalStore } from "@/frontend/lib/signalStore";
import { config } from "@/config/config";
import { Send, MessageSquare, ShieldAlert, ArrowLeft, User, Sparkles, Trash2, Search, ChevronLeft, ChevronRight, UserPlus, X, Copy, Check, Lock } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { motion, AnimatePresence } from "framer-motion";
import logger from "@/utils/logger";

const log = logger.child("src/app/admin/chat/page.tsx");

export default function AdminChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
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

  // User search and navigation states
  const [sidebarTab, setSidebarTab] = useState<"chats" | "users">("chats");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasNewKeysRef = useRef(false);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const activeConvRef = useRef(activeConv);
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  // Lock body/html scroll and track visual viewport height to avoid keyboard layout shifts on mobile
  useEffect(() => {
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
  }, []);

  // Prevent touchmove on non-scrollable areas to stop page panning on mobile
  useEffect(() => {
    const container = pageContainerRef.current;
    if (!container || typeof window === "undefined" || window.innerWidth >= 768) return;

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as Node;
      // Allow scrolling inside messages area or sidebar list
      if (messagesScrollRef.current?.contains(target)) return;
      if (sidebarScrollRef.current?.contains(target)) return;
      e.preventDefault();
    };

    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Guard routing: redirect if not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load conversations list and init E2EE
  // IMPORTANT: Use stable primitive deps to prevent re-running on every render
  const sessionUserId = session?.user?.id;
  const sessionUserRole = session?.user?.role;

  useEffect(() => {
    if (status !== "authenticated" || sessionUserRole !== "admin" || !sessionUserId) return;

    let isCancelled = false;

    const initE2EE = async () => {
      try {
        signalStore.setUserId(sessionUserId);
        const didRegister = await SignalService.registerDevice();
        if (didRegister) {
          hasNewKeysRef.current = true;
        }
        if (!isCancelled) setIsE2EEReady(config.chat.enableE2EE);
      } catch (err) {
        log.error("Error al registrar dispositivo E2EE Admin:", err);
      }
    };
    initE2EE();

    const loadConversations = async () => {
      try {
        const res = await getAdminConversations();
        if (isCancelled) return;
        log.debug("DEBUG: Admin conversations loaded:", JSON.stringify(res, null, 2));
        if (res && !("error" in res)) {
          // Decrypt the last message of each conversation
          const decryptedConversations = await Promise.all(res.map(async (conv: any) => {
            const lastMsg = conv.messages?.[0];
            if (lastMsg && lastMsg.isEncrypted) {
              try {
                const targetId = lastMsg.senderId === sessionUserId ? conv.userId : lastMsg.senderId;
                const decryptedContent = await SignalService.decryptMessage(targetId, lastMsg.content, lastMsg.encryptionType || 1);
                return {
                  ...conv,
                  messages: [{ ...lastMsg, content: decryptedContent }]
                };
              } catch (e) {
                return {
                  ...conv,
                  messages: [{ ...lastMsg, content: "🔒 Mensaje cifrado" }]
                };
              }
            }
            return conv;
          }));
          if (!isCancelled) setConversations(decryptedConversations);
        }
      } catch (err) {
        log.error("Error loading admin conversations:", err);
      } finally {
        if (!isCancelled) setIsLoadingConvs(false);
      }
    };

    loadConversations();

    return () => {
      isCancelled = true;
    };
  }, [status, sessionUserId, sessionUserRole]);

  // Load users list when user searches or paginates
  useEffect(() => {
    if (status !== "authenticated" || sessionUserRole !== "admin" || sidebarTab !== "users") return;

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const res = await getAdminUsersList(searchQuery, usersPage);
        if (res && !("error" in res)) {
          setUsersList(res.users);
          setTotalPages(res.totalPages);
          setTotalUsers(res.totalCount);
        }
      } catch (err) {
        log.error("Error loading users list:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      loadUsers();
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, usersPage, sidebarTab, status, sessionUserRole]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setUsersPage(1);
  }, [searchQuery]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConv || !sessionUserId) return;

    let isCancelled = false;

    const loadMessages = async () => {
      setIsLoadingMsgs(true);
      try {
        signalStore.setUserId(sessionUserId);

        const res = await getConversationMessages(activeConv.id);
        if (isCancelled) return;
        if (res && !("error" in res)) {
          // Descifrar historial de mensajes
          const decryptedMsgs = await Promise.all(res.map(async (m: Message) => {
            let decryptedContent = m.content;
            let decryptedReplyContent = m.replyTo?.content;

            if (m.isEncrypted) {
              try {
                const targetId = m.senderId === sessionUserId ? activeConv.userId : m.senderId;
                decryptedContent = await SignalService.decryptMessage(targetId, m.content, m.encryptionType || 1);
              } catch (e) {
                decryptedContent = "🔒 Mensaje de otra sesión";
              }
            }

            if (m.replyTo && m.replyTo.isEncrypted && m.replyTo.content) {
              try {
                const replyTargetId = m.replyTo.senderId === sessionUserId ? activeConv.userId : m.replyTo.senderId;
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
          if (!isCancelled) setMessages(decryptedMsgs);
        }
        await markAsRead(activeConv.id);
        
        // Reset unread indicator locally in conversations list
        if (!isCancelled) {
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConv.id ? { ...c, unreadCount: 0 } : c))
          );
        }
      } catch (err) {
        log.error("Error loading messages:", err);
      } finally {
        if (!isCancelled) setIsLoadingMsgs(false);
      }
    };

    loadMessages();

    return () => {
      isCancelled = true;
    };
  }, [activeConv, sessionUserId]);

  // Handle Socket events
  useEffect(() => {
    if (!socket || status !== "authenticated" || sessionUserRole !== "admin" || !sessionUserId) return;

    // Listen for global notifications (new messages in any conversation)
    const handleNewMessageNotification = async ({ conversationId, message }: { conversationId: string; message: Message }) => {
      let decryptedMessage = { ...message };
      
      // Decrypt the live incoming message if encrypted
      if (message.isEncrypted) {
        try {
          // Find the active conversation in the current state to know its target user ID
          const targetConv = conversationsRef.current.find((c) => c.id === conversationId);
          const userId = targetConv ? targetConv.userId : message.senderId;
          const targetId = message.senderId === sessionUserId ? userId : message.senderId;
          
          signalStore.setUserId(sessionUserId);
          const decryptedContent = await SignalService.decryptMessage(targetId, message.content, message.encryptionType || 1);
          decryptedMessage.content = decryptedContent;
        } catch (e) {
          decryptedMessage.content = "🔒 Mensaje cifrado";
        }
      }

      // Decrypt quoted message if exists inside the socket payload
      if (message.replyTo && message.replyTo.isEncrypted && message.replyTo.content) {
        try {
          const replyTargetId = message.replyTo.senderId === sessionUserId ? activeConvRef.current?.userId || message.replyTo.senderId : message.replyTo.senderId;
          const decryptedReplyContent = await SignalService.decryptMessage(replyTargetId, message.replyTo.content, message.replyTo.encryptionType || 1);
          decryptedMessage.replyTo = {
            ...message.replyTo,
            content: decryptedReplyContent
          };
        } catch (e) {
          decryptedMessage.replyTo = {
            ...message.replyTo,
            content: "🔒 Mensaje de otra sesión"
          };
        }
      }

      // Update conversations list (move to top, set decrypted last message)
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === conversationId);
        if (index === -1) {
          // If we don't have this conversation in list, reload and decrypt all of them
          getAdminConversations().then(async (res) => {
            if (res && !("error" in res)) {
              const decrypted = await Promise.all(res.map(async (c: any) => {
                const lm = c.messages?.[0];
                if (lm && lm.isEncrypted) {
                  try {
                    const tId = lm.senderId === sessionUserId ? c.userId : lm.senderId;
                    const content = await SignalService.decryptMessage(tId, lm.content, lm.encryptionType || 1);
                    return { ...c, messages: [{ ...lm, content }] };
                  } catch {
                    return { ...c, messages: [{ ...lm, content: "🔒 Mensaje cifrado" }] };
                  }
                }
                return c;
              }));
              setConversations(decrypted);
            }
          });
          return prev;
        }

        const updated = [...prev];
        const conv = { ...updated[index] };
        
        // Update last message with the decrypted variant
        conv.messages = [decryptedMessage];
        conv.updatedAt = decryptedMessage.createdAt;
        
        // Increment unread count if it's not the active conversation and not sent by me
        const currentActiveConv = activeConvRef.current;
        if ((!currentActiveConv || currentActiveConv.id !== conversationId) && message.senderRole !== "admin") {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }

        // Remove from old position and insert at top
        updated.splice(index, 1);
        return [conv, ...updated];
      });

      // If this message belongs to the active conversation, append it
      const currentActiveConv = activeConvRef.current;
      if (currentActiveConv && currentActiveConv.id === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === decryptedMessage.id)) return prev;
          return [...prev, decryptedMessage];
        });
        
        // Mark as read immediately
        if (message.senderRole !== "admin") {
          markAsRead(conversationId);
        }
      }
    };

    // Listen for user typing
    const handleUserTyping = ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
      const currentActiveConv = activeConvRef.current;
      if (currentActiveConv && currentActiveConv.userId === senderId) {
        setIsUserTyping(isTyping);
      }
    };

    // Listen for conversation deleted by user in real time
    const handleConversationDeleted = ({ conversationId }: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      const currentActiveConv = activeConvRef.current;
      if (currentActiveConv && currentActiveConv.id === conversationId) {
        setActiveConv(null);
        setMessages([]);
      }
    };

    // Listen for key synchronization requests from other users
    const handleKeySyncNeeded = async ({ userId }: { userId: string }) => {
      if (userId !== sessionUserId) {
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

    socket.on("new_message_notification", handleNewMessageNotification);
    socket.on("user_typing", handleUserTyping);
    socket.on("conversation_deleted", handleConversationDeleted);
    socket.on("key_sync_needed", handleKeySyncNeeded);

    return () => {
      socket.off("new_message_notification", handleNewMessageNotification);
      socket.off("user_typing", handleUserTyping);
      socket.off("conversation_deleted", handleConversationDeleted);
      socket.off("key_sync_needed", handleKeySyncNeeded);
    };
  }, [socket, status, sessionUserId, sessionUserRole]);

  // Join/leave room on active conversation change
  useEffect(() => {
    if (!socket || !activeConv) return;

    socket.emit("join_room", { conversationId: activeConv.id });

    // Request key sync if we registered a new key during initialization
    if (hasNewKeysRef.current && sessionUserId) {
      log.info("Emitting request_key_sync due to new device registration");
      socket.emit("request_key_sync", { conversationId: activeConv.id, userId: sessionUserId });
      hasNewKeysRef.current = false;
    }

    return () => {
      socket.emit("leave_room", { conversationId: activeConv.id });
      setIsUserTyping(false);
    };
  }, [socket, activeConv?.id, sessionUserId]);

  // Scroll to first unread message or bottom on message change
  useEffect(() => {
    if (isLoadingMsgs || messages.length === 0) return;

    const timer = setTimeout(() => {
      if (firstUnreadRef.current) {
        firstUnreadRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, isUserTyping, isLoadingMsgs]);

  // Handle input change & typing status
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (!socket || !activeConv || !session?.user?.id) return;

    socket.emit("typing", {
      conversationId: activeConv.id,
      senderId: session.user.id,
      isTyping: true,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        conversationId: activeConv.id,
        senderId: session.user.id,
        isTyping: false,
      });
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !activeConv || !session?.user?.id) {
      inputRef.current?.focus();
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing", {
      conversationId: activeConv.id,
      senderId: session.user.id,
      isTyping: false,
    });

    let finalContent = inputMessage.trim();
    let isEncrypted = false;
    let encryptionType = 0;

    // Cifrar el mensaje antes de enviarlo
    if (config.chat.enableE2EE && activeConv.userId) {
      if (!isE2EEReady) {
        log.warn("E2EE está activado pero no está listo aún en Admin. Esperando...");
        inputRef.current?.focus();
        return;
      }
      try {
        const encrypted = await SignalService.encryptMessage(activeConv.userId, finalContent);
        finalContent = encrypted.ciphertext;
        isEncrypted = encrypted.type !== 0;
        encryptionType = encrypted.type;
      } catch (err) {
        log.error("Error cifrando el mensaje admin:", err);
        inputRef.current?.focus();
        return; // Previene el envío en texto plano si falla
      }
    }

    socket.emit("send_message", {
      conversationId: activeConv.id,
      content: finalContent,
      isEncrypted,
      encryptionType,
      senderId: session.user.id,
      senderRole: "admin",
      ...(replyingTo ? { replyToId: replyingTo.id } : {}),
    });

    setInputMessage("");
    setReplyingTo(null);

    // Mantiene el foco en el input para evitar que se cierre el teclado en móviles
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Delete active conversation
  const handleDeleteConversation = async () => {
    if (!activeConv || !socket) return;
    setIsDeleting(true);
    try {
      const res = await deleteConversationAction(activeConv.id);
      if (res && "error" in (res as any)) {
        log.error("Error deleting conversation:", (res as any).error);
      } else {
        // Emit socket event to notify other participants in real-time
        socket.emit("delete_conversation", { conversationId: activeConv.id });

        // Update local state
        setConversations((prev) => prev.filter((c) => c.id !== activeConv.id));
        setActiveConv(null);
        setMessages([]);
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      log.error("Error executing deleteConversationAction:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Select user and get/create conversation
  const handleSelectUserChat = async (targetUserId: string) => {
    setIsLoadingMsgs(true);
    try {
      const res = await getOrCreateConversationForAdmin(targetUserId);
      if (res && !("error" in res)) {
        // Find if this conversation is already in our list
        const existingConv = conversations.find((c) => c.id === res.id);
        
        const fullConv = existingConv || {
          ...res,
          messages: [],
          unreadCount: 0,
        };

        if (!existingConv) {
          // Add to the top of our conversations list
          setConversations((prev) => [fullConv, ...prev]);
        }

        // Set as active
        setActiveConv(fullConv);
        
        // Return to chats tab
        setSidebarTab("chats");
      }
    } catch (err) {
      log.error("Error initiating chat with user:", err);
    } finally {
      setIsLoadingMsgs(false);
    }
  };

  // Guard loading session
  if (status === "loading") {
    return (
      <Loading fullScreen={true} />
    );
  }

  // Guard access denied
  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6 text-center text-foreground pt-14 md:pt-20">
        <div className="p-4 bg-destructive/15 rounded-full text-destructive mb-6">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground max-w-sm mb-8 text-sm">
          No tienes permisos de administrador para acceder a este panel de chat.
        </p>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Inicio
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={pageContainerRef}
      className="fixed inset-x-0 top-0 flex bg-background text-foreground overflow-hidden font-sans pt-14 md:pt-20"
      style={{ height: viewportHeight }}
    >
      {/* Sidebar - list of conversations */}
      <div className={`w-full md:w-[380px] border-r border-border/40 flex flex-col bg-card/40 h-full ${activeConv ? "hidden md:flex" : "flex"}`}>
        <div className="p-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
              title="Volver al Inicio"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary hidden md:block">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-semibold text-base leading-none font-display">Soporte Chat</h1>
                {isE2EEReady && <span title="Cifrado de Extremo a Extremo Activado"><Lock className="w-3.5 h-3.5 text-primary opacity-80" /></span>}
              </div>
              <span className="text-xs text-muted-foreground/70 mt-1 block">Panel de Administración</span>
            </div>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? "bg-green-500" : "bg-muted animate-pulse"
            }`}
            title={isConnected ? "WebSocket Conectado" : "Buscando conexión..."}
          />
        </div>

        {/* Tabs Bar */}
        <div className="px-4 py-2.5 border-b border-border/40 flex gap-2 bg-card/20">
          <button
            onClick={() => setSidebarTab("chats")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              sidebarTab === "chats"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chats Activos
          </button>
          <button
            onClick={() => setSidebarTab("users")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              sidebarTab === "users"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Buscar Usuarios
          </button>
        </div>

        {sidebarTab === "users" && (
          <div className="p-3 border-b border-border/40 bg-card/10">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full h-10 pl-9 pr-4 border border-border/60 hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none bg-secondary/15 transition-all text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        )}

        <div ref={sidebarScrollRef} className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-y-contain">
          {sidebarTab === "chats" ? (
            isLoadingConvs ? (
              <div className="h-40 flex items-center justify-center">
                <Loading text="" subtext="" className="py-0 scale-75" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay conversaciones activas.
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConv?.id === conv.id;
                const lastMsg = conv.messages?.[0];
                const hasUnread = conv.unreadCount > 0 && !isActive;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-3.5 border ${
                      isActive
                        ? "bg-primary border-primary/20 text-primary-foreground shadow-md"
                        : "bg-transparent border-transparent hover:bg-secondary/40 hover:border-border/40"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${
                          isActive ? "bg-primary-foreground/15 text-primary-foreground" : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {conv.user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={`text-sm font-semibold truncate ${
                            isActive ? "text-primary-foreground" : "text-foreground"
                          }`}
                        >
                          {conv.user?.name || "Usuario"}
                        </h3>
                        {conv.updatedAt && (
                          <span
                            className={`text-[10px] flex-shrink-0 ${
                              isActive ? "text-primary-foreground/75" : "text-muted-foreground/60"
                            }`}
                          >
                            {new Date(conv.updatedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p
                          className={`text-xs truncate ${
                            isActive ? "text-primary-foreground/90 font-medium" : "text-muted-foreground"
                          } ${hasUnread && !isActive ? "text-foreground font-bold" : ""}`}
                        >
                          {lastMsg?.content || "Inicia una conversación..."}
                        </p>
                        {hasUnread && (
                          <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1.5 animate-pulse shadow-sm shadow-red-500/20 bg-red-500 text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )
          ) : (
            // Users list
            isLoadingUsers ? (
              <div className="h-40 flex items-center justify-center">
                <Loading text="" subtext="" className="py-0 scale-75" />
              </div>
            ) : usersList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No se encontraron usuarios.
              </div>
            ) : (
              usersList.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUserChat(user.id)}
                  className="w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 bg-transparent border border-transparent hover:bg-secondary/40 hover:border-border/40 cursor-pointer group"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-sm group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      {user.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {user.name || "Usuario sin nombre"}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary p-1.5 transition-all">
                    <UserPlus className="w-4 h-4" />
                  </div>
                </button>
              ))
            )
          )}
        </div>

        {/* Users Pagination controls at the bottom of the sidebar if in 'users' tab */}
        {sidebarTab === "users" && totalPages > 1 && (
          <div className="p-3 border-t border-border/40 flex items-center justify-between bg-card/60">
            <button
              onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
              disabled={usersPage === 1 || isLoadingUsers}
              className="p-2 border border-border/60 rounded-xl hover:bg-secondary/60 disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              Página {usersPage} de {totalPages}
            </span>
            <button
              onClick={() => setUsersPage((p) => Math.min(totalPages, p + 1))}
              disabled={usersPage === totalPages || isLoadingUsers}
              className="p-2 border border-border/60 rounded-xl hover:bg-secondary/60 disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Area - active conversation detail */}
      <div className={`flex-1 flex flex-col bg-background relative h-full ${activeConv ? "flex" : "hidden md:flex"}`}>
        {activeConv ? (
          <>
            {/* Header */}
            <div className="p-5 border-b border-border/40 flex items-center justify-between bg-card/20 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => setActiveConv(null)}
                  className="md:hidden p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer -ml-2"
                  title="Volver a la lista"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-sm">
                  {activeConv.user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground leading-none">
                    {activeConv.user?.name || "Usuario"}
                  </h2>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {activeConv.user?.email || ""}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all flex items-center justify-center cursor-pointer border border-red-500/20 hover:border-red-500/30 shadow-sm"
                title="Eliminar Conversación"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div ref={messagesScrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-secondary/5 min-h-0 overscroll-y-contain">
              {isLoadingMsgs ? (
                <div className="h-full flex items-center justify-center">
                  <Loading text="" subtext="" className="py-0" />
                </div>
              ) : (
                <>
                  {(() => {
                    const firstUnreadIndex = messages.findIndex(
                      (m) => !m.isRead && m.senderRole !== "admin"
                    );
                    return messages.map((msg, idx) => {
                      const isMe = msg.senderRole === "admin";
                      const isFirstUnread = idx === firstUnreadIndex;
                      return (
                        <div
                          key={msg.id}
                          ref={isFirstUnread ? firstUnreadRef : null}
                          className={`flex flex-col max-w-[70%] ${
                            isMe ? "ml-auto items-end" : "mr-auto items-start"
                          }`}
                        >
                        <div
                          onClick={() => setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}
                          className={`p-3.5 rounded-2xl text-sm shadow-sm relative group/msg ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-secondary text-secondary-foreground border border-border/40 rounded-tl-none"
                          } md:cursor-default cursor-pointer`}
                        >
                          {msg.replyTo && (
                            <div className={`mb-1.5 p-2 rounded-lg text-xs border-l-2 ${
                              isMe 
                                ? "bg-primary-foreground/10 border-primary-foreground/40 text-primary-foreground/80" 
                                : "bg-background/50 border-primary/40 text-muted-foreground"
                            }`}>
                              <div className={`font-semibold mb-0.5 ${isMe ? "text-primary-foreground" : "text-primary/80"}`}>
                                {msg.replyTo.senderRole === "admin" ? "Tú" : (activeConv?.user?.name || "Cliente")}
                              </div>
                              <div className="truncate opacity-90">{msg.replyTo.content}</div>
                            </div>
                          )}
                          {msg.content}
                          {/* Desktop: hover-based side buttons */}
                          <div className={`hidden md:flex absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity items-center gap-0.5 ${
                            isMe ? "-left-[60px]" : "-right-[60px]"
                          }`}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopy(msg.id, msg.content); }}
                              className="p-1.5 rounded-full hover:bg-secondary/80 text-muted-foreground transition-colors cursor-pointer"
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
                              className="p-1.5 rounded-full hover:bg-secondary/80 text-muted-foreground transition-colors cursor-pointer"
                              title="Responder"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
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
                              className={`flex md:hidden items-center gap-1 mt-1 overflow-hidden ${
                                isMe ? "justify-end" : "justify-start"
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                                Responder
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <span className="text-[10px] text-muted-foreground/70 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  });
                })()}

                  {isUserTyping && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic px-1">
                      <span className="flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </span>
                      <span>El cliente está escribiendo...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Box */}
            <div className="border-t border-border/40 bg-card/20">
              {!isConnected && (
                <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-[11px] font-medium flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  Servidor de chat desconectado. Los mensajes no se enviarán hasta restablecer la conexión.
                </div>
              )}
              {replyingTo && (
                <div className="px-4 py-2.5 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-3 border-l-2 border-primary pl-3">
                    <div className="text-xs font-semibold text-primary">
                      Respondiendo a {replyingTo.senderRole === "admin" ? "ti" : (activeConv?.user?.name || "Cliente")}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{replyingTo.content}</div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1.5 hover:bg-secondary rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="p-4 flex items-center gap-3">
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
                  placeholder={isConnected ? "Escribe tu respuesta..." : "Chat desconectado..."}
                  className="flex-1 h-12 px-4 border border-border/60 hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none bg-secondary/20 transition-all text-foreground disabled:opacity-50"
                />
                <button
                  type="submit"
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={!inputMessage.trim() || !isConnected || (config.chat.enableE2EE && !isE2EEReady)}
                  className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-40 disabled:hover:bg-primary shadow-md transition-all flex-shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <div className="p-5 bg-secondary/50 rounded-full text-muted-foreground/80 mb-5 relative">
              <MessageSquare className="w-10 h-10" />
              <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h2 className="text-foreground/90 font-semibold font-display mb-1 text-base">Comienza a Chatear</h2>
            <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
              Selecciona una conversación de la barra lateral para ver los mensajes y responder en tiempo real.
            </p>
          </div>
        )}
      </div>

      {/* Premium Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-2xl z-10"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-4 shadow-inner">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-display text-foreground mb-2">
                  ¿Eliminar conversación?
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Esta acción es permanente. Se eliminarán en cascada todos los mensajes y el historial del chat para siempre.
                </p>
                
                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 h-11 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-sm transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConversation}
                    disabled={isDeleting}
                    className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 cursor-pointer"
                  >
                    {isDeleting ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Eliminar"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
