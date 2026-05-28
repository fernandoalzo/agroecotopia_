"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/frontend/context/SocketContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Message } from "./ChatWidget";

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
  title: string;
  disabled?: boolean;
  onClose: () => void;
  onMarkAsRead: (conversationId: string) => Promise<void>;
}

export function OrderChatPanel({
  conversation,
  initialMessages,
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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, conversation.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket || !conversation.id) return;

    socket.emit("join_room", { conversationId: conversation.id });
    onMarkAsRead(conversation.id);

    const handleReceiveMessage = (message: Message) => {
      if (message.conversationId !== conversation.id) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.senderId === session?.user?.id) setIsSending(false);
      onMarkAsRead(conversation.id);
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
      socket.off("receive_message", handleReceiveMessage);
      socket.off("chat_error", handleChatError);
    };
  }, [socket, conversation.id, onMarkAsRead, session?.user?.id]);

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
    });
    setInput("");
  };

  return (
    <div className="fixed inset-0 z-[999] bg-background/70 backdrop-blur-sm md:flex md:items-end md:justify-end md:p-6">
      <section className="flex h-full flex-col bg-background shadow-2xl md:h-[620px] md:w-[420px] md:rounded-2xl md:border md:border-border">
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

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Aún no hay mensajes en este pedido.
            </div>
          ) : (
            messages.map((message) => {
              const isMine = message.senderId === session?.user?.id;
              return (
                <div key={message.id} className={isMine ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      isMine
                        ? "max-w-[82%] rounded-2xl rounded-br-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        : "max-w-[82%] rounded-2xl rounded-bl-md border border-border bg-secondary/40 px-4 py-2 text-sm font-medium"
                    }
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {disabled && (
          <div className="border-t border-border/60 px-5 py-3 text-center text-xs font-semibold text-muted-foreground">
            Este pedido ya fue cerrado. El historial queda disponible para consulta.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border/60 p-4">
          <input
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
      </section>
    </div>
  );
}
