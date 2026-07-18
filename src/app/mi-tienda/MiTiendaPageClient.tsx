"use client";

import React, { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Package,
  ClipboardList,
  Menu,
  X,
  ShoppingBag,
  AlertCircle,
  ChevronDown,
  Tag,
  Settings,
  Truck,
} from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";
import { Store as StoreType, StoreCreateInput } from "@/types/store";
import { ProductsList } from "@/components/shared/productos/ProductsList";
import { SellerStoreInfo } from "@/components/seller/SellerStoreInfo";
import { AdminOrdersList } from "@/components/admin/pedidos/AdminOrdersList";
import { AdminOrder } from "@/components/admin/pedidos/adminOrderUtils";
import { OrderChatPanel, type OrderConversation } from "@/components/chat/OrderChatPanel";
import type { Message } from "@/components/chat/ChatWidget";
import { useProductsLogic } from "@/frontend/hooks/useProductsLogic";
import { toast } from "sonner";
import logger from "@/utils/logger";
import { useSocket } from "@/frontend/context/SocketContext";
import { useSocketRefresh } from "@/frontend/hooks/useSocketRefresh";
import { PromotionsList } from "@/components/seller/promotions/PromotionsList";
import { PromotionCreatePanel } from "@/components/seller/promotions/PromotionCreatePanel";
import { StoreConfigurationPanel } from "@/components/seller/configuration/StoreConfigurationPanel";
import type { Promotion } from "@/types/store";
import { EnviosList } from "@/components/admin/envios/EnviosList";
import { envioStatusConfig, type EnvioEstadoKey } from "@/components/admin/envios/envioUtils";

const log = logger.child();

type SellerTab = "orders" | "envios" | "products" | "promotions" | "store_info" | "configuration";

interface MiTiendaActions {
  getMyStores: () => Promise<any>;
  updateMyStore: (storeId: string, data: Partial<StoreCreateInput>) => Promise<any>;
  getCryptocurrencies: () => Promise<any>;
  getConversationMessages: (conversationId: string) => Promise<any>;
  getOrCreateOrderConversation: (pedidoId: string, storeId: string) => Promise<any>;
  getSellerOrderConversations: (storeId: string) => Promise<any>;
  markAsRead: (conversationId: string) => Promise<any>;
  openOrderChat: (pedidoId: string, storeId: string) => Promise<any>;
  getPaginatedProducts: (...args: any[]) => Promise<any>;
  searchProducts: (...args: any[]) => Promise<any>;
  getCategoryCounts: (...args: any[]) => Promise<any>;
  createProduct: (...args: any[]) => Promise<any>;
  createStoreProduct: (...args: any[]) => Promise<any>;
  updateProduct: (...args: any[]) => Promise<any>;
  updateStoreProduct: (...args: any[]) => Promise<any>;
  deleteProduct: (...args: any[]) => Promise<any>;
  deleteStoreProduct: (...args: any[]) => Promise<any>;
  updateStoreConfig: (storeId: string, paymentMethods: any) => Promise<any>;
  getCategories: () => Promise<any>;
  generateDescription: (name: string, categories: string[], tags: string) => Promise<any>;
  getStoreOrders: (...args: any[]) => Promise<any>;
  getStoreOrderStatusCounts: (storeId: string) => Promise<any>;
  getStoreOrdersWithCounts: (storeId: string, params: { page: number; limit: number; estado?: any; search?: string }) => Promise<any>;
  getSellerDashboardData: (storeId: string, params: { page: number; limit: number; estado?: any; search?: string }) => Promise<any>;
  getProductsPageData: (page: number, limit: number, category?: string, storeId?: string) => Promise<any>;
  updateStoreOrderStatus: (...args: any[]) => Promise<any>;
  getAllActiveStoresList: () => Promise<any>;
  getOrderDetail: (pedidoId: string) => Promise<any>;

  // Promotions
  getPromotionsByStore: (storeId: string) => Promise<any>;
  createPromotion: (storeId: string, data: any) => Promise<any>;
  updatePromotion: (storeId: string, id: string, data: any) => Promise<any>;
  togglePromotion: (storeId: string, id: string, isActive: boolean) => Promise<any>;
  deletePromotion: (storeId: string, id: string) => Promise<any>;

