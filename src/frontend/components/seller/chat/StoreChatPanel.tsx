"use client";

import React, { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, User, Send, X, Leaf, ArrowLeft, Store, ShoppingBag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/frontend/context/SocketContext";
import { useSocketRefresh } from "@/frontend/hooks/useSocketRefresh";
import { Message } from "@/frontend/components/chat/ChatWidget";
import { ChatMessageBubble } from "@/frontend/components/chat/ChatMessageBubble";
import { Loading } from "@/components/ui/Loading";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logger from "@/utils/logger";

const log = logger.child();

type CustomerUser = {
  id: string;
  name: string | null;
  email: string | null;
};

type CustomerConversation = {
  id: string;
  pedido: { id: string; estado: string; fechaPedido: Date } | null;
  messages?: { content: string; createdAt: Date }[];
  unreadCount: number;
  updatedAt: Date;
};

type StoreCustomer = {
  user: CustomerUser;
  conversations: CustomerConversation[];
  unreadCount: number;
  lastMessage: { content: string; createdAt: Date } | null;
  updatedAt: Date | null;
};

interface StoreChatPanelProps {
  storeId: string;
  storeName: string;
  embedded?: boolean;
  getStoreCustomersAction: (storeId: string) => Promise<any>;
  getStoreCustomerChatMessagesAction: (storeId: string, customerId: string) => Promise<any>;
  getOrCreateCustomerConversationAction: (storeId: string, customerId: string) => Promise<any>;
  markAsReadAction: (conversationId: string) => Promise<any>;
}

export function StoreChatPanel({
  storeId,
  storeName,
  embedded = false,
  getStoreCustomersAction,
  getStoreCustomerChatMessagesAction,
  getOrCreateCustomerConversationAction,
  markAsReadAction,
}: StoreChatPanelProps) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();

  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCustomer, setActiveCustomer] = useState<StoreCustomer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const joinedRoomRef = useRef<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await getStoreCustomersAction(storeId);
      if (Array.isArray(res)) {
        setCustomers(res);
      } else if (res && "error" in res) {
        log.warn("Error loading customers:", res.error);
      }
    } catch (err) {
      log.error("Error loading store customers:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId, getStoreCustomersAction]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useSocketRefresh({
    socket,
    enabled: !!storeId,
    refresh: loadCustomers,
    events: [
      "order:created",
      "order:status_updated_store",
      "order:deleted_store",
      "unread_count_updated",
    ],
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket room management
  useEffect(() => {
    if (!socket || !activeConversationId) return;
    if (joinedRoomRef.current === activeConversationId) return;

    if (joinedRoomRef.current) {
      socket.emit("leave_room", { conversationId: joinedRoomRef.current });
    }
    joinedRoomRef.current = activeConversationId;
    socket.emit("join_room", { conversationId: activeConversationId });

    const handleReceiveMessage = (message: Message) => {
      if (message.conversationId !== activeConversationId) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.senderId === session?.user?.id) setIsSending(false);
    };

    const handleChatError = (payload: { conversationId?: string; message?: string }) => {
      if (payload.conversationId && payload.conversationId !== activeConversationId) return;
      setIsSending(false);
      toast.error("No se pudo enviar el mensaje", {
        description: payload.message || "Inténtalo nuevamente.",
      });
    };

    const handleTyping = (payload: { conversationId: string; senderId: string; isTyping: boolean }) => {
      if (payload.conversationId === activeConversationId && payload.senderId !== session?.user?.id) {
        setIsUserTyping(payload.isTyping);
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("chat_error", handleChatError);
    socket.on("user_typing", handleTyping);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("chat_error", handleChatError);
      socket.off("user_typing", handleTyping);
    };
  }, [socket, activeConversationId, session?.user?.id]);

  useEffect(() => {
    return () => {
      if (socket && joinedRoomRef.current) {
        socket.emit("leave_room", { conversationId: joinedRoomRef.current });
      }
    };
  }, [socket]);

  const handleSelectCustomer = async (customer: StoreCustomer) => {
    setActiveCustomer(customer);
    setReplyingTo(null);
    setLoadingMessages(true);
    try {
      const res = await getStoreCustomerChatMessagesAction(storeId, customer.user.id);
      if (res && "error" in res) {
        toast.error("Error", { description: String(res.error) });
        return;
      }
      if (res) {
        setMessages(res.messages || []);
        setActiveConversationId(res.activeConversationId || null);
        // Update unread counts locally
        setCustomers(prev => prev.map(c =>
          c.user.id === customer.user.id ? { ...c, unreadCount: 0 } : c
        ));
      }
    } catch (err) {
      log.error("Error loading customer messages:", err);
      toast.error("Error al cargar los mensajes.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !socket || !session?.user?.id || !activeConversationId || isSending) return;

    setIsSending(true);
    socket.emit("send_message", {
      conversationId: activeConversationId,
      content,
      senderId: session.user.id,
      senderRole: session.user.role || "seller",
      ...(replyingTo ? { replyToId: replyingTo.id } : {}),
    });
    setInput("");
    setReplyingTo(null);
    setIsUserTyping(false);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setActiveMessageId(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleBack = () => {
    setActiveCustomer(null);
    setMessages([]);
    setActiveConversationId(null);
    setReplyingTo(null);
    loadCustomers();
  };

  const getPedidoStatusLabel = (estado: string) => {
    const labels: Record<string, string> = {
      PENDIENTE: "Pendiente",
      CONFIRMADO: "Confirmado",
      EN_PREPARACION: "En preparación",
      EN_CAMINO: "En camino",
      EN_BODEGA: "En bodega",
      ENTREGADO: "Entregado",
      CANCELADO: "Cancelado",
    };
    return labels[estado] || estado;
  };

  const getCustomerUnreadCount = (customer: StoreCustomer) => {
    if (activeCustomer?.user.id === customer.user.id) return 0;
    return customer.unreadCount;
  };

  return (
    <div className={cn("flex h-full min-h-0 bg-background", embedded ? "" : "rounded-xl border border-border/40 overflow-hidden")}>
      {/* Sidebar - Customer List */}
      <aside
        className={cn(
          "w-full md:w-[340px] border-r border-border/40 flex flex-col bg-card/40 shrink-0",
          activeCustomer ? "hidden md:flex" : "flex"
        )}
      >
        {!embedded && (
          <div className="p-4 border-b border-border/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-sm leading-snug font-display">Chat con Clientes</h2>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  Clientes que han comprado en tu tienda
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-y-contain">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <Loading text="" subtext="" className="py-0 scale-75" />
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No hay clientes con pedidos en tu tienda aún.
            </div>
          ) : (
            customers.map((customer) => {
              const isActive = activeCustomer?.user.id === customer.user.id;
              const badgeCount = getCustomerUnreadCount(customer);
              const hasOpenOrders = customer.conversations.some(
                c => c.pedido && !["ENTREGADO", "CANCELADO"].includes(c.pedido.estado)
              );
              return (
                <button
                  key={customer.user.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 border",
                    isActive
                      ? "bg-primary border-primary/20 text-primary-foreground shadow-md"
                      : "bg-transparent border-transparent hover:bg-secondary/40 hover:border-border/40"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner",
                        isActive ? "bg-primary-foreground/15 text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {customer.user.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                    </div>
                    {hasOpenOrders && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={cn(
                          "text-sm font-semibold truncate",
                          isActive ? "text-primary-foreground" : "text-foreground"
                        )}
                      >
                        {customer.user.name || "Cliente"}
                      </h3>
                      {customer.updatedAt && (
                        <span
                          className={cn(
                            "text-[10px] flex-shrink-0",
                            isActive ? "text-primary-foreground/75" : "text-muted-foreground/60"
                          )}
                        >
                          {new Date(customer.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className={cn(
                          "text-xs truncate",
                          isActive ? "text-primary-foreground/90 font-medium" : "text-muted-foreground",
                          badgeCount > 0 && !isActive && "text-foreground font-bold"
                        )}
                      >
                        {customer.lastMessage?.content || "Sin mensajes aún"}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {badgeCount > 0 && (
                          <span className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1.5 bg-red-500 text-white shadow-sm shadow-red-500/20">
                            {badgeCount}
                          </span>
                        )}
                        <ChevronRight className={cn("w-3.5 h-3.5", isActive ? "text-primary-foreground/60" : "text-muted-foreground/30")} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Area - Messages */}
      <main
        className={cn(
          "flex-1 flex flex-col bg-background relative min-h-0 min-w-0",
          activeCustomer ? "flex" : "hidden md:flex"
        )}
      >
        {activeCustomer ? (
          <>
            {/* Header */}
            <div className="px-3 py-3 sm:px-4 md:px-5 md:py-4 border-b border-border/40 flex items-center gap-2 bg-card/20 backdrop-blur-sm z-10 shrink-0">
              <button
                onClick={handleBack}
                className="md:hidden p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                title="Volver a la lista"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 shrink-0 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-sm">
                {activeCustomer.user.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-foreground leading-snug truncate">
                  {activeCustomer.user.name || "Cliente"}
                </h2>
                <p className="text-xs text-muted-foreground leading-normal truncate mt-0.5">
                  {activeCustomer.user.email || ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-green-500" : "bg-muted animate-pulse"
                  )}
                  title={isConnected ? "Conectado" : "Desconectado"}
                />
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesScrollRef}
              className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-secondary/5 min-h-0 overscroll-y-contain"
            >
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <Loading text="" subtext="" className="py-0" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center p-8 select-none">
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-6 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/25 flex items-center justify-center shadow-lg backdrop-blur-sm">
                        <Leaf className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <h4 className="font-display font-black text-xl text-foreground tracking-tight mb-2">
                      ¡Bienvenido!
                    </h4>
                    <p className="font-sans text-sm text-muted-foreground max-w-[245px] leading-relaxed font-medium">
                      Envía un mensaje para contactar con {activeCustomer.user.name || "este cliente"}.
                    </p>
                    {activeCustomer.conversations.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {activeCustomer.conversations.map(conv => (
                          conv.pedido && (
                            <span
                              key={conv.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/60 text-[11px] font-semibold text-muted-foreground"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              Pedido #{conv.pedido.id.slice(-6).toUpperCase()}
                              <span className={cn(
                                "ml-1 px-1.5 py-0.5 rounded-full text-[10px]",
                                conv.pedido.estado === "ENTREGADO" ? "bg-green-500/10 text-green-600" :
                                conv.pedido.estado === "CANCELADO" ? "bg-red-500/10 text-red-600" :
                                "bg-blue-500/10 text-blue-600"
                              )}>
                                {getPedidoStatusLabel(conv.pedido.estado)}
                              </span>
                            </span>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <ChatMessageBubble
                      key={msg.id}
                      msg={msg}
                      isMe={msg.senderId === session?.user?.id}
                      isFirstUnread={false}
                      copiedId={copiedId}
                      activeMessageId={activeMessageId}
                      sessionUserId={session?.user?.id ?? ""}
                      chatTitle={activeCustomer.user.name || "Cliente"}
                      firstUnreadRef={firstUnreadRef}
                      onCopy={handleCopy}
                      onReply={handleReply}
                      onToggleActive={(id) => setActiveMessageId(activeMessageId === id ? null : id)}
                    />
                  ))}
                </>
              )}
              {isUserTyping && (
                <div className="flex flex-col max-w-[70%] mr-auto items-start animate-pulse">
                  <div className="p-3 rounded-2xl text-xs shadow-sm bg-secondary text-secondary-foreground border border-border/40 rounded-tl-none flex items-center gap-2.5">
                    <span className="flex space-x-1 items-center">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                    <span className="text-muted-foreground/90 font-medium">Escribiendo...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/40 bg-card/20 shrink-0">
              {replyingTo && (
                <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-3 border-l-2 border-primary pl-3">
                    <div className="text-xs font-semibold text-primary">
                      Respondiendo a {replyingTo.senderId === session?.user?.id ? "ti" : (activeCustomer.user.name || "Cliente")}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{replyingTo.content}</div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-secondary rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
              {!isConnected && (
                <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-[11px] font-medium flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  Servidor de chat desconectado.
                </div>
              )}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!isConnected}
                  placeholder={isConnected ? "Escribe tu respuesta..." : "Chat desconectado..."}
                  className="flex-1 h-11 px-4 border border-border/60 hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none bg-secondary/20 transition-all text-foreground disabled:opacity-50"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-11 w-11 rounded-xl shrink-0"
                  disabled={!input.trim() || !isConnected || isSending}
                >
                  {isSending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <div className="p-5 bg-secondary/50 rounded-full text-muted-foreground/80 mb-5 relative">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h2 className="text-foreground/90 font-semibold font-display mb-1 text-base">
              Chat Centralizado
            </h2>
            <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
              Selecciona un cliente de la lista para ver sus mensajes y responder en tiempo real.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
