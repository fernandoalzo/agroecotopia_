"use client";

import { Send, X } from "lucide-react";
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
    onInputChange,
    onSubmit,
    onCancelReply,
}: ChatInputProps) => {
    const isSendDisabled =
        !inputMessage.trim() ||
        !isConnected ||
        (
            config.chat.enableE2EE &&
            !isE2EEReady
        );

    return (
        <div className="border-t border-border bg-background">
            {/* Disconnected warning banner */}
            {!isConnected && (
                <div className="px-3 py-1 bg-amber-500/10 border-b border-amber-500/15 text-amber-500 text-[10px] font-medium flex items-center gap-1.5 animate-pulse">
                    <span className="w-1 h-1 bg-amber-500 rounded-full" />
                    {disconnectedWarning}
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
                onSubmit={onSubmit}
                className="p-3 flex items-center gap-2"
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={onInputChange}
                    onFocus={() => {
                        let count = 0;

                        const interval = setInterval(() => {
                            window.scrollTo(0, 0);

                            count++;

                            if (count > 10) {
                                clearInterval(interval);
                            }
                        }, 50);
                    }}
                    disabled={!isConnected}
                    placeholder={
                        isConnected
                            ? placeholder
                            : disconnectedPlaceholder
                    }
                    className="flex-1 h-10 px-3 border border-border hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none bg-secondary/10 transition-all disabled:opacity-50"
                />

                <button
                    type="submit"
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={isSendDisabled}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-40 disabled:hover:bg-primary shadow-sm transition-all cursor-pointer"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
};