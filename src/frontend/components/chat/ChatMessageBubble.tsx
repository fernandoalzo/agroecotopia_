"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import type { Message } from "./ChatWidget";

interface ChatMessageBubbleProps {
    msg: Message;
    isMe: boolean;
    isFirstUnread: boolean;
    copiedId: string | null;
    activeMessageId: string | null;
    sessionUserId: string;
    chatTitle: string;

    // ✅ FIXED
    firstUnreadRef: React.RefObject<HTMLDivElement | null>;

    onCopy: (id: string, content: string) => void;
    onReply: (msg: Message) => void;
    onToggleActive: (id: string) => void;
}

const ReplyIcon = () => (
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
);

const ReplyIconSm = () => (
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
);

export const ChatMessageBubble = ({
    msg,
    isMe,
    isFirstUnread,
    copiedId,
    activeMessageId,
    sessionUserId,
    chatTitle,
    firstUnreadRef,
    onCopy,
    onReply,
    onToggleActive,
}: ChatMessageBubbleProps) => {
    const isActive = activeMessageId === msg.id;

    return (
        <div
            ref={isFirstUnread ? firstUnreadRef : null}
            className={`flex flex-col max-w-[80%] ${isMe
                ? "ml-auto items-end"
                : "mr-auto items-start"
                }`}
        >
            <div
                onClick={() => onToggleActive(msg.id)}
                className={`p-3 rounded-2xl text-sm shadow-sm relative group/msg ${isMe
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-card text-card-foreground border border-border/60 rounded-tl-none"
                    } md:cursor-default cursor-pointer`}
            >
                {/* Reply preview */}
                {msg.replyTo && (
                    <div
                        className={`mb-1.5 p-2 rounded-lg text-xs border-l-2 ${isMe
                            ? "bg-primary-foreground/10 border-primary-foreground/40 text-primary-foreground/80"
                            : "bg-muted/50 border-primary/40 text-muted-foreground"
                            }`}
                    >
                        <div
                            className={`font-semibold mb-0.5 ${isMe
                                ? "text-primary-foreground"
                                : "text-primary/80"
                                }`}
                        >
                            {msg.replyTo.senderId === sessionUserId
                                ? "Tú"
                                : chatTitle}
                        </div>

                        <div className="truncate opacity-90">
                            {msg.replyTo.content}
                        </div>
                    </div>
                )}

                {msg.content}

                {/* Desktop hover actions */}
                <div
                    className={`hidden md:flex absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity items-center gap-0.5 ${isMe
                        ? "-left-[60px]"
                        : "-right-[60px]"
                        }`}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCopy(msg.id, msg.content);
                        }}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                        title="Copiar"
                    >
                        {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" />
                        )}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onReply(msg);
                        }}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                        title="Responder"
                    >
                        <ReplyIcon />
                    </button>
                </div>
            </div>

            {/* Mobile tap actions */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            height: 0,
                            y: -4,
                        }}
                        animate={{
                            opacity: 1,
                            height: "auto",
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            height: 0,
                            y: -4,
                        }}
                        transition={{
                            duration: 0.15,
                        }}
                        className={`flex md:hidden items-center gap-1 mt-1 overflow-hidden ${isMe
                            ? "justify-end"
                            : "justify-start"
                            }`}
                    >
                        <button
                            onClick={() => onCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground text-[11px] font-medium transition-colors"
                        >
                            {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                            ) : (
                                <Copy className="w-3 h-3" />
                            )}

                            {copiedId === msg.id
                                ? "✓"
                                : "Copiar"}
                        </button>

                        <button
                            onClick={() => onReply(msg)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground text-[11px] font-medium transition-colors"
                        >
                            <ReplyIconSm />
                            Responder
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </span>
        </div>
    );
};