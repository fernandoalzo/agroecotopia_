"use client";

import { useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { config } from "@/config/config";
import type { Message } from "./ChatWidget";

interface ChatInputProps {
    inputMessage: string;
    isConnected: boolean;
    isE2EEReady: boolean;
    replyingTo: Message | null;
    sessionUserId: string;
    chatTitle: string;
    placeholder: string;
    disconnectedPlaceholder: string;
    disconnectedWarning: string;
    replyingToLabel: string;

    // ✅ FIXED
    inputRef: React.RefObject<HTMLInputElement | null>;

    isAIMode: boolean;
    isAIResponding: boolean;
    aiPlaceholder: string;
    aiWarning: string;

    onInputChange: (
        e: React.ChangeEvent<HTMLInputElement>
    ) => void;

    onSubmit: (
        e: React.FormEvent
    ) => void;

    onCancelReply: () => void;
}

export const ChatInput = ({
    inputMessage,
    isConnected,
    isE2EEReady,
    replyingTo,
    sessionUserId,
    chatTitle,
    placeholder,
    disconnectedPlaceholder,
    disconnectedWarning,
    replyingToLabel,
    inputRef,
    isAIMode,
    isAIResponding,
    aiPlaceholder,
    aiWarning,
    onInputChange,
    onSubmit,
    onCancelReply,
}: ChatInputProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        onSubmit(e);
        setTimeout(() => setIsSubmitting(false), 300);
    };

    const isAiDisabled = isAIMode && isAIResponding;
    const isHumanDisabled = !isAIMode && (
        !inputMessage.trim() ||
        !isConnected ||
        (config.chat.enableE2EE && !isE2EEReady)
    );
    const isSendDisabled = isAIMode ? isAiDisabled : (isHumanDisabled || isSubmitting);

    return (
        <div className="border-t border-border bg-background">
            {/* Disconnected warning banner (human mode only) */}
            {!isAIMode && !isConnected && (
                <div className="px-3 py-1 bg-amber-500/10 border-b border-amber-500/15 text-amber-500 text-[10px] font-medium flex items-center gap-1.5 animate-pulse">
                    <span className="w-1 h-1 bg-amber-500 rounded-full" />
                    {disconnectedWarning}
                </div>
            )}

            {/* AI mode indicator */}
            {isAIMode && (
                <div className="px-3 py-1 bg-violet-500/10 border-b border-violet-500/15 text-violet-600 dark:text-violet-400 text-[10px] font-medium flex items-center gap-1.5">
                    <Bot className="w-3 h-3" />
                    Modo IA — pregúntame sobre productos, cultivos, plagas o la plataforma
                </div>
            )}

            {/* Reply preview banner */}
            {replyingTo && (
                <div className="px-3 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2 border-l-2 border-primary pl-2">
                        <div className="text-[10px] font-semibold text-primary">
                            {replyingToLabel}{" "}
                            {replyingTo.senderId === sessionUserId
                                ? "ti"
                                : chatTitle}
                        </div>

                        <div className="text-xs text-muted-foreground truncate">
                            {replyingTo.content}
                        </div>
                    </div>

                    <button
                        onClick={onCancelReply}
                        className="p-1 hover:bg-secondary rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            )}

            {/* Input row */}
            <form
                onSubmit={handleSubmit}
                className="p-3 flex items-center gap-2"
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={onInputChange}
                    disabled={isAIMode ? isAIResponding : !isConnected}
                    placeholder={
                        isAIMode
                            ? aiPlaceholder
                            : isConnected
                                ? placeholder
                                : disconnectedPlaceholder
                    }
                    className={`flex-1 h-10 px-3 border rounded-xl text-sm outline-none bg-secondary/10 transition-all disabled:opacity-50 ${isAIMode
                            ? "border-violet-300 dark:border-violet-700 hover:border-violet-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                            : "border-border hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary"
                        }`}
                />

                <button
                    type="submit"
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={isSendDisabled}
                    className={`h-10 w-10 flex items-center justify-center rounded-xl shadow-sm transition-all cursor-pointer ${isAIMode
                            ? "bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 disabled:hover:bg-violet-600"
                            : "bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-40 disabled:hover:bg-primary"
                        }`}
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
};
