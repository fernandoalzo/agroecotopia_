import React from "react";
import { User, Phone } from "lucide-react";
import { Conversation } from "./types";
import { Loading } from "@/components/ui/Loading";
import { getConversationUnreadCount } from "@/frontend/lib/chatUnread";

interface ConversationListProps {
  conversations: Conversation[];
  activeConv: Conversation | null;
  isLoadingConvs: boolean;
  isWhatsApp?: boolean;
  setActiveConv: (conv: Conversation | null) => void;
}

export function ConversationList({
  conversations,
  activeConv,
  isLoadingConvs,
  isWhatsApp = false,
  setActiveConv,
}: ConversationListProps) {
  if (isLoadingConvs) {
    return (
      <div className="h-40 flex items-center justify-center">
        <Loading text="" subtext="" className="py-0 scale-75" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No hay conversaciones activas.
      </div>
    );
  }

  return (
    <>
      {conversations.map((conv) => {
        const isActive = activeConv?.id === conv.id;
        const lastMsg = conv.messages?.[0];
        const badgeCount = isActive ? 0 : getConversationUnreadCount(conv);
        const displayName = isWhatsApp
          ? conv.whatsappPhone || conv.user?.name || "WhatsApp"
          : conv.user?.name || "Usuario";
        const displayInitial = isWhatsApp
          ? "📱"
          : conv.user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />;

        return (
          <button
            key={conv.id}
            onClick={() => { if (activeConv?.id !== conv.id) setActiveConv(conv); }}
            className={`w-full text-left p-3.5 sm:p-4 rounded-xl transition-all flex items-center gap-3 border ${
              isActive
                ? isWhatsApp
                  ? "bg-[#25D366] border-[#25D366]/20 text-white shadow-md"
                  : "bg-primary border-primary/20 text-primary-foreground shadow-md"
                : "bg-transparent border-transparent hover:bg-secondary/40 hover:border-border/40"
            }`}
          >
            <div className="relative flex-shrink-0">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${
                  isActive
                    ? isWhatsApp
                      ? "bg-white/20 text-white"
                      : "bg-primary-foreground/15 text-primary-foreground"
                    : isWhatsApp
                      ? "bg-[#25D366]/10 text-[#25D366]"
                      : "bg-secondary text-secondary-foreground"
                }`}
              >
                {isWhatsApp ? <Phone className="w-5 h-5" /> : displayInitial}
              </div>
              {isWhatsApp && !isActive && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#25D366] rounded-full flex items-center justify-center">
                  <span className="text-white text-[6px] font-bold">WA</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3
                  className={`text-sm font-semibold truncate ${
                    isActive
                      ? isWhatsApp
                        ? "text-white"
                        : "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {displayName}
                </h3>
                {conv.updatedAt && (
                  <span
                    className={`text-[10px] flex-shrink-0 ${
                      isActive
                        ? isWhatsApp
                          ? "text-white/75"
                          : "text-primary-foreground/75"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {new Date(conv.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p
                  className={`text-xs truncate ${
                    isActive
                      ? isWhatsApp
                        ? "text-white/90 font-medium"
                        : "text-primary-foreground/90 font-medium"
                      : "text-muted-foreground"
                  } ${badgeCount > 0 ? "text-foreground font-bold" : ""}`}
                >
                  {lastMsg?.content || "Inicia una conversación..."}
                </p>
                {badgeCount > 0 && (
                  <span className={`flex-shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1.5 animate-pulse shadow-sm shadow-red-500/20 ${
                    isWhatsApp ? "bg-[#25D366] text-white" : "bg-red-500 text-white"
                  }`}>
                    {badgeCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </>
  );
}
