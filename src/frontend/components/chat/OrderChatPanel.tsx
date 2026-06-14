"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Leaf, MessageSquare, Send, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/frontend/context/SocketContext";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/Loading";
import { toast } from "sonner";
import type { Message } from "./ChatWidget";
import { ChatMessageBubble } from "./ChatMessageBubble";

export type OrderConversation = {
  id: string;
  userId: string;
  sellerId?: string | null;
  pedidoId?: string | null;
  store?: {
    name?: string | null;
  } | null;
  pedido?: {
    id: string;
    estado: string;
  } | null;
};

interface OrderChatPanelProps {
  conversation: OrderConversation;
  initialMessages: Message[];
  isLoading?: boolean;
  title: string;
  disabled?: boolean;
  onClose: () => void;
  onMarkAsRead: (conversationId: string) => Promise<void>;
}

export function OrderChatPanel({
  conversation,
  initialMessages,
  isLoading = false,
  title,
  disabled = false,
  onClose,
  onMarkAsRead,
}: OrderChatPanelProps) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const joinedConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, conversation.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    joinedConversationIdRef.current = null;
    setCopiedId(null);
    setActiveMessageId(null);
    setReplyingTo(null);
  }, [conversation.id]);

  useEffect(() => {
    if (!socket || !conversation.id) return;

    if (joinedConversationIdRef.current === conversation.id) return;
    joinedConversationIdRef.current = conversation.id;

    socket.emit("join_room", { conversationId: conversation.id });

    const handleReceiveMessage = (message: Message) => {
      if (message.conversationId !== conversation.id) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.senderId === session?.user?.id) setIsSending(false);
    };

    const handleChatError = ({ conversationId, message }: { conversationId?: string; message?: string }) => {
      if (conversationId && conversationId !== conversation.id) return;
      setIsSending(false);
      toast.error("No se pudo enviar el mensaje", {
        description: message || "Inténtalo nuevamente en unos segundos.",
      });
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("chat_error", handleChatError);
    return () => {
      socket.emit("leave_room", { conversationId: conversation.id });
      if (joinedConversationIdRef.current === conversation.id) {
        joinedConversationIdRef.current = null;
      }
      socket.off("receive_message", handleReceiveMessage);
      socket.off("chat_error", handleChatError);
    };
  }, [socket, conversation.id, session?.user?.id]);

  useEffect(() => {
    // Read receipts are handled once by the parent after the conversation opens.
  }, [conversation.id]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || !socket || !session?.user?.id || disabled || isSending) return;

    setIsSending(true);
    socket.emit("send_message", {
      conversationId: conversation.id,
      content,
      senderId: session.user.id,
      senderRole: session.user.role || "user",
      ...(replyingTo ? { replyToId: replyingTo.id } : {}),
    });
    setInput("");
    setReplyingTo(null);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setActiveMessageId(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-background/70 backdrop-blur-sm md:flex md:items-end md:justify-end md:p-6">
      <section className="flex h-full flex-col bg-background shadow-2xl dark:shadow-[0_0_0_1px_rgba(34,197,94,0.14),0_0_28px_rgba(34,197,94,0.16),0_0_96px_rgba(34,197,94,0.08)] md:h-[620px] md:w-[420px] md:rounded-2xl md:border md:border-border dark:md:border-emerald-500/20">
        <header className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="truncate text-sm font-black">{title}</h2>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isConnected ? "Conectado" : "Reconectando..."}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loading text="" subtext="" className="py-0 scale-75" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center p-8 select-none bg-gradient-to-b from-transparent to-primary/[0.02]">
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse" />

                  <motion.div
                    initial={{ scale: 0.85, opacity: 0.5 }}
                    animate={{ scale: 1.15, opacity: 0 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                    className="absolute w-16 h-16 rounded-full border border-primary/30"
                  />

                  <motion.div
                    animate={{ y: [0, -6, 0], rotate: [0, 2, -2, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/25 flex items-center justify-center shadow-lg backdrop-blur-sm"
                  >
                    <Leaf className="w-8 h-8 text-primary filter drop-shadow-[0_2px_8px_rgba(34,197,94,0.3)]" />
                  </motion.div>
                </div>

                <motion.h4
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="font-display font-black text-2xl text-foreground tracking-tight mb-2"
                >
                  ¡Hola!
                </motion.h4>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="font-sans text-sm text-muted-foreground max-w-[245px] leading-relaxed font-medium"
                >
                  Aún no hay mensajes en este pedido.
                </motion.p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  msg={message}
                  isMe={message.senderId === session?.user?.id}
                  isFirstUnread={false}
                  copiedId={copiedId}
                  activeMessageId={activeMessageId}
                  sessionUserId={session?.user?.id ?? ""}
                  chatTitle={title}
                  firstUnreadRef={firstUnreadRef}
                  onCopy={handleCopy}
                  onReply={handleReply}
                  onToggleActive={(id) =>
                    setActiveMessageId(activeMessageId === id ? null : id)
                  }
                />
              ))}
            </>
          )}
          <div ref={endRef} />
        </div>

        {disabled && (
          <div className="border-t border-border/60 px-5 py-3 text-center text-xs font-semibold text-muted-foreground">
            Este pedido ya fue cerrado. El historial queda disponible para consulta.
          </div>
        )}

        <div className="border-t border-border/60">
          {replyingTo && (
            <div className="px-3 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2 border-l-2 border-primary pl-2">
                <div className="text-[10px] font-semibold text-primary">
                  Respondiendo a {replyingTo.senderId === session?.user?.id ? "ti" : title}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {replyingTo.content}
                </div>
              </div>

              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-3 flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={!isConnected || disabled}
              placeholder={disabled ? "Pedido cerrado" : "Escribe tu mensaje..."}
              className="min-w-0 flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-60"
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl" disabled={!input.trim() || !isConnected || disabled || isSending}>
              {isSending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
