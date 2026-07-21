import {
  getAdminConversations,
  getConversationMessages,
  markAsRead,
  deleteConversationAction,
  getAdminUsersList,
  getOrCreateConversationForAdmin,
} from "@/backend/modules/chat/chat.actions";
import {
  getWhatsAppConversationsAction,
  sendWhatsAppMessageAction,
  markWhatsAppAsReadAction,
} from "@/backend/modules/whatsapp/whatsapp.actions";
import AdminChatPage from "./AdminChatPageClient";

export default function Page() {
  return (
    <AdminChatPage
      actions={{
        getAdminConversations,
        getConversationMessages,
        markAsRead,
        deleteConversation: deleteConversationAction,
        getAdminUsersList,
        getOrCreateConversationForAdmin,
        getWhatsAppConversations: getWhatsAppConversationsAction,
        sendWhatsAppMessage: sendWhatsAppMessageAction,
        markWhatsAppAsRead: markWhatsAppAsReadAction,
      }}
    />
  );
}
