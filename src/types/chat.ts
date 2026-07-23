// Source: src/backend/prisma/schema/chat.model.prisma
export const ConversationType = {
  SUPPORT: "SUPPORT",
  ORDER: "ORDER",
  STORE: "STORE",
  WHATSAPP: "WHATSAPP",
} as const;

export type ConversationType = keyof typeof ConversationType;

export const MessageChannel = {
  INTERNAL: "INTERNAL",
  WHATSAPP: "WHATSAPP",
} as const;

export type MessageChannel = keyof typeof MessageChannel;
