import { createColumnHelper } from "@tanstack/react-table";
import { Eye, Store } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StoreRequest } from "@/types/store";

const columnHelper = createColumnHelper<StoreRequest>();

export const getAdminStoreRequestsColumns = (
  onViewRequest: (req: StoreRequest) => void
) => [
  columnHelper.accessor("id", {
    header: "ID & ESTADO",
    cell: ({ row }) => {
      const req = row.original;
      const statusColors =
        req.status === "PENDING"
            ? "text-yellow-600 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_8px_rgba(234,179,8,0.5)] bg-yellow-500"
            : req.status === "APPROVED"
                ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.5)] bg-emerald-500"
                : "text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.5)] bg-red-500";

      const statusLabel =
          req.status === "PENDING"
              ? "Pendiente"
              : req.status === "APPROVED"
                  ? "Aprobada"
                  : "Rechazada";

      return (
        <div className="flex items-center gap-3">
          <div
            className={cn(
                "w-[4px] h-10 shrink-0 rounded-full transition-all duration-300",
                statusColors.split(" border")[1]
            )}
          />
          <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 border border-border/50 overflow-hidden text-primary">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm font-black tracking-tight truncate">
                    #{req.id.slice(-6).toUpperCase()}
                </span>
            </div>
            <Badge
                variant="outline"
                className={cn(
                    "rounded-md border px-1.5 py-0 text-[9px] font-black uppercase tracking-widest shadow-sm",
                    statusColors.split(" shadow")[0]
                )}
            >
                {statusLabel}
            </Badge>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("name", {
    header: "TIENDA",
    cell: ({ row }) => {
      const req = row.original;
      return (
        <div className="min-w-0 w-48 xl:w-64">
          <p className="text-sm font-bold truncate mb-1">
            {req.name}
          </p>
          {req.description && (
            <span className="text-xs font-normal text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md border border-border/50 truncate max-w-full inline-block">
                {req.description}
            </span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor((row) => row.user?.name, {
    id: "user",
    header: "USUARIO",
    cell: ({ row }) => {
      const req = row.original;
      return (
        <p className="text-sm font-bold truncate">
            {req.user?.name || "Desconocido"}
        </p>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: () => <div className="text-right w-full">FECHA</div>,
    cell: ({ row }) => {
      const req = row.original;
      return (
        <div className="w-full shrink-0 flex flex-col items-end pr-2">
            <p className="text-sm font-bold">
                {format(new Date(req.createdAt), "dd MMM, yy", { locale: es })}
            </p>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 shrink-0 justify-end w-16">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onViewRequest(row.original);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    ),
  }),
];
