import React, { useState } from "react";
import { Send, X } from "lucide-react";
import { Message } from "@/frontend/components/chat/ChatWidget";
import { Conversation } from "./types";
import { config } from "@/config/config";

interface ChatInputBarProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputMessage: string;
  isConnected: boolean;
  isE2EEReady: boolean;
  replyingTo: Message | null;
  activeConv: Conversation | null;
  keyboardInset: number;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  setReplyingTo: (msg: Message | null) => void;
}

export function ChatInputBar({
  inputRef,
  inputMessage,
  isConnected,
  isE2EEReady,
  replyingTo,
  activeConv,
  keyboardInset,
  handleInputChange,
  handleSendMessage,
  setReplyingTo,
}: ChatInputBarProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    handleSendMessage(e);
    setTimeout(() => setIsSubmitting(false), 300);
  };

  return (
    <div
      className="border-t border-border/40 bg-card/20 shrink-0 z-20"
      style={
        keyboardInset > 0
          ? {
              transform: `translateY(-${keyboardInset}px)`,
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }
          : { paddingBottom: "env(safe-area-inset-bottom, 0px)" }
      }
    >
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
      
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          onFocus={() => {
            requestAnimationFrame(() => {
              inputRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
            });
          }}
          disabled={!isConnected}
          placeholder={isConnected ? "Escribe tu respuesta..." : "Chat desconectado..."}
          className="flex-1 h-12 px-4 border border-border/60 hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none bg-secondary/20 transition-all text-foreground disabled:opacity-50"
        />
        <button
          type="submit"
          onMouseDown={(e) => e.preventDefault()}
          disabled={!inputMessage.trim() || !isConnected || isSubmitting || (config.chat.enableE2EE && !isE2EEReady)}
          className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-40 disabled:hover:bg-primary shadow-md transition-all flex-shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
