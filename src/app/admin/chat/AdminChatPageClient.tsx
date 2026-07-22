"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "@/frontend/context/SocketContext";
import { useSocketRefresh } from "@/frontend/hooks/useSocketRefresh";
import { Message } from "@/frontend/components/chat/ChatWidget";
import { SignalService } from "@/frontend/lib/signalService";
import { signalStore } from "@/frontend/lib/signalStore";
import { config } from "@/config/config";
import { sendNewWhatsAppMessageAction } from "@/backend/modules/whatsapp/whatsapp.actions";
// import { Send, MessageSquare, ShieldAlert, ArrowLeft, User, Sparkles, Trash2, Search, ChevronLeft, ChevronRight, UserPlus, X, Copy, Check, Lock } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import logger from "@/utils/logger";
import { AdminChatView } from "@/frontend/components/admin/chat/AdminChatView";
import { AccessDeniedView } from "@/frontend/components/admin/chat/AccessDeniedView";
import { getConversationUnreadCount } from "@/frontend/lib/chatUnread";
import type { Conversation, User } from "@/frontend/components/admin/chat/types";

const log = logger.child("src/app/admin/chat/page.tsx");

interface AdminChatActions {
  getAdminConversations: () => Promise<any>;
  getConversationMessages: (conversationId: string) => Promise<any>;
  markAsRead: (conversationId: string) => Promise<any>;
  deleteConversation: (conversationId: string) => Promise<any>;
  getAdminUsersList: (searchQuery?: string, page?: number) => Promise<any>;
  getOrCreateConversationForAdmin: (targetUserId: string) => Promise<any>;
  getWhatsAppConversations?: () => Promise<any>;
  sendWhatsAppMessage?: (conversationId: string, content: string) => Promise<any>;
  markWhatsAppAsRead?: (conversationId: string) => Promise<any>;
}

const isErrorResult = (value: unknown): value is { error: string } => {
  return typeof value === "object" && value !== null && "error" in value;
};

