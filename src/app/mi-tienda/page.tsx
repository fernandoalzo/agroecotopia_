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
import {
  createPromotionAction,
  getPromotionsByStoreAction,
  updatePromotionAction,
  togglePromotionAction,
  deletePromotionAction,
} from "@/backend/modules/promotion/promotion.actions";
import {
  createStoreTaxAction,
  getStoreTaxesAction,
  updateStoreTaxAction,
  deleteStoreTaxAction
} from "@/backend/modules/store/storeTax.actions";
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
        // Promotions
        createPromotion: createPromotionAction,
        getPromotionsByStore: getPromotionsByStoreAction,
        updatePromotion: updatePromotionAction,
        togglePromotion: togglePromotionAction,
        deletePromotion: deletePromotionAction,
        // Taxes
        createStoreTax: createStoreTaxAction,
        getStoreTaxes: getStoreTaxesAction,
        updateStoreTax: updateStoreTaxAction,
        deleteStoreTax: deleteStoreTaxAction,
      }}
    />
  );
}
