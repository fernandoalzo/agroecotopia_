"use client";

import { Eye, ExternalLink, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { envioStatusConfig, type EnvioEstadoKey } from "../envioUtils";
import type { EnvioCardData } from "../AdminEnvioCard";

interface AdminEnvioCardDesktopProps {
  envio: EnvioCardData;
  onOpenDetail: (envio: EnvioCardData) => void;
  onOpenOrderDetail?: (pedidoId: string) => void;
}

export function AdminEnvioCardDesktop({ envio, onOpenDetail, onOpenOrderDetail }: AdminEnvioCardDesktopProps) {
  const cfg = envioStatusConfig[envio.estado as EnvioEstadoKey];
  const StatusIcon = cfg?.icon || Package;

  return (
    <div className="hidden lg:flex items-stretch">
      <div className={cn(
        "w-[4px] h-auto my-4 shrink-0 rounded-full ml-3 transition-all duration-300",
        cfg?.barColor,
        cfg?.glowColor
      )} />

      <div className="flex-1 p-3 xl:p-5 flex items-center gap-2 xl:gap-4 min-w-0">
        <div className="min-w-0 w-44 xl:w-56 shrink">
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight truncate">
              {envio.numeroGuia}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest pointer-events-none shadow-sm",
                cfg?.color
              )}
            >
              <StatusIcon className="mr-1 h-2.5 w-2.5" />
              {cfg?.labelEs}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            Pedido #{envio.pedidoId?.slice(-6).toUpperCase()}
          </p>
        </div>

        <div className="min-w-0 w-36 xl:w-48 shrink">
          <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-1">
            Destinatario
          </p>
          <p className="text-sm font-semibold truncate">
            {envio.pedido?.usuario?.name || envio.destinatarioNombre || "-"}
          </p>
        </div>

        <div className="min-w-0 w-32 xl:w-40 shrink">
          <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-1">
            Destino
          </p>
          <p className="text-sm font-medium truncate">
            {envio.ciudad || "-"}
          </p>
        </div>

        <div className="min-w-0 w-28 xl:w-36 shrink">
          <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-1">
            Transportadora
          </p>
          <p className="text-sm font-medium truncate">
            {envio.transportadora || "-"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors"
            onClick={() => onOpenDetail(envio)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors"
            onClick={() => onOpenOrderDetail?.(envio.pedidoId)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
