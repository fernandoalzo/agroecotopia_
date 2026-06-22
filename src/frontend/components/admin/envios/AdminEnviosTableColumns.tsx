"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Eye, ExternalLink, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { envioStatusConfig, type EnvioEstadoKey } from "./envioUtils";

const columnHelper = createColumnHelper<any>();

export const getAdminEnvioColumns = (
  onOpenDetail: (envio: any) => void,
  onOpenOrderDetail?: (pedidoId: string) => void
) => [
  columnHelper.accessor("numeroGuia", {
    header: "ENVÍO",
    cell: (info) => {
      const envio = info.row.original;
      const cfg = envioStatusConfig[envio.estado as EnvioEstadoKey];
      const StatusIcon = cfg?.icon || Package;

      return (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-[4px] h-10 shrink-0 rounded-full",
              cfg?.barColor,
              cfg?.glowColor
            )}
          />
          <div className="min-w-0">
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
        </div>
      );
    },
  }),
  columnHelper.accessor((row) => row.pedido?.usuario?.name || row.destinatarioNombre, {
    id: "destinatario",
    header: "DESTINATARIO",
    cell: (info) => {
      const envio = info.row.original;
      const nombre = envio.pedido?.usuario?.name || envio.destinatarioNombre || "-";
      return <span className="text-sm font-semibold truncate">{nombre}</span>;
    },
  }),
  columnHelper.accessor("ciudad", {
    header: "DESTINO",
    cell: (info) => {
      const ciudad = info.getValue() || "-";
      return <span className="text-sm font-medium truncate">{ciudad}</span>;
    },
  }),
  columnHelper.accessor("transportadora", {
    header: "TRANSPORTADORA",
    cell: (info) => {
      const transportadora = info.getValue() || "-";
      return <span className="text-sm font-medium truncate">{transportadora}</span>;
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: (info) => {
      const envio = info.row.original;
      return (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(envio);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onOpenOrderDetail?.(envio.pedidoId);
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  }),
];
