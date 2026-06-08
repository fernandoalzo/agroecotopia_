"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Search } from "lucide-react";

interface CityZone {
  name: string;
  cities: string[];
}

interface CitySelectProps {
  zones: CityZone[];
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
}

export function CitySelect({
  zones,
  value,
  onChange,
  placeholder = "Selecciona una ciudad",
}: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const allCities = zones.flatMap((z) =>
    z.cities.map((c) => ({ city: c, zone: z.name })),
  );

  const filtered = query.trim()
    ? allCities.filter((c) =>
        c.city.toLowerCase().includes(query.toLowerCase()),
      )
    : allCities;

  const grouped = zones
    .map((z) => ({
      ...z,
      cities: z.cities.filter((c) =>
        query.trim()
          ? c.toLowerCase().includes(query.toLowerCase())
          : true,
      ),
    }))
    .filter((z) => z.cities.length > 0);

  const handleSelect = (city: string) => {
    onChange(city);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-muted-foreground/50 pointer-events-none z-10">
          <Building2 className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          readOnly
          value={value || ""}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`w-full border border-border/50 bg-background pl-10 pr-10 py-2.5 text-sm font-medium focus:outline-none transition-all placeholder:text-muted-foreground/40 cursor-pointer
            ${open
              ? "rounded-t-xl border-b-transparent focus:ring-0 shadow-[0_4px_20px_-10px_rgba(var(--primary),0.3)]"
              : "rounded-xl focus:ring-2 focus:ring-primary/30 shadow-sm"
            }`}
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
            className="absolute z-20 w-full top-full bg-card border border-border/50 border-t-0 rounded-b-xl shadow-[0_15px_30px_-15px_rgba(var(--primary),0.2)] max-h-56 overflow-y-auto custom-scrollbar p-1"
          >
            {/* Search filter */}
            <div className="relative mb-1 sticky top-0 bg-card pt-1 pb-1 z-10">
              <div className="relative flex items-center">
                <div className="absolute left-2.5 text-muted-foreground/40">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar ciudad..."
                  className="w-full border border-border/30 bg-background/50 pl-8 pr-3 py-2 text-xs font-medium rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {grouped.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                No se encontraron ciudades
              </div>
            ) : (
              grouped.map((zone) => (
                <div key={zone.name}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary/70 px-3 py-1.5">
                    {zone.name}
                  </div>
                  {zone.cities.map((city) => {
                    const selected = value === city;
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleSelect(city)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group text-left ${
                          selected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-secondary/70 text-foreground/90"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`block h-2 w-2 rounded-full transition-all duration-200 ${
                              selected ? "bg-primary shadow-sm shadow-primary/50 scale-110" : "bg-border/50"
                            }`}
                          />
                          <span className={selected ? "font-bold" : ""}>{city}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
