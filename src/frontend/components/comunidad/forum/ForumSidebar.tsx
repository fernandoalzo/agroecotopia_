"use client";

import { Search, Leaf, Filter, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { cropTypes, soilTypes } from "./forum.types";

interface ForumSidebarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterCrop: string;
  setFilterCrop: (val: string) => void;
  filterSoil: string;
  setFilterSoil: (val: string) => void;
}

export default function ForumSidebar({
  searchQuery,
  setSearchQuery,
  filterCrop,
  setFilterCrop,
  filterSoil,
  setFilterSoil
}: ForumSidebarProps) {
  return (
    <div className="hidden lg:block lg:col-span-3 sticky top-28 space-y-8">
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

        <div className="space-y-8">
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 mb-4 flex items-center gap-2">
              <Leaf className="w-3 h-3" /> Cultivo
            </h4>
            <div className="flex flex-col gap-0.5">
              {cropTypes.map(crop => (
                <button 
                  key={crop}
                  onClick={() => setFilterCrop(crop)}
                  className={cn(
                    "text-left px-3 py-2 -mx-3 rounded-md text-sm font-medium transition-all flex items-center justify-between group",
                    filterCrop === crop ? "text-primary bg-primary/5" : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {crop}
                  {filterCrop === crop && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 mb-4 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Suelo
            </h4>
            <div className="flex flex-col gap-0.5">
              {soilTypes.map(soil => (
                <button 
                  key={soil}
                  onClick={() => setFilterSoil(soil)}
                  className={cn(
                    "text-left px-3 py-2 -mx-3 rounded-md text-sm font-medium transition-all flex items-center justify-between group",
                    filterSoil === soil ? "text-accent bg-accent/5" : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {soil}
                  {filterSoil === soil && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
