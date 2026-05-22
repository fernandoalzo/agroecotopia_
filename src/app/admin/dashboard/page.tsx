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
import { AdminOrdersList } from "@/components/admin/AdminOrdersList";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useSocket } from "@/frontend/context/SocketContext";
import { getAdminConversations } from "@/backend/modules/chat/chat.actions";
import { AdminChatPageContent } from "@/app/admin/chat/page";
import logger from "@/utils/logger";

const log = logger.child();

type DashboardTab = "orders" | "chat";

const SIDEBAR_ITEMS: { id: DashboardTab; labelEs: string; labelEn: string; icon: typeof Package }[] = [
  { id: "orders", labelEs: "Gestión de Pedidos", labelEn: "Order Management", icon: Package },
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

  const isAdmin = session?.user?.role === "admin";
  const userId = session?.user?.id;

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
  useEffect(() => {
    if (!isAdmin) return;
    let isCancelled = false;

    const loadUnread = async () => {
      try {
        const res = await getAdminConversations();
        if (!isCancelled && res && !("error" in res)) {
          const total = res.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0);
          setUnreadCount(total);
        }
      } catch (err) {
        log.error("Error loading dashboard unread count:", err);
      }
    };

    loadUnread();
    const interval = setInterval(loadUnread, 15000);

    if (socket) {
      socket.on("new_message_notification", loadUnread);
      socket.on("conversation_deleted", loadUnread);
    }

    return () => {
      isCancelled = true;
      clearInterval(interval);
      if (socket) {
        socket.off("new_message_notification", loadUnread);
        socket.off("conversation_deleted", loadUnread);
      }
    };
  }, [isAdmin, userId, socket]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Mobile: full-page chat (iframe breaks keyboard/viewport on iOS & Android)
  useEffect(() => {
    if (!isMobile || activeTab !== "chat" || status !== "authenticated" || !isAdmin) return;
    router.replace("/admin/chat?from=dashboard");
  }, [isMobile, activeTab, status, isAdmin, router]);

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
                <ChevronRight
                  className={cn(
                    "w-4 h-4 shrink-0 transition-all duration-200",
                    isActive ? "opacity-80" : "opacity-0 group-hover:opacity-50"
                  )}
                />
              </button>
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

          <div className="flex-1 min-w-0">
            <motion.h1
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-black tracking-tight"
            >
              {activeTab === "orders" ? "Gestión de Pedidos" : "Soporte Chat"}
            </motion.h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeTab === "orders"
                ? "Monitorea, gestiona y atiende todos los pedidos."
                : "Atiende las conversaciones de soporte en tiempo real."}
            </p>
          </div>
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
                <AdminOrdersList />
              </motion.div>
            )}

            {activeTab === "chat" && !isMobile && (
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

            {activeTab === "chat" && isMobile && (
              <div className="flex-1 flex items-center justify-center p-8">
                <Loading text="Abriendo chat..." subtext="" />
              </div>
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
