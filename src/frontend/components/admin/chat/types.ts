import { Message } from "@/frontend/components/chat/ChatWidget";
import type { Session } from "next-auth";

export interface Conversation {
  id: string;
  userId?: string | null;
  type?: "SUPPORT" | "ORDER" | "WHATSAPP";
  whatsappPhone?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
  };
  messages?: Message[];
  unreadCount: number;
  updatedAt?: string | Date;
}

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

export interface AdminChatViewProps {
  status: "loading" | "authenticated" | "unauthenticated";
  session: Session | null;
  isConnected: boolean;
  isEmbedded: boolean;
  viewportHeight: string;
  keyboardInset: number;
  
  // State from parent
  conversations: Conversation[];
  whatsappConversations: Conversation[];
  activeConv: Conversation | null;
  messages: Message[];
  inputMessage: string;
  isLoadingConvs: boolean;
  isLoadingWhatsApp: boolean;
  isLoadingMsgs: boolean;
  isUserTyping: boolean;
  showDeleteConfirm: boolean;
  isDeleting: boolean;
  replyingTo: Message | null;
  copiedId: string | null;
  activeMessageId: string | null;
  isE2EEReady: boolean;
  
  // Search / Users state
  sidebarTab: "chats" | "whatsapp" | "users";
  usersList: User[];
  searchQuery: string;
  usersPage: number;
  totalPages: number;
  isLoadingUsers: boolean;
  
  // Handlers
  setSidebarTab: (tab: "chats" | "whatsapp" | "users") => void;
  setSearchQuery: (query: string) => void;
  setUsersPage: (page: number | ((p: number) => number)) => void;
  setActiveConv: (conv: Conversation | null) => void;
  handleSelectUserChat: (userId: string) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDeleteConversation: () => void;
  setActiveMessageId: (id: string | null) => void;
  handleCopy: (id: string, text: string) => void;
  setReplyingTo: (msg: Message | null) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  
  // New WhatsApp conversation
  newPhoneNumber: string;
  setNewPhoneNumber: (value: string) => void;
  whatsappNewMsg: string;
  setWhatsAppNewMsg: (value: string) => void;
  handleStartNewWhatsApp: (e: React.FormEvent) => void;
  isSendingWhatsApp: boolean;
  whatsappError: string | null;
  setWhatsAppError: (error: string | null) => void;
  
  // Refs
  pageContainerRef: React.RefObject<HTMLDivElement | null>;
  sidebarScrollRef: React.RefObject<HTMLDivElement | null>;
  messagesScrollRef: React.RefObject<HTMLDivElement | null>;
  firstUnreadRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}
