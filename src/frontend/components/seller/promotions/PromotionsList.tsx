"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Tag } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { getPromotionsColumns } from "./PromotionsListColumns";

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

  const columns = useMemo(
    () => getPromotionsColumns(onToggleStatus, onDelete),
    [onToggleStatus, onDelete]
  );

  return (
    <>
      <div className="flex flex-col space-y-4 flex-1 min-h-0 relative h-full">
        <DataTable
          columns={columns}
          data={promotions}
          loading={loading}
          pageCount={1}
          currentPage={1}
          pageSize={promotions.length > 0 ? promotions.length : 10}
          totalEntries={promotions.length}
          emptyTitle="Sin Promociones"
          emptyDescription="Impulsa tus ventas creando descuentos especiales para tus clientes."
          emptyIcon={Tag}
        />
      </div>

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
    </>
  );
};
