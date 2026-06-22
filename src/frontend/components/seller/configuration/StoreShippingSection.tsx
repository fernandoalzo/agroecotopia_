import React, { useEffect, useState, useMemo } from "react";
import { Store as StoreType } from "@/types/store";
import { Switch } from "@/components/ui/switch";
import { MapPin, Truck, Plus, Trash2, Edit2, ChevronDown, ChevronUp, Save, Globe, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/Loading";
import { DataTable } from "@/frontend/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SidePanel } from "@/frontend/components/ui/side-panel";
import { ZoneSidePanel, ZoneData } from "./panels/ZoneSidePanel";
import { RateSidePanel, RateData } from "./panels/RateSidePanel";

interface StoreShippingSectionProps {
  store: StoreType;
  actions: any;
}

export function StoreShippingSection({ store, actions }: StoreShippingSectionProps) {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadZones = async () => {
    setLoading(true);
    try {
      const res = await actions.getStoreShippingZones(store.id);
      if (res && res.success) {
        setZones(res.zones);
      }
    } catch (err) {
      toast.error("Error al cargar zonas de envío");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, [store.id]);

  // Zone Handlers
  const handleOpenZoneModal = (zone?: any) => {
    if (zone) {
      setEditingZone(zone);
    } else {
      setEditingZone(null);
    }
    setIsZoneModalOpen(true);
  };

  const submitZone = async (data: ZoneData) => {
    setIsSubmitting(true);
    try {
      if (editingZone) {
        await actions.updateStoreShippingZone(editingZone.id, data);
        toast.success("Zona actualizada");
      } else {
        await actions.createStoreShippingZone(store.id, data);
        toast.success("Zona creada");
      }
      setIsZoneModalOpen(false);
      loadZones();
    } catch (err) {
      toast.error("Error al guardar zona");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteZone = async (id: string) => {
    try {
      await actions.deleteStoreShippingZone(id);
      toast.success("Zona eliminada");
      loadZones();
    } catch (err) {
      toast.error("Error al eliminar zona");
    } finally {
      setDeletingId(null);
    }
  };

  // Rate Handlers
  const handleOpenRateModal = (zoneId: string) => {
    setActiveZoneId(zoneId);
    setIsRateModalOpen(true);
  };

  const submitRate = async (data: RateData) => {
    if (!activeZoneId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await actions.addShippingRate(activeZoneId, data);
      toast.success("Tarifa creada");
      setIsRateModalOpen(false);
      loadZones();
    } catch (err) {
      toast.error("Error al crear tarifa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRate = async (id: string) => {
    try {
      await actions.deleteShippingRate(id);
      toast.success("Tarifa eliminada");
      loadZones();
    } catch (err) {
      toast.error("Error al eliminar tarifa");
    } finally {
      setDeletingId(null);
    }
  };

  const [deliveryEnabled, setDeliveryEnabled] = useState(
    store.config?.shippingMethods?.delivery?.enabled ?? true
  );
  const [pickupEnabled, setPickupEnabled] = useState(
    store.config?.shippingMethods?.pickup?.enabled ?? true
  );

  const toggleShippingMethod = async (type: 'delivery' | 'pickup', value: boolean) => {
    try {
      if (type === 'delivery') setDeliveryEnabled(value);
      if (type === 'pickup') setPickupEnabled(value);

      const newConfig = {
        delivery: { enabled: type === 'delivery' ? value : deliveryEnabled },
        pickup: { enabled: type === 'pickup' ? value : pickupEnabled }
      };

      const res = await actions.updateStoreConfig(store.id, { shippingMethods: newConfig });
      if (res && res.success) {
        toast.success("Opciones de entrega actualizadas");
      }
    } catch (err) {
      toast.error("Error al actualizar opciones de entrega");
      // Revert state
      if (type === 'delivery') setDeliveryEnabled(!value);
      if (type === 'pickup') setPickupEnabled(!value);
    }
  };

  const rateColumns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nombre de Tarifa",
      cell: ({ row }) => (
        <span className="font-medium flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-muted-foreground" />
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium text-xs">
          {row.original.type === "POR_PESO" ? "Por kg extra" : "Fija"}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: "Precio",
      cell: ({ row }) => <span className="font-bold">${row.original.price.toLocaleString()}</span>,
    },
    {
      accessorKey: "freeShippingThreshold",
      header: "Envío Gratis Desde",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.freeShippingThreshold ? `$${row.original.freeShippingThreshold.toLocaleString()}` : "N/A"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const rate = row.original;
        return (
          <div className="flex justify-end gap-1">
            {deletingId === rate.id ? (
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => deleteRate(rate.id)} className="p-1 text-red-500 rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                <button onClick={() => setDeletingId(null)} className="p-1 text-muted-foreground rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => setDeletingId(rate.id)} className="p-1 text-muted-foreground hover:text-red-500 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ], [deletingId]);

  if (loading) {
    return <div className="py-12 flex justify-center"><Loading /></div>;
  }

  return (
    <div className="flex flex-col h-full space-y-4 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 border-b border-border/50 pb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Opciones de Entrega</h2>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="delivery-switch"
              checked={deliveryEnabled}
              onCheckedChange={(checked) => toggleShippingMethod('delivery', checked)}
              className="scale-75"
            />
            <label htmlFor="delivery-switch" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-muted-foreground" />
              Domicilio
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="pickup-switch"
              checked={pickupEnabled}
              onCheckedChange={(checked) => toggleShippingMethod('pickup', checked)}
              className="scale-75"
            />
            <label htmlFor="pickup-switch" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Bodega
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end px-1 shrink-0 pt-2">
        <div>
          <h2 className="text-lg font-bold font-display">Zonas de Envío</h2>
          <p className="text-muted-foreground text-sm">Configura las zonas donde ofreces envíos a domicilio y establece las tarifas.</p>
        </div>
      </div>

      {/* Floating Action Button for Nueva Zona */}
      <button
        onClick={() => handleOpenZoneModal()}
        className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all hover:shadow-xl hover:shadow-primary/40"
        title="Nueva Zona"
      >
        <Plus className="w-6 h-6" />
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-8 space-y-8">
        {zones.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No tienes zonas de envío configuradas. Se cobrará $0 de envío por defecto.
          </div>
        ) : (
          <div className="space-y-8">
          {zones.map((zone) => (
            <div key={zone.id} className="w-full">
              <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{zone.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                      {zone.ciudades.map((c: string) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenRateModal(zone.id)} className="text-xs font-bold bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-lg transition-colors">
                    + Añadir Tarifa
                  </button>
                  <button onClick={() => handleOpenZoneModal(zone)} className="p-1.5 text-muted-foreground hover:text-primary rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {deletingId === zone.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteZone(zone.id)} className="p-1.5 text-red-500 rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeletingId(null)} className="p-1.5 text-muted-foreground rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(zone.id)} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <DataTable
                  columns={rateColumns}
                  data={zone.rates || []}
                  emptyTitle="Sin Tarifas"
                  emptyDescription="No hay tarifas para esta zona. Añade una para empezar a cobrar envíos."
                  emptyIcon={Truck}
                />
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Zone SidePanel */}
      <ZoneSidePanel
        open={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        onSubmit={submitZone}
        initialData={editingZone}
        isSubmitting={isSubmitting}
      />

      {/* Rate SidePanel */}
      <RateSidePanel
        open={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        onSubmit={submitRate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
