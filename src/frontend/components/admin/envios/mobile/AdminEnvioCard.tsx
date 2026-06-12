"use client";

import { Eye, ExternalLink, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { envioStatusConfig, type EnvioEstadoKey } from "../envioUtils";
import type { EnvioCardData } from "../AdminEnvioCard";

interface AdminEnvioCardMobileProps {
  envio: EnvioCardData;
  onOpenDetail: (envio: EnvioCardData) => void;
  onOpenOrderDetail?: (pedidoId: string) => void;
}

export function AdminEnvioCardMobile({ envio, onOpenDetail, onOpenOrderDetail }: AdminEnvioCardMobileProps) {
  const cfg = envioStatusConfig[envio.estado as EnvioEstadoKey];
  const StatusIcon = cfg?.icon || Package;

  return (
    <div className="lg:hidden flex flex-col">
      <div className={cn(
        "h-1 w-full shrink-0",
        cfg?.barColor
      )} />

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-black tracking-tight truncate">
              {envio.numeroGuia}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest pointer-events-none shadow-sm shrink-0",
                cfg?.color
              )}
            >
              <StatusIcon className="mr-1 h-2.5 w-2.5" />
              {cfg?.labelEs}
            </Badge>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground tracking-wider shrink-0">
            #{envio.pedidoId?.slice(-6).toUpperCase()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">
              Destinatario
            </p>
            <p className="font-semibold truncate">
              {envio.pedido?.usuario?.name || envio.destinatarioNombre || "-"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">
              Destino
            </p>
            <p className="font-medium truncate">
              {envio.ciudad || "-"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">
              Transportadora
            </p>
            <p className="font-medium truncate">
              {envio.transportadora || "-"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 mb-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold rounded-xl flex-1 tracking-wide uppercase"
            onClick={() => onOpenDetail(envio)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Ver detalle
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary"
            onClick={() => onOpenOrderDetail?.(envio.pedidoId)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
