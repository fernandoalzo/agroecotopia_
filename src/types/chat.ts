// Source: src/backend/prisma/schema/chat.model.prisma
export const ConversationType = {
  SUPPORT: "SUPPORT",
  ORDER: "ORDER",
} as const;

export type ConversationType = keyof typeof ConversationType;
