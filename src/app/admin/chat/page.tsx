import {
  getAdminConversations,
  getConversationMessages,
  markAsRead,
  deleteConversationAction,
  getAdminUsersList,
  getOrCreateConversationForAdmin,
} from "@/backend/modules/chat/chat.actions";
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
      }}
    />
  );
}
