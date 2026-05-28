"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PedidoEstado } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { AdminOrder, statusConfig, getNextStatuses } from "./adminOrderUtils";
import { AdminOrderCardMobile } from "./mobile/AdminOrderCard";
import { AdminOrderCardDesktop } from "./desktop/AdminOrderCard";

interface AdminOrderCardProps {
  order: AdminOrder;
  index: number;
  isUpdating: boolean;
  onUpdateStatus: (orderId: string, newStatus: PedidoEstado) => Promise<boolean>;
  onOpenOrderChat?: (order: AdminOrder) => void;
}

export const AdminOrderCard = ({ order, index, isUpdating, onUpdateStatus, onOpenOrderChat }: AdminOrderCardProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingStatus, setConfirmingStatus] = useState<PedidoEstado | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);

  const cfg = statusConfig[order.estado];
  const nextStatuses = getNextStatuses(order.estado);

  useEffect(() => {
    if (confirmingStatus && order.estado === confirmingStatus && !isUpdating) {
      setConfirmingStatus(null);
    }
  }, [confirmingStatus, isUpdating, order.estado]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopiedId(order.id);
    toast.success("ID copiado");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirm = async () => {
    if (confirmingStatus) {
      await onUpdateStatus(order.id, confirmingStatus);
    }
  };

  const sharedProps = {
    order,
    copiedId,
    confirmingStatus,
    isUpdating,
    nextStatuses,
    onCopyId: handleCopyId,
    onConfirm: handleConfirm,
    onSetConfirmingStatus: setConfirmingStatus,
    onOpenOrderChat: onOpenOrderChat ? () => onOpenOrderChat(order) : undefined,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card className={cn(
        "group overflow-hidden rounded-2xl backdrop-blur-md transition-all duration-300 border",
        cfg.cardBorderClass,
        cfg.hoverClasses
      )}>
        <CardContent className="p-0">
          <AdminOrderCardMobile
            {...sharedProps}
            showAllItems={showAllItems}
            onSetShowAllItems={setShowAllItems}
          />
          <AdminOrderCardDesktop {...sharedProps} />
        </CardContent>
      </Card>
    </motion.div>
  );
};
