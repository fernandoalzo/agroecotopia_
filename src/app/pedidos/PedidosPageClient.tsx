"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import Footer from "@/components/Footer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { Package, ArrowLeft, LayoutDashboard, History } from "lucide-react";
import Link from "next/link";
import { OrdersList } from "@/components/orders/OrdersList";
import { AdminOrdersList } from "@/components/admin/pedidos/AdminOrdersList";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";
import { useSocket } from "@/frontend/context/SocketContext";
import { useSocketRefresh } from "@/frontend/hooks/useSocketRefresh";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { config } from "@/config/config";

interface PedidosPageClientProps {
  getUserOrders: () => Promise<unknown>;
  cancelUserOrder: (orderId: string) => Promise<unknown>;
  deleteUserOrder: (orderId: string) => Promise<unknown>;
  getUserOrderConversations: () => Promise<unknown>;
}

const hasError = (result: unknown): result is { error: string } => {
  return typeof result === "object" && result !== null && "error" in result;
};

export default function PedidosPageClient({
  getUserOrders,
  cancelUserOrder,
  deleteUserOrder,
  getUserOrderConversations,
}: PedidosPageClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const isAdmin = session?.user?.role === "admin";
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Protected route logic
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/pedidos");
    }
    // Admin users are redirected to the unified dashboard
    if (status === "authenticated" && isAdmin) {
      router.replace("/admin/dashboard");
    }
  }, [status, isAdmin, router]);

  // React Query: Fetch Orders
  const { data: rawOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["userOrders"],
    queryFn: async () => {
      const result = await getUserOrders();
      if (hasError(result)) throw new Error(result.error);
      return Array.isArray(result) ? result : [];
    },
    enabled: status === "authenticated" && !isAdmin,
  });
  
  const orders = Array.isArray(rawOrders) ? rawOrders : [];

  // React Query: Fetch Conversations Unread Counts
  const { data: conversationsData } = useQuery({
    queryKey: ["userOrderConversations"],
    queryFn: async () => {
      const res = await getUserOrderConversations();
      if (hasError(res)) throw new Error(res.error);
      return Array.isArray(res) ? res : [];
    },
    enabled: status === "authenticated" && !isAdmin && orders.length > 0,
  });

  const unreadChatCounts = useMemo(() => {
    if (!conversationsData) return {};
    return conversationsData.reduce((acc: Record<string, number>, conv: any) => {
      if (conv?.pedido?.id) acc[conv.pedido.id] = Number(conv.unreadCount) || 0;
      return acc;
    }, {});
  }, [conversationsData]);

  // React Query Mutations
  const cancelOrderMutation = useMutation({
    mutationFn: cancelUserOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteUserOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
    },
  });

  const handleCancelOrder = async (orderId: string) => {
    await cancelOrderMutation.mutateAsync(orderId);
  };

  const handleDeleteOrder = async (orderId: string) => {
    await deleteOrderMutation.mutateAsync(orderId);
  };

  // Socket Refresh Listeners
  const refreshUnreadCounts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["userOrderConversations"] });
  }, [queryClient]);

  useSocketRefresh({
    socket,
    enabled: status === "authenticated" && !isAdmin && orders.length > 0,
    refresh: refreshUnreadCounts,
  });

  const refreshUserOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["userOrders"] });
  }, [queryClient]);

  useSocketRefresh({
    socket,
    enabled: status === "authenticated" && !isAdmin,
    refresh: refreshUserOrders,
    events: ["order:status_updated_user"],
  });

  if (status === "loading" && !session) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background/50 selection:bg-primary/20 overflow-x-hidden">
      
      <main className="flex-1 pt-24 pb-20 md:pt-32">
        <div className={cn("container px-4 md:px-6 mx-auto", isAdmin ? "max-w-7xl" : "max-w-5xl")}>
          {/* Hero Section */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-primary font-bold tracking-wider text-xs uppercase"
              >
                {isAdmin ? (
                  <>
                    <LayoutDashboard className="h-4 w-4" />
                    Panel de administración
                  </>
                ) : (
                  <>
                    <History className="h-4 w-4" />
                    Historial de compras
                  </>
                )}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-black tracking-tight"
              >
                {isAdmin ? "Pedidos" : t.navbar.pedidos}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground text-lg max-w-xl"
              >
                {isAdmin
                  ? "Monitorea, gestiona y atiende todos los pedidos de los usuarios de Agroecotopia."
                  : `Gestiona y haz seguimiento a todos tus pedidos realizados en ${config.app.name}.`}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button variant="outline" className="rounded-2xl px-6 h-11 font-bold border-primary/20 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all shadow-sm" asChild>
                <Link href={isAdmin ? "/admin/chat" : "/products"} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {isAdmin ? "Volver a Soporte Chat" : "Volver a la tienda"}
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Orders List Component */}
          <div className="relative">
            {/* Background decorative elements */}
            <div className="hidden md:block absolute -top-24 -right-24 h-64 w-64 bg-primary/5 blur-3xl rounded-full -z-10" />
            <div className="hidden md:block absolute -bottom-24 -left-24 h-64 w-64 bg-accent/5 blur-3xl rounded-full -z-10" />
            
            {isAdmin ? null : (
              <OrdersList
                orders={orders}
                loading={ordersLoading}
                unreadChatCounts={unreadChatCounts}
                onCancelOrder={handleCancelOrder}
                onDeleteOrder={handleDeleteOrder}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
