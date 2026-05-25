"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, ChevronDown, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/config/config";

interface ForumSidebarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeFilters: Record<string, string>;
  setActiveFilter: (category: string, value: string) => void;
}

function FilterCategory({
  category,
  labels,
  activeFilters,
  setActiveFilter
}: {
  category: string;
  labels: readonly string[];
  activeFilters: Record<string, string>;
  setActiveFilter: (category: string, value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activeLabel = activeFilters[category];
  const hasActiveFilter = activeLabel && activeLabel !== "Todos";

  return (
    <div className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group outline-none"
      >
        <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2 group-hover:text-primary transition-colors">
          <Hash className="w-3 h-3" /> {category}
          {hasActiveFilter && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </h4>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground/50 transition-transform duration-300", isOpen && "rotate-180", "group-hover:text-primary")} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 pt-4">
              {["Todos", ...labels].map(label => {
                const isActive = (activeFilters[category] || "Todos") === label;
                return (
                  <button 
                    key={label}
                    onClick={() => setActiveFilter(category, label)}
                    className={cn(
                      "text-left px-3 py-2 -mx-3 rounded-md text-sm font-medium transition-all flex items-center justify-between group outline-none",
                      isActive ? "text-primary bg-primary/5" : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {label}
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ForumSidebar({
  searchQuery,
  setSearchQuery,
  activeFilters,
  setActiveFilter
}: ForumSidebarProps) {
  return (
    <div className="w-full lg:col-span-3 lg:sticky lg:top-28 space-y-8">
      <div className="space-y-10 px-2">
        <div className="relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar discusiones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-0 py-2 bg-transparent border-b border-border/50 focus:border-primary focus:outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all rounded-none"
          />
        </div>

        <div className="space-y-6">
          {Object.entries(config.forum.labels).map(([category, labels]) => (
            <FilterCategory 
              key={category}
              category={category}
              labels={labels}
              activeFilters={activeFilters}
              setActiveFilter={setActiveFilter}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
