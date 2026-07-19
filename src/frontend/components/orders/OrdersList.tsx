"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Order, OrderCard } from "./OrderCard";

type OrdersListProps = {
  orders: Order[];
  loading: boolean;
  unreadChatCounts?: Record<string, number>;
  onNavigate: (href: string) => void;
  onCancelOrder: (orderId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
};

export const OrdersList = ({ orders, loading, unreadChatCounts = {}, onNavigate, onCancelOrder, onDeleteOrder }: OrdersListProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
          <Package className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold">Aún no tienes pedidos</h3>
        <p className="mt-2 text-muted-foreground">
          Cuando realices una compra, aparecerá aquí.
        </p>
        <Button
          className="mt-8 rounded-2xl px-8 h-12 text-base font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105"
          onClick={() => onNavigate("/products")}
        >
          Ir a Productos
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-3">
      <AnimatePresence mode="popLayout">
        {orders.map((order, index) => (
          <OrderCard
            key={order.id}
            order={order}
            index={index}
            unreadChatCount={unreadChatCounts[order.id]}
            onNavigate={onNavigate}
            onCancelOrder={onCancelOrder}
            onDeleteOrder={onDeleteOrder}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
