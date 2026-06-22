import React, { useState, useEffect } from "react";
import { SidePanel } from "@/frontend/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Save } from "lucide-react";

export interface RateData {
  name: string;
  type: "TARIFA_FIJA" | "POR_PESO";
  price: number;
  freeShippingThreshold?: number;
}

interface RateSidePanelProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RateData) => void;
  isSubmitting: boolean;
}

export function RateSidePanel({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: RateSidePanelProps) {
  const [rateName, setRateName] = useState("");
  const [rateType, setRateType] = useState<"TARIFA_FIJA" | "POR_PESO">(
    "TARIFA_FIJA"
  );
  const [ratePrice, setRatePrice] = useState("");
  const [freeThreshold, setFreeThreshold] = useState("");

  useEffect(() => {
    if (open) {
      // Reset state every time it's opened since we only create new rates (no edit logic provided in original UI)
      setRateName("");
      setRateType("TARIFA_FIJA");
      setRatePrice("");
      setFreeThreshold("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateName || !ratePrice || isSubmitting) return;

    onSubmit({
      name: rateName,
      type: rateType,
      price: parseFloat(ratePrice),
      freeShippingThreshold: freeThreshold ? parseFloat(freeThreshold) : undefined,
    });
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Nueva Tarifa"
      subtitle="Configura una tarifa para esta zona."
      icon={<Truck className="h-4 w-4 text-primary" />}
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
            form="rate-form"
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
      <form id="rate-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="rate-name"
            className="text-xs font-bold uppercase tracking-wider text-foreground/80"
          >
            Nombre (Ej. Envío Estándar)
          </Label>
          <Input
            id="rate-name"
            required
            value={rateName}
            onChange={(e) => setRateName(e.target.value)}
            className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-foreground/80">
              Tipo de Tarifa
            </Label>
            <Select value={rateType} onValueChange={(val: any) => setRateType(val)}>
              <SelectTrigger className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TARIFA_FIJA">Precio Fijo</SelectItem>
                <SelectItem value="POR_PESO">Cobro por Kg extra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="rate-price"
              className="text-xs font-bold uppercase tracking-wider text-foreground/80"
            >
              Precio ($)
            </Label>
            <Input
              id="rate-price"
              type="number"
              required
              value={ratePrice}
              onChange={(e) => setRatePrice(e.target.value)}
              className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="rate-threshold"
            className="text-xs font-bold uppercase tracking-wider text-foreground/80"
          >
            Monto para Envío Gratis (Opcional)
          </Label>
          <Input
            id="rate-threshold"
            type="number"
            value={freeThreshold}
            onChange={(e) => setFreeThreshold(e.target.value)}
            className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
            placeholder="Ej: 150000"
          />
          <p className="text-xs text-muted-foreground mt-1.5 leading-tight">
            Si el pedido supera este monto, el envío será gratis.
          </p>
        </div>
      </form>
    </SidePanel>
  );
}