  // Taxes
  createStoreTax: (storeId: string, data: any) => Promise<any>;
  getStoreTaxes: (storeId: string) => Promise<any>;
  updateStoreTax: (storeId: string, id: string, data: any) => Promise<any>;
  deleteStoreTax: (storeId: string, id: string) => Promise<any>;

  // Shipping
  getStoreShippingZones: (storeId: string) => Promise<any>;
  createStoreShippingZone: (storeId: string, data: any) => Promise<any>;
  updateStoreShippingZone: (zoneId: string, data: any) => Promise<any>;
  deleteStoreShippingZone: (zoneId: string) => Promise<any>;
  addShippingRate: (zoneId: string, data: any) => Promise<any>;
  deleteShippingRate: (rateId: string) => Promise<any>;

  // Bodegas
  getStoreBodegas: (storeId: string) => Promise<any>;
  createBodega: (storeId: string, data: { name: string; address: string; city: string; imagenUrl?: string }) => Promise<any>;
  updateBodega: (bodegaId: string, data: { name?: string; address?: string; city?: string; imagenUrl?: string }) => Promise<any>;
  deleteBodega: (bodegaId: string) => Promise<any>;

  // Envios
  getEnviosByStore: (...args: any[]) => Promise<any>;
  getEnviosWithCounts: (...args: any[]) => Promise<any>;
  getEnvioStats: (...args: any[]) => Promise<any>;
  updateEnvioStatus: (...args: any[]) => Promise<any>;
  getEnvioDetail: (...args: any[]) => Promise<any>;
}

const SIDEBAR_ITEMS: { id: SellerTab; labelEs: string; labelEn: string; icon: React.ElementType }[] = [
  { id: "store_info", labelEs: "Mi Tienda", labelEn: "My Store", icon: Store },
  { id: "orders", labelEs: "Pedidos", labelEn: "Orders", icon: ClipboardList },
  { id: "envios", labelEs: "Envíos", labelEn: "Shipments", icon: Truck },
  { id: "products", labelEs: "Mis Productos", labelEn: "My Products", icon: Package },
  { id: "promotions", labelEs: "Promociones", labelEn: "Promotions", icon: Tag },
  { id: "configuration", labelEs: "Configuración", labelEn: "Configuration", icon: Settings },
];

