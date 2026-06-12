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
  getProductsPageDataAction,
} from "@/backend/modules/product/product.actions";
import {
  getOrderDetailAction,
  getStoreOrdersAction,
  getStoreOrderStatusCountsAction,
  getStoreOrdersWithCountsAction,
  getSellerDashboardDataAction,
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
import {
  getStoreShippingZonesAction,
  createStoreShippingZoneAction,
  updateStoreShippingZoneAction,
  deleteStoreShippingZoneAction,
  addShippingRateAction,
  deleteShippingRateAction,
} from "@/backend/modules/shipping/shipping.actions";
import {
  getStoreBodegasAction,
  createBodegaAction,
  updateBodegaAction,
  deleteBodegaAction,
} from "@/backend/modules/bodega/bodega.actions";
import {
  getEnviosByStoreAction,
  getEnviosWithCountsAction,
  getEnvioStatsAction,
  updateEnvioEstadoAction,
  getEnvioDetailAction,
} from "@/backend/modules/envio/envio.actions";
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
        getProductsPageData: getProductsPageDataAction,
        getStoreOrders: getStoreOrdersAction,
        getStoreOrderStatusCounts: getStoreOrderStatusCountsAction,
        getStoreOrdersWithCounts: getStoreOrdersWithCountsAction,
        getSellerDashboardData: getSellerDashboardDataAction,
        updateStoreOrderStatus: updateStoreOrderStatusAction,
        getOrderDetail: getOrderDetailAction,
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
        // Shipping
        getStoreShippingZones: getStoreShippingZonesAction,
        createStoreShippingZone: createStoreShippingZoneAction,
        updateStoreShippingZone: updateStoreShippingZoneAction,
        deleteStoreShippingZone: deleteStoreShippingZoneAction,
        addShippingRate: addShippingRateAction,
        deleteShippingRate: deleteShippingRateAction,
        // Bodegas
        getStoreBodegas: getStoreBodegasAction,
        createBodega: createBodegaAction,
        updateBodega: updateBodegaAction,
        deleteBodega: deleteBodegaAction,
        // Envios
        getEnviosByStore: getEnviosByStoreAction,
        getEnviosWithCounts: getEnviosWithCountsAction,
        getEnvioStats: getEnvioStatsAction,
        updateEnvioStatus: updateEnvioEstadoAction,
        getEnvioDetail: getEnvioDetailAction,
      }}
    />
  );
}
