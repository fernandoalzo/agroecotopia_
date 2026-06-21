"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Pause,
  Play,
  Trash2,
  Radio,
  Globe,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

import type { WafRequestEntry } from "@/lib/waf/request-buffer";
import { useSocket } from "@/frontend/context/SocketContext";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTable } from "@/frontend/components/ui/data-table";
import { WafActionBadge, MethodBadge, CopyBtn, WafRequestDetailPanel } from "./WafRequestDetailPanel";

/* ─── Types ─────────────────────────────────────────────── */

interface WafMonitorActions {
  getLog: (page?: number, pageSize?: number) => Promise<{
    success: boolean;
    entries: WafRequestEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;
  clearLog: () => Promise<{ success: boolean }>;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;

/* ─── Helpers ───────────────────────────────────────────── */

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}

/* ─── Main Component ────────────────────────────────────── */

export function WafMonitor({ actions }: { actions: WafMonitorActions }) {
  /* Data & UI state */
  const [entries, setEntries] = useState<WafRequestEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { socket } = useSocket();
  const pauseBuffer = useRef<WafRequestEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Pagination state */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalEntries, setTotalEntries] = useState(0);
  const [newEntriesCount, setNewEntriesCount] = useState(0);
  
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  /* Detail panel */
  const [selectedEntry, setSelectedEntry] = useState<WafRequestEntry | null>(null);

  /* ─── Data fetching ─────────────────────────────────── */

  const fetchPage = useCallback(async (page: number, size: number) => {
    try {
      const res = await actions.getLog(page, size);
      if (res.success) {
        setEntries(res.entries);
        setTotalEntries(res.total);
        setCurrentPage(res.page);
      }
    } catch { /* noop */ }
  }, [actions]);

  /* Initial load */
  const fetchPageRef = useRef(fetchPage);
  useEffect(() => { fetchPageRef.current = fetchPage; });

