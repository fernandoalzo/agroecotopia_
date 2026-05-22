import React from "react";
import { MessageSquare, Lock, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation, User as UserType } from "./types";
import { ConversationList } from "./ConversationList";
import { UsersList } from "./UsersList";

interface ChatSidebarProps {
  isEmbedded: boolean;
  activeConv: Conversation | null;
  isConnected: boolean;
  isE2EEReady: boolean;
  sidebarTab: "chats" | "users";
  setSidebarTab: (tab: "chats" | "users") => void;
  sidebarScrollRef: React.RefObject<HTMLDivElement | null>;
  
  // Conversation List Props
  conversations: Conversation[];
  isLoadingConvs: boolean;
  setActiveConv: (conv: Conversation | null) => void;
  
  // Users List Props
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoadingUsers: boolean;
  usersList: UserType[];
  handleSelectUserChat: (userId: string) => void;
  usersPage: number;
  totalPages: number;
  setUsersPage: (page: number | ((p: number) => number)) => void;
}

export function ChatSidebar({
  isEmbedded,
  activeConv,
  isConnected,
  isE2EEReady,
  sidebarTab,
  setSidebarTab,
  sidebarScrollRef,
  conversations,
  isLoadingConvs,
  setActiveConv,
  searchQuery,
  setSearchQuery,
  isLoadingUsers,
  usersList,
  handleSelectUserChat,
  usersPage,
  totalPages,
  setUsersPage,
}: ChatSidebarProps) {
  return (
    <div
      className={cn(
        "w-full md:w-[380px] border-r border-border/40 flex flex-col bg-card/40 min-h-0 shrink-0 md:shrink",
        activeConv ? "hidden md:flex" : "flex flex-1 md:flex-none md:h-full"
      )}
    >
      {!isEmbedded && (
        <div className="p-5 border-b border-border/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-semibold text-base leading-snug font-display">Soporte Chat</h1>
                {isE2EEReady && (
                  <span title="Cifrado de Extremo a Extremo Activado">
                    <Lock className="w-3.5 h-3.5 text-primary opacity-80" />
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground/70 mt-1 block">Panel de Administración</span>
            </div>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500" : "bg-muted animate-pulse"}`}
            title={isConnected ? "WebSocket Conectado" : "Buscando conexión..."}
          />
        </div>
      )}

      {/* Tabs Bar */}
      <div className="px-4 py-2.5 border-b border-border/40 flex gap-2 bg-card/20">
        <button
          onClick={() => setSidebarTab("chats")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            sidebarTab === "chats"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chats Activos
        </button>
        <button
          onClick={() => setSidebarTab("users")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            sidebarTab === "users"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Buscar Usuarios
        </button>
      </div>

      {sidebarTab === "chats" ? (
        <div ref={sidebarScrollRef} className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-y-contain">
          <ConversationList
            conversations={conversations}
            activeConv={activeConv}
            isLoadingConvs={isLoadingConvs}
            setActiveConv={setActiveConv}
          />
        </div>
      ) : (
        <div ref={sidebarScrollRef} className="flex-1 flex flex-col min-h-0">
          <UsersList
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isLoadingUsers={isLoadingUsers}
            usersList={usersList}
            handleSelectUserChat={handleSelectUserChat}
            usersPage={usersPage}
            totalPages={totalPages}
            setUsersPage={setUsersPage}
          />
        </div>
      )}
    </div>
  );
}
