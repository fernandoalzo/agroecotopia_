"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, BoxSelect } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ProductSelectorModal } from "./ProductSelectorModal";

interface PromotionCreateModalProps {
  storeId: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  getProducts: (storeId: string) => Promise<any>;
  searchProducts: (query: string) => Promise<any>;
}

export const PromotionCreateModal = ({
  storeId,
  onClose,
  onSubmit,
  getProducts,
  searchProducts
}: PromotionCreateModalProps) => {
  const [loading, setLoading] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    scope: "ENTIRE_STORE",
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // 7 days default
  });

  // We don't fetch on mount anymore, the ProductSelectorModal handles it.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const success = await onSubmit({
        storeId,
        ...formData,
        expiresAt: new Date(formData.expiresAt),
        productIds: formData.scope === "ENTIRE_STORE" ? [] : selectedProductIds,
      });
      if (success) {
        toast.success("Promoción creada exitosamente");
        onClose();
      }
    } catch (error) {
      toast.error("Error al crear la promoción");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="promo-create-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[90vh]"
          >
          <div className="flex items-center justify-between p-6 border-b border-border/30 bg-muted/20">
            <h2 className="text-xl font-bold font-display">Crear Promoción</h2>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            <form id="promo-form" onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Promoción</Label>
                <Input 
                  id="name" 
                  required 
                  placeholder="Ej. Descuento de Verano" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="rounded-xl bg-background border-border/50 focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea 
                  id="description" 
                  placeholder="Detalles sobre esta promoción..." 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="rounded-xl bg-background border-border/50 focus:border-primary/50 resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Descuento</Label>
                  <Select 
                    value={formData.discountType} 
                    onValueChange={(val) => setFormData({...formData, discountType: val})}
                  >
                    <SelectTrigger className="rounded-xl border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Monto Fijo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max={formData.discountType === "PERCENTAGE" ? "100" : undefined}
                    required 
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: Number(e.target.value)})}
                    className="rounded-xl border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alcance (Aplica a)</Label>
                <Select 
                  value={formData.scope} 
                  onValueChange={(val) => setFormData({...formData, scope: val})}
                >
                  <SelectTrigger className="rounded-xl border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTIRE_STORE">Toda la Tienda</SelectItem>
                    <SelectItem value="SPECIFIC_PRODUCTS">Productos Seleccionados</SelectItem>
                    <SelectItem value="SINGLE_PRODUCT">Un Solo Producto</SelectItem>
                  </SelectContent>
                </Select>
                {formData.scope !== "ENTIRE_STORE" && (
                  <div className="mt-3 bg-secondary/20 border border-border/50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">Productos seleccionados: {selectedProductIds.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Haz clic en el botón para modificar tu selección.</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsSelectorOpen(true)}
                      className="rounded-lg font-bold shadow-sm"
                    >
                      <BoxSelect className="w-4 h-4 mr-2" />
                      Seleccionar
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Fecha de Caducidad</Label>
                <Input 
                  type="date" 
                  required 
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                  className="rounded-xl border-border/50"
                />
              </div>

            </form>
          </div>

          <div className="p-6 border-t border-border/30 bg-muted/20 flex justify-end gap-3 shrink-0">
            <Button variant="ghost" type="button" onClick={onClose} disabled={loading} className="rounded-xl font-bold">
              Cancelar
            </Button>
            <Button type="submit" form="promo-form" disabled={loading} className="rounded-xl font-bold px-6">
              {loading ? "Guardando..." : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Promoción
                </>
              )}
            </Button>
          </div>

          </motion.div>
        </motion.div>
      </AnimatePresence>

      {isSelectorOpen && (
        <ProductSelectorModal
          onClose={() => setIsSelectorOpen(false)}
          onSelect={(ids) => {
            setSelectedProductIds(ids);
            setIsSelectorOpen(false);
          }}
          initialSelectedIds={selectedProductIds}
          isMultiSelect={formData.scope === "SPECIFIC_PRODUCTS"}
          getProducts={() => getProducts(storeId)}
          searchProducts={searchProducts}
        />
      )}
    </>
  );
};
