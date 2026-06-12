import {
  getPaginatedProductsAction,
  searchProductsAction,
  getCategoryCountsAction,
  createProductAction,
  createStoreProductAction,
  updateProductAction,
  updateStoreProductAction,
  deleteProductAction,
  deleteStoreProductAction,
  getCategoriesAction,
} from "@/backend/modules/product/product.actions";
import {
  getAllRequestsAction,
  getRequestByIdAction,
  approveRequestAction,
  rejectRequestAction,
  getPendingRequestsAction,
} from "@/backend/modules/store/store.actions";
import {
  getPaginatedOrdersAction,
  getOrderStatusCountsAction,
  updateOrderStatusAction,
  getOrderDetailAction,
  deleteOrderAction,
} from "@/backend/modules/orders/orders.actions";
import {
  getAdminConversations,
  getConversationMessages,
  markAsRead,
  deleteConversationAction,
  getAdminUsersList,
  getOrCreateConversationForAdmin,
} from "@/backend/modules/chat/chat.actions";
import {
  adminGetAllEnviosAction,
  adminGetEnvioCountsAction,
} from "@/backend/modules/envio/envio.actions";
import AdminDashboardPage from "./AdminDashboardPageClient";

export default function Page() {
  return (
    <AdminDashboardPage
      actions={{
        getPaginatedProducts: getPaginatedProductsAction,
        searchProducts: searchProductsAction,
        getCategoryCounts: getCategoryCountsAction,
        createProduct: createProductAction,
        createStoreProduct: createStoreProductAction,
        updateProduct: updateProductAction,
        updateStoreProduct: updateStoreProductAction,
        deleteProduct: deleteProductAction,
        deleteStoreProduct: deleteStoreProductAction,
        getCategories: getCategoriesAction,
        getAllRequests: getAllRequestsAction,
        getRequestById: getRequestByIdAction,
        approveRequest: approveRequestAction,
        rejectRequest: rejectRequestAction,
        getPendingRequests: getPendingRequestsAction,
        getPaginatedOrders: getPaginatedOrdersAction,
        getOrderStatusCounts: getOrderStatusCountsAction,
        updateOrderStatus: updateOrderStatusAction,
        getOrderDetail: getOrderDetailAction,
        deleteOrder: deleteOrderAction,
        getAdminConversations,
        adminGetAllEnvios: adminGetAllEnviosAction,
        adminGetEnvioCounts: adminGetEnvioCountsAction,
        chat: {
          getAdminConversations,
          getConversationMessages,
          markAsRead,
          deleteConversation: deleteConversationAction,
          getAdminUsersList,
          getOrCreateConversationForAdmin,
        },
      }}
    />
  );
}
