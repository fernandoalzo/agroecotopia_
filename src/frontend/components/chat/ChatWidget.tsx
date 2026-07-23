"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useChatWidget } from "./useChatWidget";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { ChatDeleteConfirm } from "./ChatDeleteConfirm";

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  conversationId: string;
  isRead: boolean;
  isEncrypted?: boolean;
  encryptionType?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    senderRole: string;
    isEncrypted?: boolean;
    encryptionType?: number;
  } | null;
}

export interface ChatWidgetProps {
  forceShow?: boolean;
  targetUserId?: string;
  chatDeps?: Parameters<typeof useChatWidget>[3];
}

import { usePathname } from "next/navigation";

export default function ChatWidget({ forceShow = false, targetUserId, chatDeps }: ChatWidgetProps = {}) {
  const pathname = usePathname();
  const shouldEnableChat = !(pathname?.startsWith("/comunidad") || pathname?.startsWith("/mi-tienda") || pathname?.startsWith("/pedidos/") || pathname?.startsWith("/tienda/"));
  const chat = useChatWidget(forceShow, targetUserId, shouldEnableChat, chatDeps);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false);

  useEffect(() => {
    const handleMobileMenu = (e: CustomEvent<boolean>) => {
      setIsMobileMenuOpen(e.detail);
    };
    const handleSettingsMenu = (e: CustomEvent<boolean>) => {
      setIsSettingsMenuOpen(e.detail);
    };
    const handleNotificationsMenu = (e: CustomEvent<boolean>) => {
      setIsNotificationsMenuOpen(e.detail);
    };
    window.addEventListener("mobile-menu-state", handleMobileMenu as EventListener);
    window.addEventListener("settings-menu-state", handleSettingsMenu as EventListener);
    window.addEventListener("notifications-menu-state", handleNotificationsMenu as EventListener);
    return () => {
      window.removeEventListener("mobile-menu-state", handleMobileMenu as EventListener);
      window.removeEventListener("settings-menu-state", handleSettingsMenu as EventListener);
      window.removeEventListener("notifications-menu-state", handleNotificationsMenu as EventListener);
    };
  }, []);

  if (!chat.isClient || chat.status !== "authenticated") return null;
  if (!forceShow && (chat.isRouteAdmin || chat.isAdminUser)) return null;
  if (!shouldEnableChat) return null;

  const isMobileOpen = chat.isClient && chat.isOpen && window.innerWidth < 768;

  // Don't render the widget at all on mobile if the menu is open,
  // or just hide it using CSS classes below. We can just hide the container.
  if ((isMobileMenuOpen || isSettingsMenuOpen || isNotificationsMenuOpen) && window.innerWidth < 1024) return null;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {chat.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => chat.setIsOpen(false)}
            data-home-snap-ignore="true"
            className="fixed inset-0 bg-black/35 backdrop-blur-[3px] z-[998] cursor-pointer"
          />
        )}
      </AnimatePresence>

      <div
        data-home-snap-ignore="true"
        className={isMobileOpen
          ? "fixed inset-0 z-[999] font-sans"
          : "fixed bottom-5 right-5 z-[999] md:bottom-8 md:right-8 font-sans"
        }
      >
        <AnimatePresence>
          {chat.isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              ref={chat.chatContainerRef}
              className="relative w-full h-full md:absolute md:inset-auto md:bottom-20 md:right-0 md:w-[380px] md:h-[580px] md:rounded-2xl md:border md:border-border/80 md:shadow-2xl flex flex-col overflow-hidden bg-background z-50"
            >
              <ChatHeader
                title={chat.t.title}
                isConnected={chat.isConnected}
                isE2EEReady={chat.isE2EEReady}
                isAdminUser={chat.isAdminUser}
                targetUserId={targetUserId}
                targetUserName={chat.targetUserName}
                conversationId={chat.conversation?.id}
                onlineLabel={chat.t.online}
                offlineLabel={chat.t.offline}
                tooltipClear={chat.t.tooltipClear}
                isAIMode={chat.isAIMode}
                aiTitle={chat.t.aiTitle}
                aiSubtitle={chat.t.aiSubtitle}
                onClose={() => chat.setIsOpen(false)}
                onDeleteClick={() => chat.setShowDeleteConfirm(true)}
                onToggleAIMode={chat.handleToggleAIMode}
              />

              <ChatMessageList
                messages={chat.messages}
                isLoading={chat.isLoading}
                isAdminTyping={chat.isAdminTyping}
                isOpen={chat.isOpen}
                copiedId={chat.copiedId}
                activeMessageId={chat.activeMessageId}
                sessionUserId={chat.session?.user?.id ?? ""}
                chatTitle={chat.t.title}
                noMessagesText={chat.t.noMessages}
                typingText={chat.t.typing}
                messagesScrollRef={chat.messagesScrollRef}
                messagesEndRef={chat.messagesEndRef}
                firstUnreadRef={chat.firstUnreadRef}
                isAIMode={chat.isAIMode}
                isAIResponding={chat.isAIResponding}
                aiNoMessagesText={chat.t.aiNoMessages}
                aiThinkingText={chat.t.aiThinking}
                onCopy={chat.handleCopy}
                onReply={(msg) => {
                  chat.setReplyingTo(msg);
                  chat.setActiveMessageId(null);
                  setTimeout(() => chat.inputRef.current?.focus(), 50);
                }}
                onToggleActive={(id) =>
                  chat.setActiveMessageId(chat.activeMessageId === id ? null : id)
                }
              />

              <ChatInput
                inputMessage={chat.inputMessage}
                isConnected={chat.isConnected}
                isE2EEReady={chat.isE2EEReady}
                replyingTo={chat.replyingTo}
                sessionUserId={chat.session?.user?.id ?? ""}
                chatTitle={chat.t.title}
                placeholder={chat.t.placeholder}
                disconnectedPlaceholder={chat.t.disconnectedPlaceholder}
                disconnectedWarning={chat.t.disconnectedWarning}
                replyingToLabel={chat.t.replyingTo}
                inputRef={chat.inputRef}
                isAIMode={chat.isAIMode}
                isAIResponding={chat.isAIResponding}
                aiPlaceholder={chat.t.placeholder}
                aiWarning={chat.t.disconnectedWarning}
                onInputChange={chat.handleInputChange}
                onSubmit={chat.handleSendMessage}
                onCancelReply={() => chat.setReplyingTo(null)}
              />

              <AnimatePresence>
                {chat.showDeleteConfirm && (
                  <ChatDeleteConfirm
                    isDeleting={chat.isDeleting}
                    title={chat.t.clearConfirmTitle}
                    description={chat.t.clearConfirmDesc}
                    confirmLabel={chat.t.clearConfirmBtn}
                    cancelLabel={chat.t.cancelBtn}
                    onConfirm={chat.handleDeleteConversation}
                    onCancel={() => chat.setShowDeleteConfirm(false)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating button */}
        <button
          onClick={() => chat.setIsOpen(!chat.isOpen)}
          aria-label="Abrir chat de soporte"
          className={`relative h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 md:h-16 md:w-16 ${chat.isOpen ? "hidden md:flex" : "flex"
            }`}
        >
          {chat.isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          {chat.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white animate-pulse shadow-md shadow-red-500/30 border-2 border-background">
              {chat.unreadCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
