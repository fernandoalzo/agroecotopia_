"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Warehouse, Search, Store } from "lucide-react";
import { getBodegasByCityAction } from "@/backend/modules/bodega/bodega.actions";

interface Bodega {
  id: string;
  name: string;
  address: string;
  city: string;
  store: { id: string; name: string } | null;
}

interface BodegaSelectProps {
  city: string;
  value: string;
  onChange: (bodegaId: string) => void;
  placeholder?: string;
}

export function BodegaSelect({
  city,
  value,
  onChange,
  placeholder = "Selecciona una bodega",
}: BodegaSelectProps) {
  const [open, setOpen] = useState(false);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (city && open) {
      setLoading(true);
      getBodegasByCityAction(city).then((res) => {
        if (res.success) {
          setBodegas(res.bodegas as Bodega[]);
        }
        setLoading(false);
      });
    }
  }, [city, open]);

  const filtered = query.trim()
    ? bodegas.filter((b) =>
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.store?.name.toLowerCase().includes(query.toLowerCase())
      )
    : bodegas;

  const selectedBodega = bodegas.find((b) => b.id === value);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-muted-foreground/50 pointer-events-none z-10">
          <Warehouse className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          readOnly
          value={selectedBodega ? `${selectedBodega.name} - ${selectedBodega.store?.name}` : ""}
          onFocus={() => setOpen(true)}
          placeholder={!city ? "Selecciona una ciudad primero" : placeholder}
          className={`w-full border border-border/50 bg-background pl-10 pr-10 py-2.5 text-sm font-medium focus:outline-none transition-all placeholder:text-muted-foreground/40 cursor-pointer
            ${open
              ? "rounded-t-xl border-b-transparent focus:ring-0 shadow-[0_4px_20px_-10px_rgba(var(--primary),0.3)]"
              : "rounded-xl focus:ring-2 focus:ring-primary/30 shadow-sm"
            } ${!city ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          disabled={!city}
        />
        <div className="absolute right-3 text-muted-foreground/40 pointer-events-none">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 w-full top-full bg-card border border-border/50 border-t-0 rounded-b-xl shadow-[0_15px_30px_-15px_rgba(var(--primary),0.2)] max-h-64 overflow-y-auto custom-scrollbar p-1"
          >
            <div className="relative mb-1 sticky top-0 bg-card pt-1 pb-1 z-10">
              <div className="relative flex items-center">
                <div className="absolute left-2.5 text-muted-foreground/40">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar bodega..."
                  className="w-full border border-border/30 bg-background/50 pl-8 pr-3 py-2 text-xs font-medium rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {loading ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Cargando bodegas...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {!city
                  ? "Selecciona una ciudad primero"
                  : "No hay bodegas disponibles en esta ciudad"}
              </div>
            ) : (
              filtered.map((bodega) => {
                const selected = value === bodega.id;
                return (
                  <button
                    key={bodega.id}
                    type="button"
                    onClick={() => {
                      onChange(bodega.id);
                      setOpen(false);
                      inputRef.current?.blur();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group text-left ${
                      selected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary/70 text-foreground/90"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`block h-2 w-2 rounded-full transition-all duration-200 shrink-0 ${
                          selected ? "bg-primary shadow-sm shadow-primary/50 scale-110" : "bg-border/50"
                        }`}
                      />
                      <div className="min-w-0">
                        <span className={selected ? "font-bold block truncate" : "block truncate"}>
                          {bodega.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Store className="h-2.5 w-2.5" />
                          {bodega.store?.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 truncate ml-2 max-w-[120px]">
                      {bodega.address}
                    </span>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