export function AdminChatPageContent({
  embedded = false,
  actions,
}: {
  embedded?: boolean;
  actions: AdminChatActions;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, isConnected } = useSocket();
  const isEmbedded = embedded || searchParams.get("embedded") === "true";
  const isDashboardMobileEntry = searchParams.get("from") === "dashboard";
  // Main chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
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
  const [keyboardInset, setKeyboardInset] = useState(0);
  // User search and navigation states
  const [sidebarTab, setSidebarTab] = useState<"chats" | "whatsapp" | "users">("chats");
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  // WhatsApp state
  const [whatsappConversations, setWhatsAppConversations] = useState<Conversation[]>([]);
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [whatsappNewMsg, setWhatsAppNewMsg] = useState("");
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsappError, setWhatsAppError] = useState<string | null>(null);
  // Refs for scrolling behavior
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasNewKeysRef = useRef(false);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolledRef = useRef(false);
  const isMountedRef = useRef(true);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const decryptConversationList = async (list: Conversation[]) => {
    return Promise.all(
      list.map(async (conv) => {
        const lastMsg = conv.messages?.[0];
        if (!lastMsg || !lastMsg.isEncrypted) {
          return { ...conv, unreadCount: getConversationUnreadCount(conv) };
        }

        try {
          const targetId = lastMsg.senderId === sessionUserId ? (conv.userId || lastMsg.senderId) : lastMsg.senderId;
          const decryptedContent = await SignalService.decryptMessage(
            targetId,
            lastMsg.content,
            lastMsg.encryptionType || 1
          );
          return {
            ...conv,
            unreadCount: getConversationUnreadCount(conv),
            messages: [{ ...lastMsg, content: decryptedContent }],
          };
        } catch {
          return {
            ...conv,
            unreadCount: getConversationUnreadCount(conv),
            messages: [{ ...lastMsg, content: "🔒 Mensaje cifrado" }],
          };
        }
      })
    );
  };

  const refreshConversations = async (withLoading = false) => {
    if (withLoading) setIsLoadingConvs(true);
    try {
      const res = await actions.getAdminConversations();
      if (!isMountedRef.current) return;
      log.debug("DEBUG: Admin conversations loaded:", JSON.stringify(res, null, 2));
      if (res && !isErrorResult(res)) {
        const decryptedConversations = await decryptConversationList(res);
        if (isMountedRef.current) setConversations(decryptedConversations);
      }
    } catch (err) {
      log.error("Error loading admin conversations:", err);
    } finally {
      if (withLoading && isMountedRef.current) setIsLoadingConvs(false);
    }
  };

  const refreshWhatsAppConversations = async (withLoading = false) => {
    if (!actions.getWhatsAppConversations) return;
    if (withLoading) setIsLoadingWhatsApp(true);
    try {
      const res = await actions.getWhatsAppConversations();
      if (!isMountedRef.current) return;
      if (res && !isErrorResult(res)) {
        if (isMountedRef.current) setWhatsAppConversations(res);
      }
    } catch (err) {
      log.error("Error loading WhatsApp conversations:", err);
    } finally {
      if (withLoading && isMountedRef.current) setIsLoadingWhatsApp(false);
    }
  };

  // Reset initial scroll state when changing active conversation
  useEffect(() => {
    hasInitialScrolledRef.current = false;
  }, [activeConv?.id]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);


  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const activeConvRef = useRef(activeConv);
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  // Lock body/html scroll; track viewport for standalone mobile; keyboard inset for embedded iframe
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const originalHtmlHeight = html.style.height;
    const originalHtmlOverflow = html.style.overflow;
    const originalHtmlOverscroll = html.style.overscrollBehavior;
    const originalBodyHeight = body.style.height;
    const originalBodyOverflow = body.style.overflow;
    const originalBodyWidth = body.style.width;
    const originalBodyOverscroll = body.style.overscrollBehavior;

    html.style.height = "100%";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.width = "100%";
    body.style.overscrollBehavior = "none";

    const vv = window.visualViewport;
    const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

    const updateViewport = () => {
      if (!vv) {
        setKeyboardInset(0);
        return;
      }

      if (isEmbedded && isMobile()) {
        // Keep container at iframe height; lift input above on-screen keyboard
        const inset = Math.max(0, Math.round(window.innerHeight - vv.height - (vv.offsetTop || 0)));
        setKeyboardInset(inset);
        return;
      }

      setKeyboardInset(0);
      if (!isEmbedded && isMobile()) {
        setViewportHeight(`${Math.round(vv.height)}px`);
      }
    };

    if (vv) {
      vv.addEventListener("resize", updateViewport);
      vv.addEventListener("scroll", updateViewport);
      updateViewport();
    }

    window.addEventListener("resize", updateViewport);

    return () => {
      html.style.height = originalHtmlHeight;
      html.style.overflow = originalHtmlOverflow;
      html.style.overscrollBehavior = originalHtmlOverscroll;
      body.style.height = originalBodyHeight;
      body.style.overflow = originalBodyOverflow;
      body.style.width = originalBodyWidth;
      body.style.overscrollBehavior = originalBodyOverscroll;
      setKeyboardInset(0);

      if (vv) {
        vv.removeEventListener("resize", updateViewport);
        vv.removeEventListener("scroll", updateViewport);
      }
      window.removeEventListener("resize", updateViewport);
    };
  }, [isEmbedded]);

  // Prevent touchmove on non-scrollable areas to stop page panning on mobile
  useEffect(() => {
    const container = pageContainerRef.current;
    if (!container || typeof window === "undefined" || window.innerWidth >= 768) return;

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as Node;
      // Allow scrolling inside messages area or sidebar list
      if (messagesScrollRef.current?.contains(target)) return;
      if (sidebarScrollRef.current?.contains(target)) return;
      // Allow interaction with the input form and its children (buttons, etc.)
      const inputForm = inputRef.current?.closest("form");
      if (inputForm && inputForm.contains(target)) return;
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
    } else if (status === "authenticated" && session?.user?.role === "admin" && !isEmbedded && !isDashboardMobileEntry) {
      router.replace("/admin/dashboard?tab=chat");
    }
  }, [status, router, isEmbedded, isDashboardMobileEntry, session?.user?.role]);

  // Load conversations list and init E2EE
  // IMPORTANT: Use stable primitive deps to prevent re-running on every render
  const sessionUserId = session?.user?.id;
  const sessionUserRole = session?.user?.role;

  useEffect(() => {
    if (status !== "authenticated" || sessionUserRole !== "admin" || !sessionUserId) return;

    const initE2EE = async () => {
      try {
        signalStore.setUserId(sessionUserId);
        const didRegister = await SignalService.registerDevice();
        if (didRegister) {
          hasNewKeysRef.current = true;
        }
        if (isMountedRef.current) setIsE2EEReady(config.chat.enableE2EE);
      } catch (err) {
        log.error("Error al registrar dispositivo E2EE Admin:", err);
      }
    };

    const initializeAdminChat = async () => {
      await initE2EE();
      await Promise.all([
        refreshConversations(true),
        refreshWhatsAppConversations(true),
      ]);
    };

    initializeAdminChat();
  }, [status, sessionUserId, sessionUserRole]);

  useSocketRefresh({
    socket,
    enabled: status === "authenticated" && sessionUserRole === "admin",
    refresh: refreshConversations,
  });

  useSocketRefresh({
    socket,
    enabled: status === "authenticated" && sessionUserRole === "admin",
    refresh: () => refreshWhatsAppConversations(),
    events: ["whatsapp:new_message", "whatsapp:message_inbound", "whatsapp:message_outbound"],
  });

  // Load users list when user searches or paginates
  useEffect(() => {
    if (status !== "authenticated" || sessionUserRole !== "admin" || sidebarTab !== "users") return;

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const res = await actions.getAdminUsersList(searchQuery, usersPage);
        if (res && !isErrorResult(res)) {
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
  const activeConvId = activeConv?.id;
  useEffect(() => {
    const conv = activeConvRef.current;
    if (!conv || !sessionUserId) return;

    let isCancelled = false;

    // Clear stale messages from the previous conversation immediately.
    // This prevents briefly showing the wrong conversation's messages.
    setMessages([]);
    // Do NOT show a loading spinner here — the empty message area is
    // sufficient visual feedback during the brief network fetch, and
    // avoids the jarring spinner flash the user reported.

    const loadMessages = async () => {
      try {
        signalStore.setUserId(sessionUserId);

        const res = await actions.getConversationMessages(conv.id);
        if (isCancelled) return;
        const isWhatsAppConv = conv.type === "WHATSAPP";
        if (res && !("error" in res)) {
          // WhatsApp messages don't need E2EE decryption

          const processedMsgs = await Promise.all(res.map(async (m: Message) => {
            let decryptedContent = m.content;
            let decryptedReplyContent = m.replyTo?.content;

            if (!isWhatsAppConv && m.isEncrypted) {
              try {
                const targetId = m.senderId === sessionUserId ? (conv.userId || m.senderId) : m.senderId;
                decryptedContent = await SignalService.decryptMessage(targetId, m.content, m.encryptionType || 1);
              } catch (e) {
                decryptedContent = "🔒 Mensaje de otra sesión";
              }
            }

            if (!isWhatsAppConv && m.replyTo && m.replyTo.isEncrypted && m.replyTo.content) {
              try {
                const replyTargetId = m.replyTo.senderId === sessionUserId ? (conv.userId || m.replyTo.senderId) : m.replyTo.senderId;
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
          if (!isCancelled) setMessages(processedMsgs);
        }

        // Mark as read (WhatsApp uses its own markAsRead)
        if (isWhatsAppConv && actions.markWhatsAppAsRead) {
          await actions.markWhatsAppAsRead(conv.id);
        } else {
          await actions.markAsRead(conv.id);
        }

        // Reset unread indicator locally in conversations list
        if (!isCancelled) {
          const updater = (prev: Conversation[]) =>
            prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c));

          if (isWhatsAppConv) {
            setWhatsAppConversations(updater);
          } else {
            setConversations(updater);
          }
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
  }, [activeConvId, sessionUserId]);

  // Handle Socket events
  useEffect(() => {
    if (!socket || status !== "authenticated" || sessionUserRole !== "admin" || !sessionUserId) return;

    // Listen for global notifications (new messages in any conversation)
    const handleNewMessageNotification = async ({ conversationId, message }: { conversationId: string; message: Message }) => {
      const decryptedMessage = { ...message };

      // Decrypt the live incoming message if encrypted
      if (message.isEncrypted) {
        try {
          // Find the active conversation in the current state to know its target user ID
          const targetConv = conversationsRef.current.find((c) => c.id === conversationId);
          const userId = targetConv ? (targetConv.userId || message.senderId) : message.senderId;
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
          void refreshConversations();
          return prev;
        }

        const updated = [...prev];
        const conv = { ...updated[index] };

        // Update last message with the decrypted variant
        conv.messages = [decryptedMessage];
        conv.updatedAt = decryptedMessage.createdAt;

        // Increment unread count if it's not the active conversation and not sent by me
        const currentActiveConv = activeConvRef.current;
        if ((!currentActiveConv || currentActiveConv.id !== conversationId) && message.senderId !== sessionUserId) {
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
        if (message.senderId !== sessionUserId) {
          actions.markAsRead(conversationId);
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

    // Listen for WhatsApp new message notifications
    const handleWhatsAppNewMessage = () => {
      refreshWhatsAppConversations();
    };

    // Listen for WhatsApp inbound/outbound messages in real-time
    const handleWhatsAppMessage = ({ conversationId, message }: { conversationId: string; message: Message }) => {
      const currentActiveConv = activeConvRef.current;
      if (currentActiveConv && currentActiveConv.id === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }

      // Update WhatsApp conversations list
      setWhatsAppConversations((prev) => {
        const index = prev.findIndex((c) => c.id === conversationId);
        if (index === -1) {
          refreshWhatsAppConversations();
          return prev;
        }
        const updated = [...prev];
        const conv = { ...updated[index] };
        conv.messages = [message];
        conv.updatedAt = message.createdAt;
        if (currentActiveConv?.id !== conversationId) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
        updated.splice(index, 1);
        return [conv, ...updated];
      });
    };

    socket.on("new_message_notification", handleNewMessageNotification);
    socket.on("user_typing", handleUserTyping);
    socket.on("conversation_deleted", handleConversationDeleted);
    socket.on("key_sync_needed", handleKeySyncNeeded);
    socket.on("whatsapp:new_message", handleWhatsAppNewMessage);
    socket.on("whatsapp:message_inbound", handleWhatsAppMessage);
    socket.on("whatsapp:message_outbound", handleWhatsAppMessage);

    return () => {
      socket.off("new_message_notification", handleNewMessageNotification);
      socket.off("user_typing", handleUserTyping);
      socket.off("conversation_deleted", handleConversationDeleted);
      socket.off("key_sync_needed", handleKeySyncNeeded);
      socket.off("whatsapp:new_message", handleWhatsAppNewMessage);
      socket.off("whatsapp:message_inbound", handleWhatsAppMessage);
      socket.off("whatsapp:message_outbound", handleWhatsAppMessage);
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
  }, [messages, isUserTyping, isLoadingMsgs, viewportHeight]);

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

    const finalContent = inputMessage.trim();

    // ─── WhatsApp conversations: send via Server Action ───
    if (activeConv.type === "WHATSAPP" && actions.sendWhatsAppMessage) {
      try {
        const res = await actions.sendWhatsAppMessage(activeConv.id, finalContent);
        if (res && !isErrorResult(res)) {
          setMessages((prev) => [...prev, res]);
        }
      } catch (err) {
        log.error("Error enviando mensaje WhatsApp:", err);
      }
      setInputMessage("");
      setReplyingTo(null);
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    // ─── Normal internal messages: E2EE + Socket.IO ───
    let finalEncryptedContent = finalContent;
    let isEncrypted = false;
    let encryptionType = 0;

    if (config.chat.enableE2EE && activeConv.userId) {
      if (!isE2EEReady) {
        log.warn("E2EE está activado pero no está listo aún en Admin. Esperando...");
        inputRef.current?.focus();
        return;
      }
      try {
        const encrypted = await SignalService.encryptMessage(activeConv.userId, finalEncryptedContent);
        finalEncryptedContent = encrypted.ciphertext;
        isEncrypted = encrypted.type !== 0;
        encryptionType = encrypted.type;
      } catch (err) {
        log.error("Error cifrando el mensaje admin:", err);
        inputRef.current?.focus();
        return;
      }
    }

    socket.emit("send_message", {
      conversationId: activeConv.id,
      content: finalEncryptedContent,
      isEncrypted,
      encryptionType,
      senderId: session.user.id,
      senderRole: "admin",
      ...(replyingTo ? { replyToId: replyingTo.id } : {}),
    });

    setInputMessage("");
    setReplyingTo(null);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Delete active conversation
  const handleDeleteConversation = async () => {
    if (!activeConv || !socket) return;
    setIsDeleting(true);
    try {
      const res = await actions.deleteConversation(activeConv.id);
      if (isErrorResult(res)) {
        log.error("Error deleting conversation:", res.error);
      } else {
        // Emit socket event to notify other participants in real-time
        socket.emit("delete_conversation", { conversationId: activeConv.id });

        // Update local state
        if (activeConv.type === "WHATSAPP") {
          setWhatsAppConversations((prev) => prev.filter((c) => c.id !== activeConv.id));
        } else {
          setConversations((prev) => prev.filter((c) => c.id !== activeConv.id));
        }
        setActiveConv(null);
        setMessages([]);
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      log.error("Error executing deleteConversation:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Select user and get/create conversation with idempotency guard
  const isSelectingUserRef = useRef(false);
  const handleSelectUserChat = async (targetUserId: string) => {
    if (isSelectingUserRef.current) return;

    // Early return if chat with this user is already active
    if (activeConvRef.current && activeConvRef.current.userId === targetUserId) {
      setSidebarTab("chats");
      return;
    }

    isSelectingUserRef.current = true;
    try {
      const res = await actions.getOrCreateConversationForAdmin(targetUserId);
      if (res && !isErrorResult(res)) {
        // Find if this conversation is already in our list
        const existingConv = conversationsRef.current.find((c) => c.id === res.id);

        const fullConv = existingConv || {
          ...res,
          messages: [],
          unreadCount: 0,
        };

        if (!existingConv) {
          // Add to the top of our conversations list if not present
          setConversations((prev) => (prev.some((c) => c.id === fullConv.id) ? prev : [fullConv, ...prev]));
        }

        // Set as active if it changed
        if (activeConvRef.current?.id !== fullConv.id) {
          setActiveConv(fullConv);
        }

        // Return to chats tab
        setSidebarTab("chats");
      }
    } catch (err) {
      log.error("Error initiating chat with user:", err);
    } finally {
      isSelectingUserRef.current = false;
    }
  };

  // Start a new WhatsApp conversation with a phone number
  const handleStartNewWhatsApp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsAppError(null);

    if (!newPhoneNumber.trim() || !whatsappNewMsg.trim()) {
      setWhatsAppError("Completa el número y el mensaje.");
      return;
    }

    const phone = newPhoneNumber.trim();
    const content = whatsappNewMsg.trim();
    setIsSendingWhatsApp(true);

    try {
      log.info("Enviando nuevo mensaje WhatsApp...");
      const res = await sendNewWhatsAppMessageAction(phone, content);
      log.info("Respuesta recibida:", res);

      if (res && !isErrorResult(res)) {
        const { conversation, message } = res as unknown as { conversation: Conversation; message: Message };

        setWhatsAppConversations((prev) => {
          const exists = prev.find((c) => c.id === conversation.id);
          if (exists) return prev;
          return [{ ...conversation, messages: [message], unreadCount: 0 }, ...prev];
        });

        setActiveConv({ ...conversation, messages: [message], unreadCount: 0 });
        setNewPhoneNumber("");
        setWhatsAppNewMsg("");
      } else if (res && isErrorResult(res)) {
        setWhatsAppError(res.error || "Error desconocido");
        log.error("Error starting WhatsApp conversation:", res.error);
      }
    } catch (err) {
      log.error("Error starting WhatsApp conversation:", err);
      setWhatsAppError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsSendingWhatsApp(false);
    }
  }, [newPhoneNumber, whatsappNewMsg]);

  // Guard loading session
  if (status === "loading" && !session) {
    return (
      <Loading fullScreen={true} />
    );
  }

  // Guard access denied
  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return <AccessDeniedView onGoHome={() => router.push("/")} />;
  }

  return (
    <AdminChatView
      status={status}
      session={session}
      isConnected={isConnected}
      isEmbedded={isEmbedded}
      viewportHeight={viewportHeight}
      keyboardInset={keyboardInset}
      conversations={conversations}
      whatsappConversations={whatsappConversations}
      activeConv={activeConv}
      messages={messages}
      inputMessage={inputMessage}
      isLoadingConvs={isLoadingConvs}
      isLoadingWhatsApp={isLoadingWhatsApp}
      isLoadingMsgs={isLoadingMsgs}
      isUserTyping={isUserTyping}
      showDeleteConfirm={showDeleteConfirm}
      isDeleting={isDeleting}
      replyingTo={replyingTo}
      copiedId={copiedId}
      activeMessageId={activeMessageId}
      isE2EEReady={isE2EEReady}
      sidebarTab={sidebarTab}
      usersList={usersList}
      searchQuery={searchQuery}
      usersPage={usersPage}
      totalPages={totalPages}
      isLoadingUsers={isLoadingUsers}
      setSidebarTab={setSidebarTab}
      setSearchQuery={setSearchQuery}
      setUsersPage={setUsersPage}
      setActiveConv={setActiveConv}
      handleSelectUserChat={handleSelectUserChat}
      setShowDeleteConfirm={setShowDeleteConfirm}
      handleDeleteConversation={handleDeleteConversation}
      setActiveMessageId={setActiveMessageId}
      handleCopy={handleCopy}
      setReplyingTo={setReplyingTo}
      handleInputChange={handleInputChange}
      handleSendMessage={handleSendMessage}
      newPhoneNumber={newPhoneNumber}
      setNewPhoneNumber={setNewPhoneNumber}
      whatsappNewMsg={whatsappNewMsg}
      setWhatsAppNewMsg={setWhatsAppNewMsg}
      handleStartNewWhatsApp={handleStartNewWhatsApp}
      isSendingWhatsApp={isSendingWhatsApp}
      whatsappError={whatsappError}
      setWhatsAppError={setWhatsAppError}
      pageContainerRef={pageContainerRef}
      sidebarScrollRef={sidebarScrollRef}
      messagesScrollRef={messagesScrollRef}
      firstUnreadRef={firstUnreadRef}
      messagesEndRef={messagesEndRef}
      inputRef={inputRef}
    />
  );
}

export default function AdminChatPage({ actions }: { actions: AdminChatActions }) {
  return (
    <Suspense fallback={<Loading fullScreen={true} />}>
      <AdminChatPageContent actions={actions} />
    </Suspense>
  );
}
