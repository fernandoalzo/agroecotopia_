import React, { useState, useEffect } from "react";
import { SidePanel } from "@/frontend/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Save, Plus, X } from "lucide-react";

export interface ZoneData {
  name: string;
  ciudades: string[];
}

interface ZoneSidePanelProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ZoneData) => void;
  initialData?: any;
  isSubmitting: boolean;
}

export function ZoneSidePanel({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: ZoneSidePanelProps) {
  const [zoneName, setZoneName] = useState("");
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");

  useEffect(() => {
    if (open) {
      if (initialData) {
        setZoneName(initialData.name || "");
        setCiudades(initialData.ciudades || []);
      } else {
        setZoneName("");
        setCiudades([]);
      }
      setCityInput("");
    }
  }, [open, initialData]);

  const handleAddCity = () => {
    if (!cityInput.trim()) return;
    const newCity = cityInput.trim().toLowerCase();
    if (!ciudades.includes(newCity)) {
      setCiudades([...ciudades, newCity]);
    }
    setCityInput("");
  };

  const handleRemoveCity = (cityToRemove: string) => {
    setCiudades(ciudades.filter(c => c !== cityToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow submit even with just the input if they forgot to press +
    const pendingCity = cityInput.trim().toLowerCase();
    const finalCiudades = [...ciudades];
    
    if (pendingCity && !finalCiudades.includes(pendingCity)) {
      finalCiudades.push(pendingCity);
    }

    if (!zoneName || finalCiudades.length === 0 || isSubmitting) return;

    onSubmit({ name: zoneName, ciudades: finalCiudades });
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={initialData ? "Editar Zona" : "Nueva Zona de Envío"}
      subtitle="Configura las ciudades donde ofreces envíos."
      icon={<Globe className="h-4 w-4 text-primary" />}
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
            form="zone-form"
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
      <form id="zone-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="zone-name"
            className="text-xs font-bold uppercase tracking-wider text-foreground/80"
          >
            Nombre de la Zona (Ej. Nacional)
          </Label>
          <Input
            id="zone-name"
            required
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
            placeholder="Ej: Bogotá y alrededores"
          />
        </div>
        <div className="space-y-3">
          <Label
            htmlFor="zone-cities"
            className="text-xs font-bold uppercase tracking-wider text-foreground/80"
          >
            Ciudades incluidas
          </Label>
          <div className="flex gap-2">
            <Input
              id="zone-cities"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCity();
                }
              }}
              className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
              placeholder="Ej: bogota"
            />
            <Button 
              type="button" 
              onClick={handleAddCity}
              className="rounded-xl shrink-0"
              variant="secondary"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground leading-tight">
            Escribe las ciudades y presiona Enter o el botón + para agregarlas.
          </p>

          {/* City Badges */}
          {ciudades.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {ciudades.map((city, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 text-secondary-foreground text-sm rounded-lg border border-border/50 animate-in fade-in zoom-in duration-200"
                >
                  <span className="capitalize">{city}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCity(city)}
                    className="p-0.5 hover:bg-background/80 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </SidePanel>
  );
}
