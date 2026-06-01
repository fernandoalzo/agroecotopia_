import { getMyStoresAction, updateMyStoreAction, getAllActiveStoresListAction } from "@/backend/modules/store/store.actions";
import {
  getConversationMessages,
  getOrCreateOrderConversationAction,
  getSellerOrderConversationsAction,
  markAsRead,
} from "@/backend/modules/chat/chat.actions";
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
  getStoreOrdersAction,
  getStoreOrderStatusCountsAction,
  updateStoreOrderStatusAction,
} from "@/backend/modules/orders/orders.actions";
import MiTiendaPage from "./MiTiendaPageClient";

export default function Page() {
  return (
    <MiTiendaPage
      actions={{
        getMyStores: getMyStoresAction,
        updateMyStore: updateMyStoreAction,
        getConversationMessages,
        getOrCreateOrderConversation: getOrCreateOrderConversationAction,
        getSellerOrderConversations: getSellerOrderConversationsAction,
        markAsRead,
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
        getStoreOrders: getStoreOrdersAction,
        getStoreOrderStatusCounts: getStoreOrderStatusCountsAction,
        updateStoreOrderStatus: updateStoreOrderStatusAction,
        getAllActiveStoresList: getAllActiveStoresListAction,
      }}
    />
  );
}