function SellerDashboardContent({ actions }: { actions: MiTiendaActions }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get("tab") as SellerTab) || "orders";
  const [activeTab, setActiveTab] = useState<SellerTab>(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [isStoreSelectorOpen, setIsStoreSelectorOpen] = useState(false);
  const [loadingStore, setLoadingStore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderChat, setOrderChat] = useState<{ conversation: OrderConversation; messages: Message[] } | null>(null);
  const [orderChatUnreadCounts, setOrderChatUnreadCounts] = useState<Record<string, number>>({});
  const [openingChatOrderId, setOpeningChatOrderId] = useState<string | null>(null);
  const [storeOrders, setStoreOrders] = useState<AdminOrder[]>([]);
  const [storeOrdersLoading, setStoreOrdersLoading] = useState(true);
  const [storeOrderStatusCounts, setStoreOrderStatusCounts] = useState<Record<string, number>>({ ALL: 0 });
  const [storeOrderStatusFilter, setStoreOrderStatusFilter] = useState<any>("ALL");
  const [storeOrderSearchQuery, setStoreOrderSearchQuery] = useState("");
  const [storeOrderCurrentPage, setStoreOrderCurrentPage] = useState(1);
  const [storeOrderTotalPages, setStoreOrderTotalPages] = useState(1);
  const [storeOrderTotalCount, setStoreOrderTotalCount] = useState(0);
  const [storeOrdersRefresh, setStoreOrdersRefresh] = useState(0);
  const isSeller = session?.user?.role === "seller" || session?.user?.role === "admin";

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [isPromoPanelOpen, setIsPromoPanelOpen] = useState(false);

  const [envios, setEnvios] = useState<any[]>([]);
  const [enviosLoading, setEnviosLoading] = useState(false);
  const [enviosStats, setEnviosStats] = useState<Record<string, number>>({ ALL: 0 });
  const [enviosCurrentPage, setEnviosCurrentPage] = useState(1);
  const [enviosStatusFilter, setEnviosStatusFilter] = useState<string>("ALL");
  const [enviosSearchQuery, setEnviosSearchQuery] = useState("");
  const [enviosTotalPages, setEnviosTotalPages] = useState(1);
  const [enviosTotalCount, setEnviosTotalCount] = useState(0);
  const [enviosRefresh, setEnviosRefresh] = useState(0);
  const [autoOpenEnvioPedidoId, setAutoOpenEnvioPedidoId] = useState<string | null>(null);
  const [bodegasList, setBodegasList] = useState<any[]>([]);

  const activeStore = stores.find(s => s.id === activeStoreId) || null;

  // Only fetch products data when the user is on the products tab
  const { state: productState, actions: productActions } = useProductsLogic(activeStoreId || undefined, activeTab === "products" && !!activeStoreId, {
    getCategoriesAction: actions.getCategories,
    getAllActiveStoresListAction: actions.getAllActiveStoresList,
    getCategoryCountsAction: actions.getCategoryCounts,
    getPaginatedProductsAction: actions.getPaginatedProducts,
    searchProductsAction: actions.searchProducts,
    getProductsPageDataAction: actions.getProductsPageData,
    createProductAction: actions.createProduct,
    createStoreProductAction: actions.createStoreProduct,
    updateProductAction: actions.updateProduct,
    updateStoreProductAction: actions.updateStoreProduct,
    deleteProductAction: actions.deleteProduct,
    deleteStoreProductAction: actions.deleteStoreProduct,
    generateDescriptionAction: actions.generateDescription,
  });

  // Protect route
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mi-tienda");
    }
  }, [status, router]);

  const handleUpdateStore = async (storeId: string, data: Partial<StoreCreateInput>) => {
    try {
      const result = await actions.updateMyStore(storeId, data);

      if (result && "error" in result) {
        log.error("Error al actualizar la tienda:", result.error);
        if (typeof toast !== "undefined") {
          toast.error(typeof result.error === "string" ? result.error : "Error al actualizar la tienda");
        } else {
          alert("Error: " + result.error);
        }
        return false;
      } else {
        log.info("Tienda actualizada con éxito", { storeId });
        if (typeof toast !== "undefined") {
          toast.success("Información de la tienda actualizada");
        } else {
          alert("Información de la tienda actualizada");
        }
        await loadStore(); // Refresh data directly here
        return true;
      }
    } catch (error) {
      log.error("Error inesperado al actualizar la tienda:", error);
      if (typeof toast !== "undefined") {
        toast.error("Ocurrió un error inesperado al guardar los cambios.");
      }
      return false;
    }
  };

  const loadPromotions = useCallback(async (silent = false) => {
    if (!activeStoreId || activeTab !== "promotions") return;
    if (!silent) setLoadingPromotions(true);
    try {
      const res = await actions.getPromotionsByStore(activeStoreId);
      if (res && res.success) {
        setPromotions(res.promotions);
      }
    } catch (err) {
      log.error("Error cargando promociones:", err);
    } finally {
      if (!silent) setLoadingPromotions(false);
    }
  }, [activeStoreId, activeTab, actions]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const enviosLoadedRef = useRef(false);

  useEffect(() => {
    if (!activeStore?.id || activeTab !== "envios") return;
    let cancelled = false;
    const load = async () => {
      if (!enviosLoadedRef.current) setEnviosLoading(true);
      try {
        const fetchPromise = actions.getEnviosWithCounts(activeStore.id, {
          page: enviosCurrentPage,
          limit: 10,
          estado: enviosStatusFilter === "ALL" ? undefined : enviosStatusFilter,
          search: enviosSearchQuery || undefined,
        });

        // Timeout para evitar que se quede colgado indefinidamente
        let timeoutId: NodeJS.Timeout;
        const timeoutPromise = new Promise<any>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Timeout obteniendo envíos")), 10000);
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);
        clearTimeout(timeoutId!);

        if (cancelled) return;
        if (response?.enviosResult) {
          setEnvios(response.enviosResult.envios || []);
          setEnviosTotalPages(response.enviosResult.totalPages || 1);
          setEnviosTotalCount(response.enviosResult.totalCount || 0);
        }
        if (response?.stats) {
          const s = response.stats as Record<string, number>;
          const total = Object.values(s).reduce((a, b) => a + (Number(b) || 0), 0);
          setEnviosStats({ ALL: total, ...s });
        }
      } catch (err) {
        log.error("Error loading envios:", err);
      } finally {
        if (!cancelled) {
          enviosLoadedRef.current = true;
          setEnviosLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
      setEnviosLoading(false); // Safety fallback if component unmounts or effect cleans up
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStore?.id, activeTab, enviosCurrentPage, enviosStatusFilter, enviosSearchQuery, enviosRefresh]);

  useEffect(() => {
    enviosLoadedRef.current = false;
  }, [activeStore?.id]);

  // Bodegas: cargar UNA sola vez por tienda cuando se activa la pestaña envíos (Dumb Components rule)
  const bodegasLoadedForStoreRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeStore?.id || activeTab !== "envios") return;
    if (bodegasLoadedForStoreRef.current === activeStore.id) return;
    bodegasLoadedForStoreRef.current = activeStore.id;
    actions.getStoreBodegas(activeStore.id).then((res: any) => {
      if (res?.success) {
        setBodegasList(res.bodegas || []);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStore?.id, activeTab]);

  const loadStore = async () => {
    if (!session?.user?.id) return;
    try {
      setLoadingStore(true);
      const res = await actions.getMyStores();
      if (res && "error" in res) {
        setError(typeof res.error === "string" ? res.error : "Error al cargar la tienda.");
        return;
      }
      if (Array.isArray(res) && res.length > 0) {
        setStores(res as StoreType[]);
        // Optionally set active store from URL param, or default to first
        const urlStoreId = searchParams.get("store");
        if (urlStoreId && res.some(s => s.id === urlStoreId)) {
          setActiveStoreId(urlStoreId);
        } else {
          setActiveStoreId(res[0].id);
        }
      } else {
        setError("No tienes tiendas activas. Solicita una desde tu menú de usuario.");
      }
    } catch (err) {
      log.error("Error loading seller store:", err);
      setError("Error inesperado al cargar tu tienda.");
    } finally {
      setLoadingStore(false);
    }
  };

  // Load store — ref guard prevents duplicate calls from session flicker
  const loadedForUserRef = useRef<string | null>(null);
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || loadedForUserRef.current === userId) return;
    loadedForUserRef.current = userId;
    loadStore();
  }, [session?.user?.id]);

  const { socket } = useSocket();

  const loadUnreadCounts = useCallback(async () => {
    if (!activeStore?.id || !isSeller) {
      setOrderChatUnreadCounts({});
      return;
    }
    try {
      const res = await actions.getSellerOrderConversations(activeStore.id);
      if (Array.isArray(res)) {
        const counts = res.reduce((acc: Record<string, number>, conv: any) => {
          if (conv?.pedido?.id) {
            acc[conv.pedido.id] = Number(conv.unreadCount) || 0;
          }
          return acc;
        }, {});
        setOrderChatUnreadCounts(counts);
      }
    } catch (err) {
      log.error("Error loading seller order unread counts:", err);
    }
  }, [activeStore?.id, isSeller]);

  useSocketRefresh({
    socket,
    enabled: !!activeStore?.id && !!isSeller,
    refresh: loadUnreadCounts,
  });

  const refreshStoreOrders = useCallback(async () => {
    if (!activeStore?.id) return;
    const response = await actions.getSellerDashboardData(activeStore.id, {
      page: storeOrderCurrentPage,
      limit: 10,
      estado: storeOrderStatusFilter === "ALL" ? undefined : storeOrderStatusFilter,
      search: storeOrderSearchQuery || undefined,
    });
    const { ordersResult, statusCounts, conversations } = response || {};

    if (ordersResult && "orders" in ordersResult) {
      setStoreOrders(ordersResult.orders as AdminOrder[]);
      setStoreOrderTotalPages(ordersResult.totalPages);
      setStoreOrderTotalCount(ordersResult.totalCount);
    }

    if (statusCounts && typeof statusCounts === "object") {
      const typed = statusCounts as Record<string, number>;
      const total = Object.values(typed).reduce((a, b) => a + (Number(b) || 0), 0);
      setStoreOrderStatusCounts({ ALL: total, ...typed });
    }

    if (Array.isArray(conversations)) {
      const counts = conversations.reduce((acc: Record<string, number>, conv: any) => {
        if (conv?.pedido?.id) {
          acc[conv.pedido.id] = Number(conv.unreadCount) || 0;
        }
        return acc;
      }, {});
      setOrderChatUnreadCounts(counts);
    }
  }, [actions, activeStore?.id, storeOrderCurrentPage, storeOrderStatusFilter, storeOrderSearchQuery]);

  useSocketRefresh({
    socket,
    enabled: !!activeStore?.id && !!isSeller && activeTab === "orders",
    refresh: refreshStoreOrders,
    events: ["order:created", "order:status_updated_store", "order:deleted_store"],
  });

  useSocketRefresh({
    socket,
    enabled: !!activeStore?.id && !!isSeller && activeTab === "products",
    refresh: () => productActions.reload(),
    events: ["product:stock_updated"],
  });

  useSocketRefresh({
    socket,
    enabled: !!activeStore?.id && !!isSeller && activeTab === "envios",
    refresh: () => setEnviosRefresh(prev => prev + 1),
    events: ["envio:created", "envio:status_updated"],
  });

  const ordersLoadedRef = useRef(false);

  useEffect(() => {
    if (!activeStore?.id || !isSeller || activeTab !== "orders") return;
    let cancelled = false;
    const load = async () => {
      if (!ordersLoadedRef.current) setStoreOrdersLoading(true);
      const response = await actions.getSellerDashboardData(activeStore.id, {
        page: storeOrderCurrentPage,
        limit: 10,
        estado: storeOrderStatusFilter === "ALL" ? undefined : storeOrderStatusFilter,
        search: storeOrderSearchQuery || undefined,
      });
      if (cancelled) return;
      const { ordersResult, statusCounts, conversations } = response || {};

      // Orders
      if (ordersResult && "orders" in ordersResult) {
        setStoreOrders(ordersResult.orders as AdminOrder[]);
        setStoreOrderTotalPages(ordersResult.totalPages);
        setStoreOrderTotalCount(ordersResult.totalCount);
      }

      // Status counts
      if (statusCounts && typeof statusCounts === "object") {
        const typed = statusCounts as Record<string, number>;
        const total = Object.values(typed).reduce((a, b) => a + (Number(b) || 0), 0);
        setStoreOrderStatusCounts({ ALL: total, ...typed });
      }

      // Conversation unread counts (para badges en la tabla de pedidos)
      if (Array.isArray(conversations)) {
        const counts = conversations.reduce((acc: Record<string, number>, conv: any) => {
          if (conv?.pedido?.id) {
            acc[conv.pedido.id] = Number(conv.unreadCount) || 0;
          }
          return acc;
        }, {});
        setOrderChatUnreadCounts(counts);
      }

      ordersLoadedRef.current = true;
      setStoreOrdersLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [activeStore?.id, isSeller, activeTab, storeOrderCurrentPage, storeOrderStatusFilter, storeOrderSearchQuery, storeOrdersRefresh]);

  useEffect(() => {
    ordersLoadedRef.current = false;
  }, [activeStore?.id]);

  // Update tab in URL
  const handleTabChange = (tab: SellerTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    if (activeStoreId) params.set("store", activeStoreId);
    window.history.replaceState(null, "", `/mi-tienda?${params.toString()}`);
  };

  const handleNavigateToEnvio = (pedidoId: string) => {
    setAutoOpenEnvioPedidoId(pedidoId);
    setEnviosStatusFilter("ALL");
    setEnviosSearchQuery("");
    setEnviosCurrentPage(1);
    enviosLoadedRef.current = false;
    setEnviosRefresh(prev => prev + 1);
    handleTabChange("envios");
  };

  const handleStoreChange = (storeId: string) => {
    setActiveStoreId(storeId);
    setIsStoreSelectorOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("store", storeId);
    window.history.replaceState(null, "", `/mi-tienda?${params.toString()}`);
  };

  const handleOpenOrderChat = async (order: AdminOrder) => {
    const storeId = activeStoreId || order.detalles.find((detalle) => detalle.storeId)?.storeId;
    if (!storeId) {
      toast.error("No se pudo identificar la tienda del pedido.");
      return;
    }

    setOpeningChatOrderId(order.id);
    try {
      const res = await actions.openOrderChat(order.id, storeId);
      if (!res || "error" in res) {
        toast.error("No se pudo abrir el chat", {
          description: res && "error" in res ? String(res.error) : undefined,
        });
        return;
      }

      setOrderChat({ conversation: res.conversation as OrderConversation, messages: (res.messages || []) as Message[] });
    } catch (err) {
      log.error("Error abriendo chat de pedido:", err);
      toast.error("Ocurrió un error abriendo el chat del pedido.");
    } finally {
      setOpeningChatOrderId(null);
    }
  };

  const handleMarkOrderChatAsRead = async (conversationId: string) => {
    await actions.markAsRead(conversationId);
  };

  if ((status === "loading" && !session) || loadingStore) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <Loading />
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <div className="text-center p-10 max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground font-display mb-2">Acceso Restringido</h2>
          <p className="text-muted-foreground mb-6">Necesitas ser un vendedor aprobado para acceder a esta página.</p>
          <button onClick={() => router.push("/solicitar-tienda?from=dashboard")} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all">
            Solicitar Tienda
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <div className="text-center p-10 max-w-md">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground font-display mb-2">Sin Tienda Activa</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button onClick={() => router.push("/solicitar-tienda?from=dashboard")} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all">
            Solicitar Tienda
          </button>
        </div>
      </div>
    );
  }

  const getTabTitle = () => {
    const item = SIDEBAR_ITEMS.find((i) => i.id === activeTab);
    return item?.labelEs ?? "Mi Tienda";
  };

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-background pt-14 md:pt-20">
      {/* ═══ SIDEBAR — Desktop: fixed left, Mobile: overlay ═══ */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed top-14 md:top-20 left-0 bottom-0 z-50 w-72 flex flex-col border-r border-border/40 bg-card/80 backdrop-blur-xl transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Sidebar Header with close button */}
        <div className="lg:hidden p-5 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Store className="w-5 h-5" />
            <span>Mi Tienda</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Picker — fused into sidebar */}
        <button
          onClick={() => setIsStoreSelectorOpen(!isStoreSelectorOpen)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 text-left">
              <p className="font-bold text-foreground text-sm truncate leading-tight">{activeStore?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{stores.length} tienda{stores.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0", isStoreSelectorOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {isStoreSelectorOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-0.5">
                {stores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      handleStoreChange(s.id);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-xl transition-all duration-150",
                      activeStoreId === s.id
                        ? "bg-secondary text-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        activeStoreId === s.id ? "bg-primary" : "bg-muted-foreground/30"
                      )} />
                      <span className="truncate">{s.name}</span>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => router.push("/solicitar-tienda?from=dashboard")}
                  className="w-full text-left px-3 py-2 text-sm text-primary font-semibold rounded-xl hover:bg-secondary/50 transition-all duration-150"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs">＋</span>
                    <span>Agregar tienda</span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-4 h-px bg-border/40" />

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <React.Fragment key={item.id}>
                {item.id === "products" && <div className="h-px bg-border/50 my-2 mx-2" />}
                {item.id === "configuration" && <div className="h-px bg-border/50 my-2 mx-2" />}
                <button
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-200", isActive && "scale-110")} />
                  <span className="flex-1 text-left">{item.labelEs}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar with mobile sidebar toggle */}
        <div className="flex items-center gap-3 px-4 md:px-8 py-4 border-b border-border/30 bg-background/50 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground border border-border/40"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <motion.h1
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-black tracking-tight"
            >
              {getTabTitle()}
            </motion.h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              {activeTab === "orders" && "Gestiona los pedidos que contienen productos de esta tienda"}
              {activeTab === "envios" && "Seguimiento de envíos de pedidos a clientes"}
              {activeTab === "products" && "Gestiona los productos de tu tienda"}
              {activeTab === "store_info" && "Información y configuración de tu tienda"}
              {activeTab === "configuration" && "Configura impuestos, zonas de envío y bodegas de recogida"}
            </p>
          </div>
        </div>

        {/* Content area */}
        <div className={cn(
          "flex-1 min-h-0",
          (activeTab === "orders" || activeTab === "envios" || activeTab === "products" || activeTab === "promotions" || activeTab === "configuration")
            ? "overflow-hidden flex flex-col"
            : "overflow-auto"
        )}>
          {(activeTab === "orders" || activeTab === "envios" || activeTab === "products" || activeTab === "promotions" || activeTab === "configuration") ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-h-0 flex flex-col p-4 md:p-8"
              >
                {activeTab === "orders" && activeStore && (
                  <AdminOrdersList
                    orders={storeOrders}
                    loading={storeOrdersLoading}
                    totalPages={storeOrderTotalPages}
                    totalCount={storeOrderTotalCount}
                    statusCounts={storeOrderStatusCounts}
                    currentPage={storeOrderCurrentPage}
                    statusFilter={storeOrderStatusFilter}
                    searchQuery={storeOrderSearchQuery}
                    onPageChange={setStoreOrderCurrentPage}
                    onSearchChange={setStoreOrderSearchQuery}
                    onStatusFilterChange={setStoreOrderStatusFilter}
                    onUpdateStatus={async (orderId, newStatus) => {
                      const result = await actions.updateStoreOrderStatus(activeStore.id, orderId, newStatus);
                      if (result && "error" in result) {
                        if (result.outOfStockProducts && result.outOfStockProducts.length > 0) {
                          const names = result.outOfStockProducts.map((p: any) => p.productName).join(", ");
                          toast.error("Stock insuficiente", {
                            description: `Sin stock para: ${names}. Ve al detalle del pedido para retirarlos.`,
                            action: { label: "Ver detalle", onClick: () => router.push(`/pedidos/${orderId}`) }
                          });
                        } else {
                          toast.error("Error", { description: result.error });
                        }
                        return false;
                      }
                      toast.success("Estado actualizado");
                      setStoreOrdersRefresh(prev => prev + 1);
                      return true;
                    }}
                    emptyMessage="No hay pedidos para los productos de esta tienda con los filtros aplicados."
                    onOpenOrderChat={handleOpenOrderChat}
                    unreadChatCounts={orderChatUnreadCounts}
                    openingChatOrderId={openingChatOrderId}
                    storeId={activeStore.id}
                    getOrderDetail={actions.getOrderDetail}
                    updateStoreOrderStatus={async (_storeId, pedidoId, newStatus) => {
                      const result = await actions.updateStoreOrderStatus(activeStore.id, pedidoId, newStatus);
                      if (result && "error" in result) return result;
                      setStoreOrdersRefresh(prev => prev + 1);
                      return result;
                    }}
                    onNavigateToEnvio={handleNavigateToEnvio}
                  />
                )}
                {activeTab === "envios" && activeStore && (
                  <EnviosList
                    storeId={activeStore.id}
                    envios={envios}
                    loading={enviosLoading}
                    totalPages={enviosTotalPages}
                    totalCount={enviosTotalCount}
                    stats={enviosStats}
                    currentPage={enviosCurrentPage}
                    statusFilter={enviosStatusFilter}
                    searchQuery={enviosSearchQuery}
                    onPageChange={setEnviosCurrentPage}
                    onSearchChange={setEnviosSearchQuery}
                    onStatusFilterChange={setEnviosStatusFilter}
                    onUpdateStatus={async (envioId, nuevoEstado, extra) => {
                      const result = await actions.updateEnvioStatus(activeStore.id, envioId, nuevoEstado, extra);
                      if (result && "error" in result) {
                        return false;
                      }
                      setEnviosRefresh(prev => prev + 1);
                      return true;
                    }}
                    onRefresh={() => setEnviosRefresh(prev => prev + 1)}
                    getOrderDetail={actions.getOrderDetail}
                    getEnvioDetail={actions.getEnvioDetail}
                    bodegas={bodegasList}
                    updateStoreOrderStatus={async (_storeId, pedidoId, newStatus) => {
                      const result = await actions.updateStoreOrderStatus(activeStore.id, pedidoId, newStatus);
                      if (result && "error" in result) {
                        return result;
                      }
                      return result;
                    }}
                    autoOpenPedidoId={autoOpenEnvioPedidoId}
                    onAutoOpenConsumed={() => setAutoOpenEnvioPedidoId(null)}
                  />
                )}
                {activeTab === "products" && activeStore && (
                  <ProductsList
                    storeId={activeStore.id}
                    products={productState.products}
                    loading={productState.loading}
                    categoryCounts={productState.categoryCounts}
                    categoryFilter={productState.categoryFilter}
                    searchQuery={productState.searchQuery}
                    currentPage={productState.currentPage}
                    totalPages={productState.totalPages}
                    totalCount={productState.totalCount}
                    limit={productState.limit}
                    availableCategories={productState.availableCategories}
                    storesList={productState.storesList}
                    setCategoryFilter={productActions.setCategoryFilter}
                    setSearchQuery={productActions.setSearchQuery}
                    setCurrentPage={productActions.setCurrentPage}
                    setLimit={productActions.setLimit}
                    onSubmitCreate={productActions.handleCreateProduct}
                    onSubmitUpdate={productActions.handleUpdateProduct}
                    onDeleteProduct={productActions.handleDeleteProduct}
                    onGenerateDescription={productActions.handleGenerateDescription}
                  />
                )}
                {activeTab === "promotions" && activeStore && (
                  <PromotionsList
                    storeId={activeStore.id}
                    promotions={promotions}
                    loading={loadingPromotions}
                    onCreateNew={() => setIsPromoPanelOpen(true)}
                    onToggleStatus={async (id, isActive) => {
                      setPromotions(prev => prev.map(p => p.id === id ? { ...p, isActive } : p));
                      const res = await actions.togglePromotion(activeStore.id, id, isActive);
                      if (res && res.success) {
                        toast.success(`Promoción ${isActive ? 'activada' : 'desactivada'}`);
                        loadPromotions(true);
                        return true;
                      }
                      setPromotions(prev => prev.map(p => p.id === id ? { ...p, isActive: !isActive } : p));
                      toast.error("Error al actualizar estado");
                      return false;
                    }}
                    onDelete={async (id) => {
                      const res = await actions.deletePromotion(activeStore.id, id);
                      if (res && res.success) {
                        toast.success("Promoción eliminada");
                        loadPromotions(true);
                        return true;
                      }
                      return false;
                    }}
                  />
                )}
                {activeTab === "configuration" && activeStore && (
                  <StoreConfigurationPanel store={activeStore} actions={actions} />
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "store_info" && activeStore && (
                    <SellerStoreInfo
                      store={activeStore}
                      onStoreUpdated={loadStore}
                      onUpdateStore={handleUpdateStore}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {activeStore && (
        <PromotionCreatePanel
          open={isPromoPanelOpen}
          storeId={activeStore.id}
          getProducts={(id) => actions.getPaginatedProducts(1, 1000, undefined, id)}
          searchProducts={(query) => actions.searchProducts(query, 1, 50, undefined, activeStore.id)}
          onClose={() => setIsPromoPanelOpen(false)}
          onSubmit={async (data) => {
            const res = await actions.createPromotion(activeStore.id, data);
            if (res && res.success) {
              loadPromotions(true);
              return true;
            }
            return false;
          }}
        />
      )}

      {orderChat && (
        <OrderChatPanel
          conversation={orderChat.conversation}
          initialMessages={orderChat.messages}
          title={`Pedido #${orderChat.conversation.pedidoId?.slice(-6).toUpperCase() || "pedido"}`}
          disabled={["ENTREGADO", "CANCELADO"].includes(orderChat.conversation.pedido?.estado || "")}
          onClose={() => setOrderChat(null)}
          onMarkAsRead={handleMarkOrderChatAsRead}
        />
      )}
    </div>
  );
}

export default function MiTiendaPage({ actions }: { actions: MiTiendaActions }) {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 flex items-center justify-center bg-background"><Loading /></div>}>
      <SellerDashboardContent actions={actions} />
    </Suspense>
  );
}
