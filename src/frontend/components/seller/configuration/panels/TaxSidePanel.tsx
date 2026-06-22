import React, { useState, useEffect } from "react";
import { SidePanel } from "@/frontend/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Receipt, Save } from "lucide-react";

export interface TaxData {
  name: string;
  percentage: number;
  isActive: boolean;
}

interface TaxSidePanelProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaxData) => void;
  initialData?: any;
  isSubmitting: boolean;
}

export function TaxSidePanel({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: TaxSidePanelProps) {
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name || "");
        setPercentage(initialData.percentage?.toString() || "");
        setIsActive(initialData.isActive ?? true);
      } else {
        setName("");
        setPercentage("");
        setIsActive(true);
      }
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !percentage || isSubmitting) return;

    const pct = parseFloat(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      // You could also add local validation/toast here if you want
      // For now, let the parent or just pass it up. 
      // Actually, it's better to pass it up and let parent handle it or we handle it here.
      // Since toast is used in the parent for this specific check, let's just pass it up.
      // The parent already has that check, but we can return early here too.
    }
    
    onSubmit({ name, percentage: isNaN(pct) ? 0 : pct, isActive });
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={initialData ? "Editar Impuesto" : "Nuevo Impuesto"}
      subtitle="Configura los detalles del impuesto."
      icon={<Receipt className="h-4 w-4 text-primary" />}
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="tax-form"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Guardando...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </div>
      }
    >
      <form id="tax-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="tax-name"
            className="text-xs font-bold uppercase tracking-wider text-foreground/80"
          >
            Nombre (ej: IVA, Consumo)
          </Label>
          <Input
            id="tax-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
            placeholder="Nombre del impuesto"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="tax-percentage"
            className="text-xs font-bold uppercase tracking-wider text-foreground/80"
          >
            Porcentaje (%)
          </Label>
          <Input
            id="tax-percentage"
            type="number"
            step="0.01"
            required
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
            placeholder="Ej: 19"
          />
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/5">
          <div>
            <p className="font-bold text-sm">Impuesto Activo</p>
            <p className="text-xs text-muted-foreground">
              El impuesto se aplicará al cobrar.
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </form>
    </SidePanel>
  );
}
