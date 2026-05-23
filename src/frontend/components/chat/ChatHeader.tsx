"use client";

import { Leaf, Lock, Trash2, X } from "lucide-react";

interface ChatHeaderProps {
    title: string;
    isConnected: boolean;
    isE2EEReady: boolean;
    isAdminUser: boolean;
    targetUserId?: string;
    targetUserName: string | null;
    conversationId: string | undefined;
    onlineLabel: string;
    offlineLabel: string;
    tooltipClear: string;
    onClose: () => void;
    onDeleteClick: () => void;
}

export const ChatHeader = ({
    title,
    isConnected,
    isE2EEReady,
    isAdminUser,
    targetUserId,
    targetUserName,
    conversationId,
    onlineLabel,
    offlineLabel,
    tooltipClear,
    onClose,
    onDeleteClick,
}: ChatHeaderProps) => {
    const displayName = isAdminUser && targetUserId
        ? (targetUserName || "Cargando...")
        : title;

    return (
        <div className="p-4 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground flex items-center justify-between border-b border-primary/20">
            <div className="flex items-center gap-2.5">
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-primary-foreground filter drop-shadow-sm" />
                    </div>
                    <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-primary ${isConnected ? "bg-green-500" : "bg-zinc-400"
                            }`}
                    />
                </div>
                <div>
                    <h3 className="font-semibold text-sm leading-none flex items-center gap-1.5">
                        {displayName}
                        {isE2EEReady && (
                            <span title="Cifrado de extremo a extremo">
                                <Lock className="w-3.5 h-3.5 text-primary-foreground/80" />
                            </span>
                        )}
                    </h3>
                    <span className="text-[11px] opacity-80">
                        {isConnected ? onlineLabel : offlineLabel}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                {conversationId && (
                    <button
                        onClick={onDeleteClick}
                        className="p-1.5 hover:bg-primary-foreground/15 rounded-full transition-colors cursor-pointer"
                        title={tooltipClear}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-primary-foreground/15 rounded-full transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};