  useEffect(() => {
    const load = async () => {
      try {
        await fetchPageRef.current(1, pageSize);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Real-time Socket handling ─────────────────────── */

  const handleNewEntry = useCallback(
    (entry: WafRequestEntry) => {
      if (currentPage !== 1) {
        setNewEntriesCount((c) => c + 1);
        setTotalEntries((t) => t + 1);
        return;
      }

      if (paused) {
        pauseBuffer.current.push(entry);
        return;
      }

      setEntries((prev) => [entry, ...prev].slice(0, pageSize));
      setTotalEntries((t) => t + 1);
    },
    [currentPage, paused, pageSize],
  );

  useEffect(() => {
    if (!socket) return;
    setConnected(true);
    socket.emit("join_waf_monitor", { role: "admin" });
    socket.on("waf:request_live", handleNewEntry);

    return () => {
      socket.emit("leave_waf_monitor");
      socket.off("waf:request_live", handleNewEntry);
    };
  }, [socket, handleNewEntry]);

  /* Resume from pause — flush buffer (page 1 only) */
  useEffect(() => {
    if (!paused && pauseBuffer.current.length > 0 && currentPage === 1) {
      const batched = pauseBuffer.current;
      pauseBuffer.current = [];
      setEntries((prev) => [...batched.reverse(), ...prev].slice(0, pageSize));
    }
  }, [paused, pageSize, currentPage]);

  /* ─── Page navigation ───────────────────────────────── */

  const goToPage = useCallback((page: number) => {
    const safePage = Math.max(1, Math.min(page, totalPages));
    if (safePage === 1) {
      setNewEntriesCount(0);
    }
    fetchPage(safePage, pageSize);
  }, [fetchPage, pageSize, totalPages]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setNewEntriesCount(0);
    fetchPage(1, newSize);
  }, [fetchPage]);

  const goToFirstPage = useCallback(() => {
    setNewEntriesCount(0);
    fetchPage(1, pageSize);
  }, [fetchPage, pageSize]);

  /* ─── Actions ───────────────────────────────────────── */

  const handleClear = async () => {
    try {
      await actions.clearLog();
      setEntries([]);
      setTotalEntries(0);
      setCurrentPage(1);
      setNewEntriesCount(0);
      pauseBuffer.current = [];
    } catch { /* noop */ }
  };

  const togglePause = () => setPaused((p) => !p);

  /* ─── Derived data ──────────────────────────────────── */

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const method = e.method.toLowerCase();
      const path = (e.path + (e.query ? `?${e.query}` : "")).toLowerCase();
      const ip = e.ip.toLowerCase();
      const status = e.wafAction.toLowerCase();
      return method.includes(q) || path.includes(q) || ip.includes(q) || status.includes(q);
    });
  }, [entries, searchQuery]);

  const blockedCount = entries.filter((e) => e.wafAction === "BLOCK").length;
  const monitorCount = entries.filter((e) => e.wafAction === "MONITOR").length;
  const allowCount = entries.filter((e) => e.wafAction === "ALLOW").length;
  const avgElapsed = entries.length > 0
    ? Math.round(entries.reduce((sum, e) => sum + e.elapsedMs, 0) / entries.length)
    : 0;

  /* Pagination display helpers */
  const rangeStart = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalEntries);

  /* ─── TanStack Table Setup ──────────────────────────── */

  const columnHelper = createColumnHelper<WafRequestEntry>();

  const columns = useMemo(() => [
    columnHelper.accessor("wafAction", {
      header: "Estado",
      cell: (info) => <WafActionBadge action={info.getValue()} />,
    }),
    columnHelper.accessor("method", {
      header: "Método",
      cell: (info) => <MethodBadge method={info.getValue()} />,
    }),
    columnHelper.accessor("path", {
      header: "Ruta",
      cell: ({ row }) => {
        const query = row.original.query;
        return (
          <div className="flex items-center gap-1 min-w-0 font-mono text-[12px] group" title={row.original.path + (query ? `?${query}` : "")}>
            <span className="truncate text-foreground/90 max-w-[250px] xl:max-w-[400px]">{row.original.path}</span>
            {query && (
              <span className="text-muted-foreground/50 truncate max-w-[100px] xl:max-w-[200px]">?{query}</span>
            )}
            <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyBtn value={row.original.path} />
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("ip", {
      header: "IP",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-muted-foreground truncate group" title={row.original.ip}>
          <Globe className="h-3 w-3 inline mr-1 align-middle shrink-0" />
          <span className="font-mono text-[11px] truncate">{row.original.ip}</span>
          <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyBtn value={row.original.ip} />
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("wafRules", {
      header: "Reglas",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          {row.original.wafRules.length > 0 ? (
            <>
              {row.original.wafRules.slice(0, 2).map((ruleId) => (
                <span
                  key={ruleId}
                  className="text-[9px] font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded border border-destructive/20 truncate max-w-[80px]"
                  title={ruleId}
                >
                  {ruleId.replace("waf:", "")}
                </span>
              ))}
              {row.original.wafRules.length > 2 && (
                <span className="text-[9px] text-muted-foreground shrink-0">+{row.original.wafRules.length - 2}</span>
              )}
            </>
          ) : (
            <span className="text-[9px] text-muted-foreground/40">—</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("timestamp", {
      header: () => <div className="text-right">Hora</div>,
      cell: ({ row }) => (
        <div className="text-muted-foreground/60 font-mono text-[10px] text-right truncate">
          {formatTime(row.original.timestamp)}
        </div>
      ),
    }),
  ], [columnHelper]);

  const table = useReactTable({
    data: filteredEntries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="flex flex-col space-y-4 h-[calc(100vh-230px)]">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Monitor de Solicitudes</h2>
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", connected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40")} />
            <span className="text-[11px] text-muted-foreground font-mono">{totalEntries.toLocaleString()} total</span>
          </div>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por IP, ruta, método o estado…"
            className="w-full h-8 pl-8 pr-3 rounded-xl border border-border/50 bg-background/50 text-xs font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2 text-[11px] font-medium">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> {allowCount}
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> {monitorCount}
            </span>
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500" /> {blockedCount}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            className={cn("gap-1.5 text-xs", paused && "border-amber-400 text-amber-600 dark:text-amber-400")}
          >
            {paused ? (
              <>
                <Play className="h-3.5 w-3.5" /> Reanudar
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" /> Pausar
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={handleClear} className="gap-1.5 text-xs">
            <Trash2 className="h-3.5 w-3.5" /> Limpiar
          </Button>
        </div>
      </div>

      {/* ─── Pause banner ───────────────────────────────── */}
      {paused && pauseBuffer.current.length > 0 && (
        <div className="shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" />
          {pauseBuffer.current.length} solicitudes en pausa. Reanudá para verlas.
        </div>
      )}

      {/* ─── New entries banner (when on page > 1) ──────── */}
      {newEntriesCount > 0 && currentPage !== 1 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 rounded-xl bg-primary/10 border border-primary/30 px-4 py-2 text-xs text-primary flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span className="font-medium">{newEntriesCount} {newEntriesCount === 1 ? "nueva solicitud" : "nuevas solicitudes"} desde que cambiaste de página.</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7 text-primary hover:text-primary hover:bg-primary/10"
            onClick={goToFirstPage}
          >
            <ChevronsLeft className="h-3.5 w-3.5" /> Ir a página 1
          </Button>
        </motion.div>
      )}

      {/* ─── DataTable Reutilizable ─────────────────────── */}
      <DataTable
        columns={columns}
        data={filteredEntries}
        loading={loading}
        pageCount={totalPages}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={goToPage}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={(row) => setSelectedEntry(row)}
        selectedRowId={selectedEntry?.id}
        getRowId={(row) => row.id}
        getRowClassName={(row, i) => cn(
          row.wafAction === "BLOCK" && "bg-red-500/[0.02] hover:bg-red-500/[0.05]",
          row.wafAction === "MONITOR" && "bg-amber-500/[0.02] hover:bg-amber-500/[0.05]",
          i === 0 && currentPage === 1 && "bg-primary/[0.02] hover:bg-primary/[0.04]"
        )}
        emptyTitle={searchQuery ? "Sin resultados" : "No hay solicitudes registradas"}
        emptyDescription={searchQuery 
          ? <>No hay solicitudes que coincidan con <span className="font-mono text-foreground/70">&quot;{searchQuery}&quot;</span></> 
          : "Las peticiones aparecerán aquí en tiempo real cuando el WAF esté activo."
        }
        emptyIcon={searchQuery ? Search : Radio}
        footerLeftContent={
          <>
            <span>
              {searchQuery ? (
                <>{filteredEntries.length} / {entries.length} solicitudes &middot;</>
              ) : totalEntries > 0 ? (
                <>Mostrando {rangeStart}–{rangeEnd} de {totalEntries.toLocaleString()} solicitudes &middot;</>
              ) : (
                <>0 solicitudes &middot;</>
              )}{" "}
              WAF:{" "}
              {blockedCount > 0 ? (
                <span className="text-red-500 font-semibold">{blockedCount} bloqueadas</span>
              ) : (
                <span className="text-emerald-500 font-semibold">0 bloqueadas</span>
              )}
            </span>
            <span>{avgElapsed}ms promedio</span>
          </>
        }
      />

      {/* ─── Detail Side Panel ──────────────────────────── */}
      <WafRequestDetailPanel 
        entry={selectedEntry} 
        onClose={() => setSelectedEntry(null)} 
      />
    </div>
  );
}
