import React from "react";
import { cn } from "@/lib/utils";
import { AdminChatViewProps } from "./types";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMainArea } from "./ChatMainArea";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

export function AdminChatView(props: AdminChatViewProps) {
  const isWhatsAppTab = props.sidebarTab === "whatsapp";
  const activeWhatsAppList = isWhatsAppTab
    ? props.whatsappConversations
    : props.sidebarTab === "chats"
    ? props.conversations
    : [];

  return (
    <div
      ref={props.pageContainerRef}
      className={cn(
        "flex flex-col md:flex-row bg-background text-foreground font-sans",
        props.isEmbedded ? "h-full min-h-0 overflow-hidden" : "overflow-y-auto pt-14 md:pt-20"
      )}
      style={props.isEmbedded ? undefined : { height: props.viewportHeight }}
    >
      <ChatSidebar
        isEmbedded={props.isEmbedded}
        activeConv={props.activeConv}
        isConnected={props.isConnected}
        isE2EEReady={props.isE2EEReady}
        isWhatsAppTab={isWhatsAppTab}
        sidebarTab={props.sidebarTab}
        setSidebarTab={props.setSidebarTab}
        sidebarScrollRef={props.sidebarScrollRef}
        conversations={activeWhatsAppList}
        isLoadingConvs={isWhatsAppTab ? props.isLoadingWhatsApp : props.isLoadingConvs}
        setActiveConv={props.setActiveConv}
        searchQuery={props.searchQuery}
        setSearchQuery={props.setSearchQuery}
        isLoadingUsers={props.isLoadingUsers}
        usersList={props.usersList}
        handleSelectUserChat={props.handleSelectUserChat}
        usersPage={props.usersPage}
        totalPages={props.totalPages}
        setUsersPage={props.setUsersPage}
        newPhoneNumber={props.newPhoneNumber}
        setNewPhoneNumber={props.setNewPhoneNumber}
        whatsappNewMsg={props.whatsappNewMsg}
        setWhatsAppNewMsg={props.setWhatsAppNewMsg}
        handleStartNewWhatsApp={props.handleStartNewWhatsApp}
        isSendingWhatsApp={props.isSendingWhatsApp}
        whatsappError={props.whatsappError}
        setWhatsAppError={props.setWhatsAppError}
      />

      <ChatMainArea
        activeConv={props.activeConv}
        setActiveConv={props.setActiveConv}
        setShowDeleteConfirm={props.setShowDeleteConfirm}
        messagesScrollRef={props.messagesScrollRef}
        firstUnreadRef={props.firstUnreadRef}
        messagesEndRef={props.messagesEndRef}
        inputRef={props.inputRef}
        messages={props.messages}
        isLoadingMsgs={props.isLoadingMsgs}
        isUserTyping={props.isUserTyping}
        activeMessageId={props.activeMessageId}
        copiedId={props.copiedId}
        keyboardInset={props.keyboardInset}
        inputMessage={props.inputMessage}
        isConnected={props.isConnected}
        isE2EEReady={props.isE2EEReady}
        replyingTo={props.replyingTo}
        setActiveMessageId={props.setActiveMessageId}
        handleCopy={props.handleCopy}
        setReplyingTo={props.setReplyingTo}
        handleInputChange={props.handleInputChange}
        handleSendMessage={props.handleSendMessage}
      />

      <DeleteConfirmModal
        show={props.showDeleteConfirm}
        isDeleting={props.isDeleting}
        onClose={() => props.setShowDeleteConfirm(false)}
        onConfirm={props.handleDeleteConversation}
      />
    </div>
  );
}
