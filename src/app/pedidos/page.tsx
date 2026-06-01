import { getUserOrdersAction, cancelUserOrderAction, deleteUserOrderAction } from "@/backend/modules/orders/orders.actions";
import { getUserOrderConversationsAction } from "@/backend/modules/chat/chat.actions";
import PedidosPageClient from "./PedidosPageClient";

export default function PedidosPage() {
  return (
    <PedidosPageClient
      getUserOrders={getUserOrdersAction}
      cancelUserOrder={cancelUserOrderAction}
      deleteUserOrder={deleteUserOrderAction}
      getUserOrderConversations={getUserOrderConversationsAction}
    />
  );
}
