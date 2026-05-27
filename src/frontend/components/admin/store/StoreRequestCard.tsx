"use client";

import React from "react";
import { StoreRequest } from "@/types/store";
import { Store } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StoreRequestCardProps {
    req: StoreRequest;
    index: number;
    onSelect: (req: StoreRequest) => void;
}

export function StoreRequestCard({ req, index, onSelect }: StoreRequestCardProps) {
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
        <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: Math.min(index * 0.03, 0.3) }}
        >
            <div
                className="group overflow-hidden rounded-2xl backdrop-blur-md transition-all duration-300 border bg-card/60 hover:bg-card hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 cursor-pointer"
                onClick={() => onSelect(req)}
            >
                <div className="flex flex-col p-0 pointer-events-none">
                    <div className="flex flex-col lg:flex-row lg:items-stretch">

                        {/* --- MOBILE VIEW --- */}
                        <div className="flex-1 p-4 lg:hidden">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black tracking-tight">
                                        #{req.id.slice(-6).toUpperCase()}
                                    </span>
                                    <span
                                        className={cn(
                                            "rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-sm",
                                            statusColors.split(" shadow")[0]
                                        )}
                                    >
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 border border-border/50 overflow-hidden text-primary">
                                    <Store className="w-6 h-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-base truncate">{req.name}</h3>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span className="truncate">{req.user?.name || "Desconocido"}</span> •{" "}
                                        <span>{format(new Date(req.createdAt), "dd MMM, yy", { locale: es })}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* --- DESKTOP VIEW --- */}
                        <div className="hidden lg:flex flex-1 items-stretch">
                            <div
                                className={cn(
                                    "w-[4px] h-auto my-4 shrink-0 rounded-full ml-3 transition-all duration-300",
                                    statusColors.split(" border")[1]
                                )}
                            />

                            <div className="flex-1 p-3 xl:p-5 flex items-center gap-4 xl:gap-6 min-w-0">

                                <div className="flex items-center gap-3 w-40 xl:w-48 shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 border border-border/50 overflow-hidden text-primary">
                                        <Store className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-sm font-black tracking-tight truncate">
                                                #{req.id.slice(-6).toUpperCase()}
                                            </span>
                                        </div>
                                        <span
                                            className={cn(
                                                "rounded-md border px-1.5 py-0 text-[9px] font-black uppercase tracking-widest shadow-sm inline-block truncate max-w-full",
                                                statusColors.split(" shadow")[0]
                                            )}
                                        >
                                            {statusLabel}
                                        </span>
                                    </div>
                                </div>

                                <div className="min-w-0 flex-[2]">
                                    <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">
                                        Tienda
                                    </p>
                                    <div className="text-sm font-bold truncate flex items-center gap-2">
                                        <span className="truncate">{req.name}</span>
                                        <div className="flex gap-1 shrink-0">
                                            <span className="text-xs font-normal text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md border border-border/50 truncate max-w-[100px] xl:max-w-[150px]">
                                                {req.description}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1 shrink-0">
                                    <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">
                                        Usuario
                                    </p>
                                    <p className="text-sm font-bold truncate">{req.user?.name || "Desconocido"}</p>
                                </div>

                                <div className="w-24 shrink-0 text-right hidden xl:block">
                                    <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">
                                        Fecha
                                    </p>
                                    <p className="text-sm font-bold">
                                        {format(new Date(req.createdAt), "dd MMM, yy", { locale: es })}
                                    </p>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </motion.div>
    );
}