"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/types";

import { ProductCardMobile } from "./mobile/ProductCard";
import { ProductCardDesktop } from "./desktop/ProductCard";

interface ProductCardProps {
  product: any;
  index: number;
  onView: () => void;
}

export const ProductCard = ({ product, index, onView }: ProductCardProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(product.id);
    setCopiedId(product.id);
    toast.success("ID copiado");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasStock = Number(product.stock) > 0;
  const stockClass = hasStock ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" : "text-red-500 bg-red-500/10 border-red-500/20";
  const stockLabel = hasStock ? `Stock: ${Number(product.stock)}` : "Agotado";

  const sharedProps = {
    product,
    copiedId,
    hasStock,
    stockClass,
    stockLabel,
    onCopyId: handleCopyId,
    onView,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card className={cn(
        "group overflow-hidden rounded-2xl backdrop-blur-md transition-all duration-300 border bg-card/60 hover:bg-card hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
      )}>
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            <ProductCardMobile {...sharedProps} />
            <ProductCardDesktop {...sharedProps} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
