import React, { useState, useEffect } from "react";
import { SidePanel } from "@/frontend/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Warehouse, MapPin, Building2, ImageIcon, Save } from "lucide-react";

export interface BodegaData {
  name: string;
  address: string;
  city: string;
  imagenUrl?: string;
}

interface BodegaSidePanelProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BodegaData) => void;
  initialData?: any;
  isSubmitting: boolean;
}

export function BodegaSidePanel({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: BodegaSidePanelProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name || "");
        setAddress(initialData.address || "");
        setCity(initialData.city || "");
        setImagenUrl(initialData.imagenUrl || "");
      } else {
        setName("");
        setAddress("");
        setCity("");
        setImagenUrl("");
      }
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !city || isSubmitting) return;

    onSubmit({ name, address, city, imagenUrl: imagenUrl || undefined });
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={initialData ? "Editar Bodega" : "Nueva Bodega"}
      subtitle={
        initialData
          ? "Actualiza los datos de la bodega"
          : "Registra un punto de recogida para tus clientes"
      }
      icon={<Warehouse className="h-4 w-4 text-primary" />}
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
            form="bodega-form"
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
      <form id="bodega-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="bodega-name"
            className="text-xs font-bold uppercase tracking-wider text-foreground/80"
          >
            Nombre de la Bodega
          </Label>
          <div className="relative">
            <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input
              id="bodega-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60 pl-10"
              placeholder="Ej: Bodega Principal"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="bodega-address"
            className="text-xs font-bold uppercase tracking-wider text-foreground/80"
          >
            Dirección
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input
              id="bodega-address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60 pl-10"
              placeholder="Ej: Cra 45 #12-34, Local 201"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="bodega-city"
            className="text-xs font-bold uppercase tracking-wider text-foreground/80"
          >
            Ciudad
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input
              id="bodega-city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60 pl-10"
              placeholder="Ej: Bogotá"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-tight">
            La ciudad debe coincidir exactamente con la que los clientes seleccionan en el checkout.
          </p>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="bodega-image"
            className="text-xs font-bold uppercase tracking-wider text-foreground/80"
          >
            Foto de la Bodega (opcional)
          </Label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input
              id="bodega-image"
              type="url"
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60 pl-10"
              placeholder="https://ejemplo.com/foto-bodega.jpg"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-tight">
            URL de una imagen que muestre la fachada o ubicación de la bodega.
          </p>
        </div>
      </form>
    </SidePanel>
  );
}
