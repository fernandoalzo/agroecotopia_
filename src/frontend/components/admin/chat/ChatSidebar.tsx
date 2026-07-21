import React, { useState, useRef } from "react";
import { MessageSquare, Lock, UserPlus, Phone, ChevronDown, ChevronUp, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Conversation, User as UserType } from "./types";
import { ConversationList } from "./ConversationList";
import { UsersList } from "./UsersList";

interface ChatSidebarProps {
  isEmbedded: boolean;
  activeConv: Conversation | null;
  isConnected: boolean;
  isE2EEReady: boolean;
  isWhatsAppTab?: boolean;
  sidebarTab: "chats" | "whatsapp" | "users";
  setSidebarTab: (tab: "chats" | "whatsapp" | "users") => void;
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

  // New WhatsApp conversation
  newPhoneNumber: string;
  setNewPhoneNumber: (value: string) => void;
  whatsappNewMsg: string;
  setWhatsAppNewMsg: (value: string) => void;
  handleStartNewWhatsApp: (e: React.FormEvent) => void;
  isSendingWhatsApp: boolean;
  whatsappError: string | null;
  setWhatsAppError: (error: string | null) => void;
}

export function ChatSidebar({
  isEmbedded,
  activeConv,
  isConnected,
  isE2EEReady,
  isWhatsAppTab = false,
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
  newPhoneNumber,
  setNewPhoneNumber,
  whatsappNewMsg,
  setWhatsAppNewMsg,
  handleStartNewWhatsApp,
  isSendingWhatsApp,
  whatsappError,
  setWhatsAppError,
}: ChatSidebarProps) {
  const [whatsappExpanded, setWhatsappExpanded] = useState(false);
  const whatsappTextareaRef = useRef<HTMLTextAreaElement>(null);
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
          Chat Interno
        </button>
        <button
          onClick={() => setSidebarTab("whatsapp")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            sidebarTab === "whatsapp"
              ? "bg-[#25D366] text-white shadow-sm shadow-[#25D366]/30"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          WhatsApp
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
          Usuarios
        </button>
      </div>

      {sidebarTab === "chats" || sidebarTab === "whatsapp" ? (
        <div ref={sidebarScrollRef} className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-y-contain">
          {isWhatsAppTab && (
            <div className="mb-2 border-b border-border/40">
              <button
                type="button"
                onClick={() => setWhatsappExpanded(!whatsappExpanded)}
                className="w-full flex items-center justify-between px-0 py-2.5 text-left group"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Nuevo mensaje WhatsApp
                  </span>
                </div>
                {whatsappExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {whatsappExpanded && (
                  <motion.div
                    key="whatsapp-form"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleStartNewWhatsApp} className="pb-3 space-y-2.5">
                      <input
                        type="tel"
                        placeholder="Número, ej. 573001234567"
                        value={newPhoneNumber}
                        onChange={(e) => { setWhatsAppError(null); setNewPhoneNumber(e.target.value); }}
                        className="w-full text-sm px-0 py-1.5 border-0 border-b border-border/60 bg-transparent focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-muted-foreground/30"
                      />
                      <textarea
                        ref={whatsappTextareaRef}
                        placeholder="Escribe tu mensaje..."
                        value={whatsappNewMsg}
                        onChange={(e) => {
                          setWhatsAppError(null);
                          setWhatsAppNewMsg(e.target.value);
                          const el = e.target;
                          el.style.height = "auto";
                          el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                        }}
                        rows={1}
                        className="w-full text-sm px-0 py-1.5 border-0 border-b border-border/60 bg-transparent focus:outline-none focus:border-emerald-500 transition-colors resize-none placeholder:text-muted-foreground/30 overflow-y-auto max-h-[200px]"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex-1 min-h-[20px]">
                          {whatsappError && (
                            <p className="text-xs text-rose-600 dark:text-rose-400">{whatsappError}</p>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={!newPhoneNumber.trim() || !whatsappNewMsg.trim() || isSendingWhatsApp}
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {isSendingWhatsApp ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Enviando
                            </span>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              Enviar
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <ConversationList
            conversations={conversations}
            activeConv={activeConv}
            isLoadingConvs={isLoadingConvs}
            isWhatsApp={isWhatsAppTab}
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
