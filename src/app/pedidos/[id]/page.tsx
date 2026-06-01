import { getOrderDetailAction, cancelUserOrderAction, deleteUserOrderAction } from "@/backend/modules/orders/orders.actions";
import { processMercadoPagoPaymentAction } from "@/backend/modules/payments/payments.actions";
import {
  getConversationMessages,
  getOrCreateOrderConversationAction,
  getSellerOrderConversationsAction,
  getUserOrderConversationsAction,
  markAsRead,
} from "@/backend/modules/chat/chat.actions";
import OrderDetailPageClient from "./OrderDetailPageClient";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <OrderDetailPageClient
      id={id}
      getOrderDetail={getOrderDetailAction}
      cancelUserOrder={cancelUserOrderAction}
      deleteUserOrder={deleteUserOrderAction}
      processMercadoPagoPayment={processMercadoPagoPaymentAction}
      getConversationMessages={getConversationMessages}
      getOrCreateOrderConversation={getOrCreateOrderConversationAction}
      getSellerOrderConversations={getSellerOrderConversationsAction}
      getUserOrderConversations={getUserOrderConversationsAction}
      markConversationAsRead={markAsRead}
    />
  );
}
