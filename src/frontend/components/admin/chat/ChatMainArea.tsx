import React from "react";
import { ArrowLeft, User, Trash2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation } from "./types";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInputBar } from "./ChatInputBar";
import { EmptyChatState } from "./EmptyChatState";
import { Message } from "@/frontend/components/chat/ChatWidget";

interface ChatMainAreaProps {
  activeConv: Conversation | null;
  setActiveConv: (conv: Conversation | null) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  messagesScrollRef: React.RefObject<HTMLDivElement | null>;
  firstUnreadRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  messages: Message[];
  isLoadingMsgs: boolean;
  isUserTyping: boolean;
  activeMessageId: string | null;
  copiedId: string | null;
  keyboardInset: number;
  inputMessage: string;
  isConnected: boolean;
  isE2EEReady: boolean;
  replyingTo: Message | null;
  setActiveMessageId: (id: string | null) => void;
  handleCopy: (id: string, text: string) => void;
  setReplyingTo: (msg: Message | null) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.FormEvent) => void;
}

export function ChatMainArea({
  activeConv,
  setActiveConv,
  setShowDeleteConfirm,
  messagesScrollRef,
  firstUnreadRef,
  messagesEndRef,
  inputRef,
  messages,
  isLoadingMsgs,
  isUserTyping,
  activeMessageId,
  copiedId,
  keyboardInset,
  inputMessage,
  isConnected,
  isE2EEReady,
  replyingTo,
  setActiveMessageId,
  handleCopy,
  setReplyingTo,
  handleInputChange,
  handleSendMessage,
}: ChatMainAreaProps) {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col bg-background relative min-h-0 min-w-0 h-full overflow-hidden",
        activeConv ? "flex" : "hidden md:flex"
      )}
    >
      {activeConv ? (
        <>
          {/* Header */}
          <div className={`px-3 py-3 sm:px-4 md:px-5 md:py-4 border-b border-border/40 flex items-center gap-2 backdrop-blur-sm z-10 shrink-0 ${
            activeConv.type === "WHATSAPP" ? "bg-[#25D366]/5" : "bg-card/20"
          }`}>
            <button
              onClick={() => setActiveConv(null)}
              className="md:hidden p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer shrink-0"
              title="Volver a la lista"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
              activeConv.type === "WHATSAPP"
                ? "bg-[#25D366]/10 text-[#25D366]"
                : "bg-secondary text-secondary-foreground"
            }`}>
              {activeConv.type === "WHATSAPP" ? <Phone className="w-5 h-5" /> : (activeConv.user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground leading-snug truncate">
                  {activeConv.type === "WHATSAPP"
                    ? activeConv.whatsappPhone || activeConv.user?.name || "WhatsApp"
                    : activeConv.user?.name || "Usuario"}
                </h2>
                {activeConv.type === "WHATSAPP" && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 flex-shrink-0">
                    WhatsApp
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-normal truncate mt-0.5">
                {activeConv.type === "WHATSAPP"
                  ? activeConv.user?.email || (activeConv.whatsappPhone ? `📱 ${activeConv.whatsappPhone}` : "Chat externo")
                  : activeConv.user?.email || ""}
              </p>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all flex items-center justify-center cursor-pointer border border-red-500/20 hover:border-red-500/30 shadow-sm"
              title="Eliminar Conversación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <ChatMessageList
            messagesScrollRef={messagesScrollRef}
            firstUnreadRef={firstUnreadRef}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
            messages={messages}
            isLoadingMsgs={isLoadingMsgs}
            isUserTyping={isUserTyping}
            activeConv={activeConv}
            activeMessageId={activeMessageId}
            copiedId={copiedId}
            keyboardInset={keyboardInset}
            setActiveMessageId={setActiveMessageId}
            handleCopy={handleCopy}
            setReplyingTo={setReplyingTo}
          />

          <ChatInputBar
            inputRef={inputRef}
            inputMessage={inputMessage}
            isConnected={isConnected}
            isE2EEReady={isE2EEReady}
            replyingTo={replyingTo}
            activeConv={activeConv}
            keyboardInset={keyboardInset}
            handleInputChange={handleInputChange}
            handleSendMessage={handleSendMessage}
            setReplyingTo={setReplyingTo}
          />
        </>
      ) : (
        <EmptyChatState />
      )}
    </div>
  );
}
