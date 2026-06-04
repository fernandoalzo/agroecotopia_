"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/Loading";
import { useDebounce } from "@/frontend/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface ProductSelectorModalProps {
  onClose: () => void;
  onSelect: (selectedIds: string[]) => void;
  initialSelectedIds: string[];
  isMultiSelect: boolean;
  getProducts: () => Promise<any>;
  searchProducts: (query: string) => Promise<any>;
}

export const ProductSelectorModal = ({
  onClose,
  onSelect,
  initialSelectedIds,
  isMultiSelect,
  getProducts,
  searchProducts,
}: ProductSelectorModalProps) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      if (res && res.products) {
        setProducts(res.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getProducts]);

  const searchDb = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await searchProducts(query);
      if (res && res.products) {
        setProducts(res.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchProducts]);

  useEffect(() => {
    if (debouncedSearch.trim().length > 0) {
      searchDb(debouncedSearch);
    } else {
      fetchInitial();
    }
  }, [debouncedSearch, fetchInitial, searchDb]);

  const handleToggle = (id: string) => {
    if (!isMultiSelect) {
      setSelectedIds([id]);
      return;
    }
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border/50 flex flex-col h-[70vh] max-h-[700px]"
        >
          <div className="flex items-center justify-between p-5 border-b border-border/30 bg-muted/10">
            <div>
              <h2 className="text-lg font-bold font-display">Seleccionar Productos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isMultiSelect ? "Selecciona uno o más productos" : "Selecciona un único producto"}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 border-b border-border/30 bg-background/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="w-full bg-secondary/30 border border-border/50 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 relative">
            {loading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Loading text="" className="scale-75" />
              </div>
            )}
            
            {!loading && products.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-70">
                <Search className="w-8 h-8 mb-2" />
                <p className="text-sm">No se encontraron productos.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map(p => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => handleToggle(p.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                        isSelected 
                          ? "bg-primary/5 border-primary shadow-sm shadow-primary/10" 
                          : "bg-background border-border/50 hover:border-primary/50 hover:bg-secondary/20"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-colors",
                        isMultiSelect ? "rounded-md" : "rounded-full",
                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                      )}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className={cn("text-sm font-bold truncate", isSelected ? "text-primary" : "text-foreground")}>{p.name}</span>
                        <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>Stock: {Number(p.stock)}</span>
                          <span>•</span>
                          <span>${Number(p.price).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border/30 bg-muted/10 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold text-muted-foreground">
              {selectedIds.length} seleccionado{selectedIds.length !== 1 && "s"}
            </span>
            <Button 
              className="rounded-xl font-bold px-8 shadow-md shadow-primary/20" 
              onClick={() => onSelect(selectedIds)}
            >
              Confirmar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
