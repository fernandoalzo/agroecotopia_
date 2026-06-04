"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/Loading";
import { PromotionCard } from "./PromotionCard";

interface PromotionsListProps {
  storeId: string;
  promotions: any[];
  loading: boolean;
  onToggleStatus: (id: string, isActive: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onCreateNew: () => void;
}

export const PromotionsList = ({
  promotions,
  loading,
  onToggleStatus,
  onDelete,
  onCreateNew
}: PromotionsListProps) => {

  return (
    <div className="space-y-6">
      {/* ── FAB for Creation ── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreateNew}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-shadow hover:shadow-xl hover:shadow-primary/40 focus:outline-none"
        title="Crear Nueva Promoción"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <div className="space-y-4 relative">
        {loading && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl min-h-[200px]">
            <Loading text="" subtext="" className="py-0 scale-75" />
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {!loading && promotions.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-secondary/10 rounded-3xl border border-border/30"
            >
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Tag className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-display text-foreground mb-2">Sin Promociones</h3>
              <p className="text-muted-foreground font-medium max-w-sm mb-6">
                Impulsa tus ventas creando descuentos especiales para tus clientes.
              </p>
              <Button onClick={onCreateNew} className="rounded-xl font-bold px-8">
                Crear Promoción
              </Button>
            </motion.div>
          ) : (
            promotions.map((promo, index) => (
              <PromotionCard
                key={promo.id}
                promo={promo}
                index={index}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
