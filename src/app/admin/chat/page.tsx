"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/frontend/context/SocketContext";
import { getAdminConversations, getConversationMessages, markAsRead, deleteConversationAction, getAdminUsersList, getOrCreateConversationForAdmin } from "@/backend/modules/chat/chat.actions";
import { Message } from "@/frontend/components/chat/ChatWidget";
import { Send, MessageSquare, ShieldAlert, ArrowLeft, User, Sparkles, Trash2, Search, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { motion, AnimatePresence } from "framer-motion";

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

  // Guard routing: redirect if not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load conversations list
  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") return;

    const loadConversations = async () => {
      try {
        const res = await getAdminConversations();
        console.log("DEBUG: Admin conversations loaded:", JSON.stringify(res, null, 2));
        if (res && !("error" in res)) {
          setConversations(res);
        }
      } catch (err) {
        console.error("Error loading admin conversations:", err);
      } finally {
        setIsLoadingConvs(false);
      }
    };

    loadConversations();
  }, [status, session]);

  // Load users list when user searches or paginates
  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin" || sidebarTab !== "users") return;

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
        console.error("Error loading users list:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      loadUsers();
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, usersPage, sidebarTab, status, session]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setUsersPage(1);
  }, [searchQuery]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConv || !session?.user?.id) return;

    const loadMessages = async () => {
      setIsLoadingMsgs(true);
      try {
        const res = await getConversationMessages(activeConv.id);
        if (res && !("error" in res)) {
          setMessages(res);
        }
        await markAsRead(activeConv.id);
        
        // Reset unread indicator locally in conversations list
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConv.id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setIsLoadingMsgs(false);
      }
    };

    loadMessages();
  }, [activeConv, session]);

  // Handle Socket events
  useEffect(() => {
    if (!socket || status !== "authenticated" || session?.user?.role !== "admin") return;

    // Listen for global notifications (new messages in any conversation)
    const handleNewMessageNotification = ({ conversationId, message }: { conversationId: string; message: Message }) => {
      // Update conversations list (move to top, set last message)
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === conversationId);
        if (index === -1) {
          // If we don't have this conversation in list, reload all of them
          getAdminConversations().then((res) => {
            if (res && !("error" in res)) setConversations(res);
          });
          return prev;
        }

        const updated = [...prev];
        const conv = { ...updated[index] };
        
        // Update last message
        conv.messages = [message];
        conv.updatedAt = message.createdAt;
        
        // Increment unread count if it's not the active conversation and not sent by me
        if ((!activeConv || activeConv.id !== conversationId) && message.senderRole !== "admin") {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }

        // Remove from old position and insert at top
        updated.splice(index, 1);
        return [conv, ...updated];
      });

      // If this message belongs to the active conversation, append it
      if (activeConv && activeConv.id === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        
        // Mark as read immediately
        if (message.senderRole !== "admin") {
          markAsRead(conversationId);
        }
      }
    };

    // Listen for user typing
    const handleUserTyping = ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
      if (activeConv && activeConv.userId === senderId) {
        setIsUserTyping(isTyping);
      }
    };

    // Listen for conversation deleted by user in real time
    const handleConversationDeleted = ({ conversationId }: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConv && activeConv.id === conversationId) {
        setActiveConv(null);
        setMessages([]);
      }
    };

    socket.on("new_message_notification", handleNewMessageNotification);
    socket.on("user_typing", handleUserTyping);
    socket.on("conversation_deleted", handleConversationDeleted);

    return () => {
      socket.off("new_message_notification", handleNewMessageNotification);
      socket.off("user_typing", handleUserTyping);
      socket.off("conversation_deleted", handleConversationDeleted);
    };
  }, [socket, activeConv, status, session]);

  // Join/leave room on active conversation change
  useEffect(() => {
    if (!socket || !activeConv) return;

    socket.emit("join_room", { conversationId: activeConv.id });

    return () => {
      socket.emit("leave_room", { conversationId: activeConv.id });
      setIsUserTyping(false);
    };
  }, [socket, activeConv]);

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
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !activeConv || !session?.user?.id) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing", {
      conversationId: activeConv.id,
      senderId: session.user.id,
      isTyping: false,
    });

    socket.emit("send_message", {
      conversationId: activeConv.id,
      content: inputMessage.trim(),
      senderId: session.user.id,
      senderRole: "admin",
    });

    setInputMessage("");
  };

  // Delete active conversation
  const handleDeleteConversation = async () => {
    if (!activeConv || !socket) return;
    setIsDeleting(true);
    try {
      const res = await deleteConversationAction(activeConv.id);
      if (res && "error" in (res as any)) {
        console.error("Error deleting conversation:", (res as any).error);
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
      console.error("Error executing deleteConversationAction:", err);
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
      console.error("Error initiating chat with user:", err);
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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-6 text-center text-foreground">
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
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
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
              <h1 className="font-semibold text-base leading-none font-display">Soporte Chat</h1>
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

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
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
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-secondary/5 min-h-0">
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
                          className={`p-3.5 rounded-2xl text-sm shadow-sm ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-secondary text-secondary-foreground border border-border/40 rounded-tl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
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
              <form onSubmit={handleSendMessage} className="p-4 flex items-center gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  disabled={!isConnected}
                  placeholder={isConnected ? "Escribe tu respuesta..." : "Chat desconectado..."}
                  className="flex-1 h-12 px-4 border border-border/60 hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none bg-secondary/20 transition-all text-foreground disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || !isConnected}
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
