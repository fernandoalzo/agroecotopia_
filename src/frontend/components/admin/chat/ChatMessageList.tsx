import React from "react";
import { Copy, Check, MessageSquare, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "@/frontend/components/chat/ChatWidget";
import { Conversation } from "./types";
import { Loading } from "@/components/ui/Loading";
import { getFirstUnreadMessageIndex } from "@/frontend/lib/chatUnread";

interface ChatMessageListProps {
  messagesScrollRef: React.RefObject<HTMLDivElement | null>;
  firstUnreadRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  messages: Message[];
  isLoadingMsgs: boolean;
  isUserTyping: boolean;
  activeConv: Conversation | null;
  activeMessageId: string | null;
  copiedId: string | null;
  keyboardInset: number;
  setActiveMessageId: (id: string | null) => void;
  handleCopy: (id: string, text: string) => void;
  setReplyingTo: (msg: Message | null) => void;
}

function EmptyMessagesWatermark({ activeConv }: { activeConv: Conversation | null }) {
  const isWhatsApp = activeConv?.type === "WHATSAPP";
  const displayName = isWhatsApp
    ? activeConv?.whatsappPhone || activeConv?.user?.name || "este contacto"
    : activeConv?.user?.name || "este usuario";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="h-full flex items-center justify-center select-none pointer-events-none"
    >
      <div className="flex flex-col items-center gap-4 max-w-xs text-center px-6">
        {/* Decorative icon ring */}
        <div className="relative">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isWhatsApp
              ? "bg-[#25D366]/5 border border-[#25D366]/10"
              : "bg-primary/5 border border-primary/10"
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isWhatsApp
                ? "bg-[#25D366]/10"
                : "bg-primary/10"
            }`}>
              {isWhatsApp ? (
                <Phone className="w-5 h-5 text-[#25D366]/50" />
              ) : (
                <MessageSquare className="w-5 h-5 text-primary/50" />
              )}
            </div>
          </div>
          {/* Subtle floating dots decoration */}
          <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
            isWhatsApp ? "bg-[#25D366]/15" : "bg-primary/15"
          }`} />
          <div className={`absolute -bottom-0.5 -left-1.5 w-2 h-2 rounded-full ${
            isWhatsApp ? "bg-[#25D366]/10" : "bg-primary/10"
          }`} />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground/70">
            No hay mensajes aún
          </p>
          <p className="text-xs text-muted-foreground/40 leading-relaxed">
            Escribe un mensaje para iniciar la conversación con{" "}
            <span className={`font-medium ${
              isWhatsApp ? "text-[#25D366]/50" : "text-primary/50"
            }`}>
              {displayName}
            </span>
          </p>
        </div>

        {/* Subtle decorative line */}
        <div className={`w-12 h-px ${
          isWhatsApp
            ? "bg-gradient-to-r from-transparent via-[#25D366]/20 to-transparent"
            : "bg-gradient-to-r from-transparent via-primary/20 to-transparent"
        }`} />
      </div>
    </motion.div>
  );
}

export function ChatMessageList({
  messagesScrollRef,
  firstUnreadRef,
  messagesEndRef,
  inputRef,
  messages,
  isLoadingMsgs,
  isUserTyping,
  activeConv,
  activeMessageId,
  copiedId,
  keyboardInset,
  setActiveMessageId,
  handleCopy,
  setReplyingTo,
}: ChatMessageListProps) {
  return (
    <div
      ref={messagesScrollRef as React.RefObject<HTMLDivElement>}
      className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto space-y-4 bg-secondary/5 min-h-0 overscroll-y-contain"
      style={keyboardInset > 0 ? { paddingBottom: keyboardInset + 16 } : undefined}
    >
      {isLoadingMsgs ? (
        <div className="h-full flex items-center justify-center">
          <Loading text="" subtext="" className="py-0" />
        </div>
      ) : messages.length === 0 ? (
        <EmptyMessagesWatermark activeConv={activeConv} />
      ) : (
        <>
          {(() => {
            const firstUnreadIndex = getFirstUnreadMessageIndex(messages);
            return messages.map((msg, idx) => {
              const isMe = msg.senderRole === "admin";
              const isFirstUnread = idx === firstUnreadIndex;
              return (
                <div
                  key={msg.id}
                  ref={isFirstUnread ? (firstUnreadRef as React.RefObject<HTMLDivElement>) : null}
                  className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${
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
                      <div
                        className={`mb-1.5 p-2 rounded-lg text-xs border-l-2 ${
                          isMe
                            ? "bg-primary-foreground/10 border-primary-foreground/40 text-primary-foreground/80"
                            : "bg-background/50 border-primary/40 text-muted-foreground"
                        }`}
                      >
                        <div className={`font-semibold mb-0.5 ${isMe ? "text-primary-foreground" : "text-primary/80"}`}>
                          {msg.replyTo.senderRole === "admin" ? "Tú" : activeConv?.user?.name || "Cliente"}
                        </div>
                        <div className="truncate opacity-90">{msg.replyTo.content}</div>
                      </div>
                    )}
                    {msg.content}
                    {/* Desktop: hover-based side buttons */}
                    <div
                      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity items-center gap-0.5 ${
                        isMe ? "-left-[60px]" : "-right-[60px]"
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(msg.id, msg.content);
                        }}
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 17 4 12 9 7" />
                          <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                        </svg>
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 17 4 12 9 7" />
                            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                          </svg>
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
            <div className="flex flex-col max-w-[70%] mr-auto items-start animate-pulse">
              <div className="p-3.5 rounded-2xl text-xs shadow-sm bg-secondary text-secondary-foreground border border-border/40 rounded-tl-none flex items-center gap-2.5">
                <span className="flex space-x-1 items-center">
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </span>
                <span className="text-muted-foreground/90 font-medium">El cliente está escribiendo...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
        </>
      )}
    </div>
  );
}
