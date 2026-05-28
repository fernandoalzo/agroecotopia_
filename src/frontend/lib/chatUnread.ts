type MessageLike = {
  isRead?: boolean | null;
  senderRole?: string | null;
};

type ConversationLike = {
  unreadCount?: number | string | null;
  messages?: MessageLike[] | null;
};

type UserMessageLike = {
  isRead?: boolean | null;
  senderId?: string | null;
};

export function getConversationUnreadCount(conv?: ConversationLike | null) {
  if (!conv) return 0;

  const unreadCount = Number(conv.unreadCount) || 0;
  if (unreadCount > 0) return unreadCount;

  const lastMsg = conv.messages?.[0];
  if (lastMsg && !lastMsg.isRead && lastMsg.senderRole !== "admin") return 1;

  return 0;
}

export function getFirstUnreadMessageIndex(messages: MessageLike[]) {
  return messages.findIndex((message) => !message.isRead && message.senderRole !== "admin");
}

export function getUnreadMessageCountForUser(messages: UserMessageLike[], userId?: string | null) {
  if (!userId) return 0;
  return messages.reduce((count, message) => {
    return count + (message.isRead || message.senderId === userId ? 0 : 1);
  }, 0);
}

export function isUnreadMessageForUser(message?: UserMessageLike | null, userId?: string | null) {
  if (!message || !userId) return false;
  return !message.isRead && message.senderId !== userId;
}
