"use client";

import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { ChatMessageBubble } from "./ChatMessageBubble";
import type { Message } from "./ChatWidget";

interface ChatMessageListProps {
    messages: Message[];
    isLoading: boolean;
    isAdminTyping: boolean;
    isOpen: boolean;
    copiedId: string | null;
    activeMessageId: string | null;
    sessionUserId: string;
    chatTitle: string;
    noMessagesText: string;
    typingText: string;

    // ✅ FIXED
    messagesScrollRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    firstUnreadRef: React.RefObject<HTMLDivElement | null>;

    onCopy: (id: string, content: string) => void;
    onReply: (msg: Message) => void;
    onToggleActive: (id: string) => void;
}

export const ChatMessageList = ({
    messages,
    isLoading,
    isAdminTyping,
    isOpen,
    copiedId,
    activeMessageId,
    sessionUserId,
    chatTitle,
    noMessagesText,
    typingText,
    messagesScrollRef,
    messagesEndRef,
    firstUnreadRef,
    onCopy,
    onReply,
    onToggleActive,
}: ChatMessageListProps) => {
    const firstUnreadIndex = messages.findIndex(
        (m) => !m.isRead && m.senderId !== sessionUserId
    );

    // Parse "¡Hola! ¿En qué..." into title + subtitle
    const parts = noMessagesText.split("! ");
    const emptyTitle =
        parts.length > 1
            ? parts[0] + "!"
            : noMessagesText;

    const emptySubtitle =
        parts.length > 1
            ? parts[1]
            : "";

    return (
        <div
            ref={messagesScrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-3 bg-secondary/5 min-h-0 overscroll-y-contain"
        >
            {isLoading ? (
                <div className="h-full flex items-center justify-center">
                    <Loading
                        text=""
                        subtext=""
                        className="py-0 scale-75"
                    />
                </div>
            ) : messages.length === 0 && !isAdminTyping ? (
                /* ── Empty state ── */
                <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none bg-gradient-to-b from-transparent to-primary/[0.02]">
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse" />

                            <motion.div
                                initial={{
                                    scale: 0.85,
                                    opacity: 0.5,
                                }}
                                animate={{
                                    scale: 1.15,
                                    opacity: 0,
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeOut",
                                }}
                                className="absolute w-16 h-16 rounded-full border border-primary/30"
                            />

                            <motion.div
                                animate={{
                                    y: [0, -6, 0],
                                    rotate: [0, 2, -2, 0],
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/25 flex items-center justify-center shadow-lg backdrop-blur-sm"
                            >
                                <Leaf className="w-8 h-8 text-primary filter drop-shadow-[0_2px_8px_rgba(34,197,94,0.3)]" />
                            </motion.div>
                        </div>

                        <motion.h4
                            initial={{
                                opacity: 0,
                                y: 8,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            transition={{
                                delay: 0.1,
                                duration: 0.5,
                            }}
                            className="font-display font-black text-2xl text-foreground tracking-tight mb-2"
                        >
                            {emptyTitle}
                        </motion.h4>

                        <motion.p
                            initial={{
                                opacity: 0,
                                y: 8,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            transition={{
                                delay: 0.2,
                                duration: 0.5,
                            }}
                            className="font-sans text-sm text-muted-foreground max-w-[245px] leading-relaxed font-medium"
                        >
                            {emptySubtitle}
                        </motion.p>
                    </div>
                </div>
            ) : (
                <>
                    {messages.map((msg, idx) => (
                        <ChatMessageBubble
                            key={msg.id}
                            msg={msg}
                            isMe={msg.senderId === sessionUserId}
                            isFirstUnread={idx === firstUnreadIndex}
                            copiedId={copiedId}
                            activeMessageId={activeMessageId}
                            sessionUserId={sessionUserId}
                            chatTitle={chatTitle}
                            firstUnreadRef={firstUnreadRef}
                            onCopy={onCopy}
                            onReply={onReply}
                            onToggleActive={onToggleActive}
                        />
                    ))}

                    {/* Typing indicator */}
                    {isAdminTyping && (
                        <div className="flex flex-col max-w-[80%] mr-auto items-start animate-pulse">
                            <div className="p-3 rounded-2xl text-xs shadow-sm bg-card text-card-foreground border border-border/60 rounded-tl-none flex items-center gap-2.5">
                                <span className="flex space-x-1 items-center">
                                    <span
                                        className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                                        style={{ animationDelay: "0ms" }}
                                    />

                                    <span
                                        className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                                        style={{ animationDelay: "150ms" }}
                                    />

                                    <span
                                        className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                                        style={{ animationDelay: "300ms" }}
                                    />
                                </span>

                                <span className="text-muted-foreground/90 font-medium">
                                    {typingText}
                                </span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </>
            )}
        </div>
    );
};