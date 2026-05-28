"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { AdminOrdersList } from "@/components/admin/pedidos/AdminOrdersList";
import { ProductsList } from "@/components/shared/productos/ProductsList";
import { AdminStoreRequests } from "@/components/admin/store/AdminStoreRequests";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useSocket } from "@/frontend/context/SocketContext";
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
  approveRequestAction,
  rejectRequestAction,
  getPendingRequestsAction
} from "@/backend/modules/store/store.actions";
import {
  getPaginatedOrdersAction,
  getOrderStatusCountsAction,
  updateOrderStatusAction,
} from "@/backend/modules/orders/orders.actions";
import { getAdminConversations } from "@/backend/modules/chat/chat.actions";
import { AdminChatPageContent } from "@/app/admin/chat/page";
import { useProductsLogic } from "@/frontend/hooks/useProductsLogic";
import { useSocketRefresh } from "@/frontend/hooks/useSocketRefresh";
import logger from "@/utils/logger";
import { Store } from "lucide-react";
import { getConversationUnreadCount } from "@/frontend/lib/chatUnread";

const log = logger.child();

type DashboardTab = "orders" | "products" | "chat" | "store_requests";
type StoreRequestsResponse = Exclude<Awaited<ReturnType<typeof getAllRequestsAction>>, { error: string }>;

const SIDEBAR_ITEMS: { id: DashboardTab; labelEs: string; labelEn: string; icon: any }[] = [
  { id: "orders", labelEs: "Gestión de Pedidos", labelEn: "Order Management", icon: Package },
  { id: "products", labelEs: "Gestión de Productos", labelEn: "Product Management", icon: Package },
  { id: "store_requests", labelEs: "Solicitudes de Tienda", labelEn: "Store Requests", icon: Store },
  { id: "chat", labelEs: "Soporte Chat", labelEn: "Chat Support", icon: MessageSquare },
];

function AdminDashboardPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { socket } = useSocket();

  const initialTab = (searchParams.get("tab") as DashboardTab) || "orders";
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingStoresCount, setPendingStoresCount] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderStatusCounts, setOrderStatusCounts] = useState<Record<string, number>>({ ALL: 0 });
  const [orderStatusFilter, setOrderStatusFilter] = useState<"ALL" | any>("ALL");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderTotalCount, setOrderTotalCount] = useState(0);

  const { state: productState, actions: productActions } = useProductsLogic(undefined, true, {
    getCategoriesAction,
    getCategoryCountsAction,
    getPaginatedProductsAction,
    searchProductsAction,
    createProductAction,
    createStoreProductAction,
    updateProductAction,
    updateStoreProductAction,
    deleteProductAction,
    deleteStoreProductAction,
  });
  const loadStoreRequests = async (page: number, search?: string): Promise<StoreRequestsResponse> => {
    const result = await getAllRequestsAction(page, search);

    if (result && "error" in result) {
      throw new Error(result.error);
    }

    return result;
  };

  const approveStoreRequest = async (requestId: string) => {
    const result = await approveRequestAction(requestId);
    if (result && "error" in result) {
      return { error: result.error };
    }
    return { success: true as const, data: result.data };
  };

  const rejectStoreRequest = async (requestId: string, note: string) => {
    const result = await rejectRequestAction(requestId, note);
    if (result && "error" in result) {
      return { error: result.error };
    }
    return { success: true as const, data: result.data };
  };

  const isAdmin = session?.user?.role === "admin";

  // Protect route
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/dashboard");
    }
    if (status === "authenticated" && !isAdmin) {
      router.push("/pedidos");
    }
  }, [status, isAdmin, router]);

  // Track unread chat count
  const refreshUnread = async () => {
    if (!isAdmin || activeTab === "chat") {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await getAdminConversations();
      if (res && !("error" in res)) {
        const total = res.reduce((acc: number, conv: any) => acc + getConversationUnreadCount(conv), 0);
        setUnreadCount(total);
      }
    } catch (err) {
      log.error("Error loading dashboard unread count:", err);
    }
  };

  useSocketRefresh({
    socket,
    enabled: isAdmin && activeTab !== "chat",
    refresh: refreshUnread,
    intervalMs: 15000,
  });

  // Track pending store requests
  useEffect(() => {
    if (!isAdmin) {
      setPendingStoresCount(0);
      return;
    }

    let isCancelled = false;

    const loadPendingRequests = async () => {
      try {
        const res = await getPendingRequestsAction();
        if (!isCancelled && res && !("error" in res) && typeof res.total === 'number') {
          setPendingStoresCount(res.total);
        }
      } catch (err) {
        log.error("Error loading pending stores count:", err);
      }
    };

    loadPendingRequests();
    const interval = setInterval(loadPendingRequests, 30000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (!isAdmin || activeTab !== "orders") return;
    let cancelled = false;
    const loadOrders = async () => {
      setOrdersLoading(true);
      const result = await getPaginatedOrdersAction({
        page: orderCurrentPage,
        limit: 10,
        estado: orderStatusFilter === "ALL" ? undefined : orderStatusFilter,
        search: orderSearchQuery || undefined,
      });
      const counts = await getOrderStatusCountsAction();
      if (cancelled) return;
      if (result && "orders" in result) {
        setOrders(result.orders as any[]);
        setOrderTotalPages(result.totalPages);
        setOrderTotalCount(result.totalCount);
      }
      if (counts && typeof counts === "object") {
        const typed = counts as Record<string, number>;
        const total = Object.values(typed).reduce((acc, val) => acc + (Number(val) || 0), 0);
        setOrderStatusCounts({ ALL: total, ...typed });
      }
      setOrdersLoading(false);
    };
    loadOrders();
    return () => { cancelled = true; };
  }, [isAdmin, activeTab, orderCurrentPage, orderStatusFilter, orderSearchQuery]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Removed mobile redirect to standalone chat so the dashboard header and hamburger menu stay visible.

  // Sync tab with URL
  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  if (status === "loading") return <Loading fullScreen />;

  if (status === "unauthenticated" || !isAdmin) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6 text-center pt-14 md:pt-20">
        <div className="p-4 bg-destructive/15 rounded-full text-destructive mb-6">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground max-w-sm mb-8 text-sm">
          No tienes permisos de administrador para acceder a este panel.
        </p>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-background pt-14 md:pt-20">
      {/* ═══ SIDEBAR — Desktop: fixed left, Mobile: overlay ═══ */}

      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-14 md:top-20 left-0 bottom-0 z-50 w-72 flex flex-col border-r border-border/40 bg-card/80 backdrop-blur-xl transition-transform duration-300 ease-out md:translate-x-0 md:static md:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header */}
        <div className="p-5 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-sm leading-none">Dashboard</h2>
                <span className="text-[11px] text-muted-foreground/70 mt-0.5 block">
                  Panel de Administración
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            const isChat = item.id === "chat";

            return (
              <React.Fragment key={item.id}>
                {isChat && (
                  <div className="my-3 border-t border-border/40 mx-2" />
                )}
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
                  {item.id === "chat" && unreadCount > 0 && (
                    <span
                      className={cn(
                        "min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px] font-bold px-1.5 shadow-sm",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-red-500 text-white animate-pulse shadow-red-500/20"
                      )}
                    >
                      {unreadCount}
                    </span>
                  )}
                  {item.id === "store_requests" && pendingStoresCount > 0 && (
                    <span
                      className={cn(
                        "min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px] font-bold px-1.5 shadow-sm",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-amber-500 text-white animate-pulse shadow-amber-500/20"
                      )}
                    >
                      {pendingStoresCount}
                    </span>
                  )}
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 shrink-0 transition-all duration-200",
                      isActive ? "opacity-80" : "opacity-0 group-hover:opacity-50"
                    )}
                  />
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-border/30">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/30">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              {session?.user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{session?.user?.name || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar with mobile sidebar toggle */}
        <div className="flex items-center gap-3 px-4 md:px-8 py-4 border-b border-border/30 bg-background/50 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2.5 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground border border-border/40"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div
          className={cn(
            "flex-1 min-h-0",
            activeTab === "chat" ? "overflow-hidden flex flex-col" : "overflow-auto",
          )}
        >
          <AnimatePresence mode="wait">
            {activeTab === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="p-4 md:p-8"
              >
                <AdminOrdersList
                  orders={orders}
                  loading={ordersLoading}
                  totalPages={orderTotalPages}
                  totalCount={orderTotalCount}
                  statusCounts={orderStatusCounts}
                  currentPage={orderCurrentPage}
                  statusFilter={orderStatusFilter}
                  searchQuery={orderSearchQuery}
                  onPageChange={setOrderCurrentPage}
                  onSearchChange={setOrderSearchQuery}
                  onStatusFilterChange={setOrderStatusFilter}
                  onUpdateStatus={async (orderId, newStatus) => {
                    const result = await updateOrderStatusAction(orderId, newStatus);
                    if (result && "error" in result) return false;
                    return true;
                  }}
                />
              </motion.div>
            )}

            {activeTab === "products" && (
              <motion.div
                key="products"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="p-4 md:p-8"
              >
                <ProductsList
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
                />
              </motion.div>
            )}

            {activeTab === "store_requests" && (
              <motion.div
                key="store_requests"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="p-4 md:p-8"
              >
                <AdminStoreRequests
                  onLoadRequests={loadStoreRequests}
                  onApproveRequest={approveStoreRequest}
                  onRejectRequest={rejectStoreRequest}
                />
              </motion.div>
            )}

            {activeTab === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-h-0 h-full w-full"
              >
                <AdminChatPageContent embedded />
              </motion.div>
            )}


          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <AdminDashboardPageContent />
    </Suspense>
  );
}
