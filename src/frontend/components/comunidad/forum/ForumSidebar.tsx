"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Hash, Check, X, Loader2, Sparkles, TextSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/config/config";
import { useLanguage } from "@/context/LanguageContext";

interface ForumSidebarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeFilters: Record<string, string[]>;
  setActiveFilter: (category: string, value: string) => void;
  isSearching?: boolean;
  searchType?: "semantic" | "textual" | null;
}

function FilterCategory({
  category,
  labels,
  activeFilters,
  setActiveFilter
}: {
  category: string;
  labels: readonly string[];
  activeFilters: Record<string, string[]>;
  setActiveFilter: (category: string, value: string) => void;
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabels = activeFilters[category] || [];
  const hasActiveFilter = selectedLabels.length > 0;

  return (
    <div className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group outline-none"
      >
        <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2 group-hover:text-primary transition-colors">
          <Hash className="w-3 h-3" /> {category}
          {hasActiveFilter && (
            <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
              {selectedLabels.length}
            </span>
          )}
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
              {/* "Todos" acts as a reset — active when no labels are selected */}
              <button
                onClick={() => setActiveFilter(category, "Todos")}
                className={cn(
                  "text-left px-3 py-2 -mx-3 rounded-md text-sm font-medium transition-all flex items-center justify-between group outline-none",
                  !hasActiveFilter ? "text-primary bg-primary/5" : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {t.forum.sidebar.all}
                {!hasActiveFilter && <Check className="w-4 h-4" />}
              </button>

              {labels.map(label => {
                const isSelected = selectedLabels.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => setActiveFilter(category, label)}
                    className={cn(
                      "text-left px-3 py-2 -mx-3 rounded-md text-sm font-medium transition-all flex items-center justify-between group outline-none",
                      isSelected ? "text-primary bg-primary/5" : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {label}
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground"
                      >
                        <Check className="w-3 h-3" />
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active pills summary — shown when multiple labels are selected */}
            {selectedLabels.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-1.5 pt-3 mt-2 border-t border-border/30"
              >
                {selectedLabels.map(label => (
                  <button
                    key={label}
                    onClick={() => setActiveFilter(category, label)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors"
                  >
                    {label}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </motion.div>
            )}
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
  setActiveFilter,
  isSearching,
  searchType
}: ForumSidebarProps) {
  const { t } = useLanguage();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const totalActiveFilters = Object.values(activeFilters).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="w-full lg:col-span-3 lg:sticky lg:top-28 space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-2">
        <div className="relative">
        {isSearching ? (
          <Loader2 className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
        ) : (
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        <input
          type="text"
          placeholder={t.forum.sidebar.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-8 py-2 bg-transparent border-b border-border/50 focus:border-primary focus:outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all rounded-none"
        />
        <AnimatePresence>
          {searchQuery.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              aria-label={t.forum.sidebar.clearSearch}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
        </div>

        <AnimatePresence>
          {searchQuery.length > 0 && !isSearching && searchType && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              className="overflow-hidden"
            >
              {searchType === "semantic" ? (
                <div className="flex items-center gap-2 px-3 py-1.5 mt-1 rounded-md bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                  <span className="text-[11px] font-medium text-primary tracking-wide">
                    {t.forum.sidebar.searchTypeSemantic}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 mt-1 rounded-md bg-gradient-to-r from-muted to-transparent border border-border/50">
                  <TextSearch className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
                    {t.forum.sidebar.searchTypeTextual}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="border-b border-border/50 pb-4 lg:hidden">
        <button
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="w-full flex items-center justify-between group outline-none"
        >
          <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2 group-hover:text-primary transition-colors">
            <Hash className="w-3 h-3" /> {t.forum.sidebar.filterByTags}
            {totalActiveFilters > 0 && (
              <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
                {totalActiveFilters}
              </span>
            )}
          </h4>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground/50 transition-transform duration-300", isMobileFiltersOpen && "rotate-180", "group-hover:text-primary")} />
        </button>
      </div>

      {/* Filters List */}
      <div className={cn(
        "space-y-6 lg:block",
        isMobileFiltersOpen ? "block" : "hidden"
      )}>
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
  );
}
