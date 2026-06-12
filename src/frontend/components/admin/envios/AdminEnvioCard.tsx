"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { envioStatusConfig, type EnvioEstadoKey } from "./envioUtils";
import { AdminEnvioCardDesktop } from "./desktop/AdminEnvioCard";
import { AdminEnvioCardMobile } from "./mobile/AdminEnvioCard";

export type EnvioCardData = any;

interface AdminEnvioCardProps {
  envio: EnvioCardData;
  index: number;
  onOpenDetail: (envio: EnvioCardData) => void;
  onOpenOrderDetail?: (pedidoId: string) => void;
}

export function AdminEnvioCard({ envio, index, onOpenDetail, onOpenOrderDetail }: AdminEnvioCardProps) {
  const cfg = envioStatusConfig[envio.estado as EnvioEstadoKey];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card className={cn(
        "group overflow-hidden rounded-2xl backdrop-blur-md transition-all duration-300 border",
        cfg?.cardBorderClass,
        cfg?.hoverClasses
      )}>
        <CardContent className="p-0">
          <AdminEnvioCardMobile envio={envio} onOpenDetail={onOpenDetail} onOpenOrderDetail={onOpenOrderDetail} />
          <AdminEnvioCardDesktop envio={envio} onOpenDetail={onOpenDetail} onOpenOrderDetail={onOpenOrderDetail} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
