"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Package,
  BarChart3,
  Settings,
  ArrowLeft,
  ChevronRight,
  Menu,
  X,
  ShoppingBag,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { getMyStoresAction, updateMyStoreAction } from "@/backend/modules/store/store.actions";
import { Store as StoreType, StoreCreateInput } from "@/types/store";
import { ProductsList } from "@/components/shared/productos/ProductsList";
import { SellerStoreInfo } from "@/components/seller/SellerStoreInfo";
import { useProductsLogic } from "@/frontend/hooks/useProductsLogic";
import { toast } from "sonner";
import logger from "@/utils/logger";

const log = logger.child();

type SellerTab = "products" | "store_info";

const SIDEBAR_ITEMS: { id: SellerTab; labelEs: string; labelEn: string; icon: any }[] = [
  { id: "products", labelEs: "Mis Productos", labelEn: "My Products", icon: Package },
  { id: "store_info", labelEs: "Mi Tienda", labelEn: "My Store", icon: Store },
];

function SellerDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const initialTab = (searchParams.get("tab") as SellerTab) || "products";
  const [activeTab, setActiveTab] = useState<SellerTab>(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [isStoreSelectorOpen, setIsStoreSelectorOpen] = useState(false);
  const [loadingStore, setLoadingStore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSeller = session?.user?.role === "seller" || session?.user?.role === "admin";
  
  const activeStore = stores.find(s => s.id === activeStoreId) || null;

  const { state: productState, actions: productActions } = useProductsLogic(activeStoreId || undefined);

  // Protect route
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mi-tienda");
    }
  }, [status, router]);

  const handleUpdateStore = async (storeId: string, data: Partial<StoreCreateInput>) => {
    try {
      const result = await updateMyStoreAction(storeId, data);
      
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

  const loadStore = async () => {
    if (!session?.user?.id) return;
    try {
      setLoadingStore(true);
      const res = await getMyStoresAction();
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

  // Load store
  useEffect(() => {
    loadStore();
  }, [session?.user?.id]);

  // Update tab in URL
  const handleTabChange = (tab: SellerTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    if (activeStoreId) params.set("store", activeStoreId);
    router.replace(`/mi-tienda?${params.toString()}`, { scroll: false });
  };

  const handleStoreChange = (storeId: string) => {
    setActiveStoreId(storeId);
    setIsStoreSelectorOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("store", storeId);
    router.replace(`/mi-tienda?${params.toString()}`, { scroll: false });
  };

  if (status === "loading" || loadingStore) {
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
              <button
                key={item.id}
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
              {activeTab === "products"
                ? "Gestiona los productos de tu tienda"
                : "Información y configuración de tu tienda"}
            </p>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "products" && activeStore && (
                  <ProductsList
                    storeId={activeStore.id}
                    products={productState.products}
                    loading={productState.loading}
                    categoryCounts={productState.categoryCounts}
                    categoryFilter={productState.categoryFilter}
                    searchQuery={productState.searchQuery}
                    debouncedSearch={productState.debouncedSearch}
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
                )}
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
        </div>
      </main>
    </div>
  );
}

export default function MiTiendaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 flex items-center justify-center bg-background"><Loading /></div>}>
      <SellerDashboardContent />
    </Suspense>
  );
}
