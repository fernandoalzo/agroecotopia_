"use client";

import { Bot, Leaf, Lock, Trash2, X } from "lucide-react";

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
    isAIMode: boolean;
    aiTitle: string;
    aiSubtitle: string;
    onClose: () => void;
    onDeleteClick: () => void;
    onToggleAIMode: () => void;
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
    isAIMode,
    aiTitle,
    aiSubtitle,
    onClose,
    onDeleteClick,
    onToggleAIMode,
}: ChatHeaderProps) => {
    const displayName = isAdminUser && targetUserId
        ? (targetUserName || "Cargando...")
        : isAIMode
            ? aiTitle
            : title;

    const statusLabel = isAIMode
        ? aiSubtitle
        : isConnected
            ? onlineLabel
            : offlineLabel;

    return (
        <div className="p-4 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground flex items-center justify-between border-b border-primary/20">
            <div className="flex items-center gap-2.5">
                <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAIMode ? "bg-violet-500/30" : "bg-primary-foreground/20"}`}>
                        {isAIMode ? (
                            <Bot className="w-5 h-5 text-violet-200 filter drop-shadow-sm" />
                        ) : (
                            <Leaf className="w-5 h-5 text-primary-foreground filter drop-shadow-sm" />
                        )}
                    </div>
                    {!isAIMode && (
                        <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-primary ${isConnected ? "bg-green-500" : "bg-zinc-400"
                                }`}
                        />
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-sm leading-none flex items-center gap-1.5">
                        {displayName}
                        {isE2EEReady && !isAIMode && (
                            <span title="Cifrado de extremo a extremo">
                                <Lock className="w-3.5 h-3.5 text-primary-foreground/80" />
                            </span>
                        )}
                    </h3>
                    <span className="text-[11px] opacity-80">
                        {statusLabel}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={onToggleAIMode}
                    className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${isAIMode
                            ? "bg-violet-500/30 text-violet-100 hover:bg-violet-500/40"
                            : "bg-primary-foreground/15 text-primary-foreground/80 hover:bg-primary-foreground/25"
                        }`}
                    title={isAIMode ? "Cambiar a soporte humano" : "Usar asistente IA"}
                >
                    {isAIMode ? "🧠 IA" : "💬 Humano"}
                </button>
                {conversationId && !isAIMode && (
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