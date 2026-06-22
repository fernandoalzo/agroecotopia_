"use client";

import { useState } from "react";
import { Save, BoxSelect, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ProductSelectorModal } from "./ProductSelectorModal";
import { SidePanel } from "@/frontend/components/ui/side-panel";

interface PromotionCreatePanelProps {
  open: boolean;
  storeId: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  getProducts: (storeId: string) => Promise<any>;
  searchProducts: (query: string) => Promise<any>;
}

export const PromotionCreatePanel = ({
  open,
  storeId,
  onClose,
  onSubmit,
  getProducts,
  searchProducts
}: PromotionCreatePanelProps) => {
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
        // Reset form
        setFormData({
          name: "",
          description: "",
          discountType: "PERCENTAGE",
          discountValue: 10,
          scope: "ENTIRE_STORE",
          expiresAt: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        });
        setSelectedProductIds([]);
      }
    } catch (error) {
      toast.error("Error al crear la promoción");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SidePanel
        open={open}
        onClose={onClose}
        title="Crear Promoción"
        subtitle="Configura una nueva promoción o descuento para tus clientes."
        icon={<Tag className="h-4 w-4 text-primary" />}
        footer={
          <div className="flex items-center gap-3 w-full">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" form="promo-form" className="flex-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Guardando...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Promoción
                </>
              )}
            </Button>
          </div>
        }
      >
        <form id="promo-form" onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Nombre de la Promoción</Label>
            <Input 
              id="name" 
              required 
              placeholder="Ej. Descuento de Verano" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Descripción (Opcional)</Label>
            <Textarea 
              id="description" 
              placeholder="Detalles sobre esta promoción..." 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60 resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Tipo de Descuento</Label>
              <Select 
                value={formData.discountType} 
                onValueChange={(val) => setFormData({...formData, discountType: val})}
              >
                <SelectTrigger className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Monto Fijo ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Valor</Label>
              <Input 
                type="number" 
                min="1" 
                max={formData.discountType === "PERCENTAGE" ? "100" : undefined}
                required 
                value={formData.discountValue}
                onChange={(e) => setFormData({...formData, discountValue: Number(e.target.value)})}
                className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Alcance (Aplica a)</Label>
            <Select 
              value={formData.scope} 
              onValueChange={(val) => setFormData({...formData, scope: val})}
            >
              <SelectTrigger className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTIRE_STORE">Toda la Tienda</SelectItem>
                <SelectItem value="SPECIFIC_PRODUCTS">Productos Seleccionados</SelectItem>
                <SelectItem value="SINGLE_PRODUCT">Un Solo Producto</SelectItem>
              </SelectContent>
            </Select>
            {formData.scope !== "ENTIRE_STORE" && (
              <div className="mt-3 bg-secondary/10 border border-border/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Productos: {selectedProductIds.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Modifica tu selección aquí.</p>
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
            <Label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Fecha de Caducidad</Label>
            <Input 
              type="date" 
              required 
              min={new Date().toISOString().split('T')[0]}
              value={formData.expiresAt}
              onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
              className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
            />
          </div>

        </form>
      </SidePanel>

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
