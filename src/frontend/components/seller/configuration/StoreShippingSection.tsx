import React, { useEffect, useState } from "react";
import { Store as StoreType } from "@/types/store";
import { Plus, Trash2, Edit2, CheckCircle2, XCircle, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/Loading";

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

  // Zone Form states
  const [zoneName, setZoneName] = useState("");
  const [ciudadesText, setCiudadesText] = useState("");

  // Rate Form states
  const [rateName, setRateName] = useState("");
  const [rateType, setRateType] = useState<"TARIFA_FIJA" | "POR_PESO">("TARIFA_FIJA");
  const [ratePrice, setRatePrice] = useState("");
  const [freeThreshold, setFreeThreshold] = useState("");

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
      setZoneName(zone.name);
      setCiudadesText(zone.ciudades.join(", "));
    } else {
      setEditingZone(null);
      setZoneName("");
      setCiudadesText("");
    }
    setIsZoneModalOpen(true);
  };

  const submitZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName || !ciudadesText || isSubmitting) return;

    const ciudadesArray = ciudadesText.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);

    setIsSubmitting(true);
    try {
      if (editingZone) {
        await actions.updateStoreShippingZone(editingZone.id, { name: zoneName, ciudades: ciudadesArray });
        toast.success("Zona actualizada");
      } else {
        await actions.createStoreShippingZone(store.id, { name: zoneName, ciudades: ciudadesArray });
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
    setRateName("");
    setRateType("TARIFA_FIJA");
    setRatePrice("");
    setFreeThreshold("");
    setIsRateModalOpen(true);
  };

  const submitRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateName || !ratePrice || !activeZoneId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await actions.addShippingRate(activeZoneId, {
        name: rateName,
        type: rateType,
        price: parseFloat(ratePrice),
        freeShippingThreshold: freeThreshold ? parseFloat(freeThreshold) : undefined,
      });
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

  if (loading) {
    return <div className="py-12 flex justify-center"><Loading /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border">
        <div>
          <h2 className="text-xl font-bold font-display">Zonas de Envío</h2>
          <p className="text-muted-foreground text-sm mt-1">Configura las zonas donde ofreces envíos y establece las tarifas (fijas o por peso).</p>
        </div>
        <button
          onClick={() => handleOpenZoneModal()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Zona</span>
        </button>
      </div>

      {zones.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">
          No tienes zonas de envío configuradas. Se cobrará $0 de envío por defecto.
        </div>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="bg-secondary/20 p-4 border-b border-border/50 flex justify-between items-center">
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
              
              <div className="p-0">
                {zone.rates && zone.rates.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/10 text-muted-foreground text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 font-medium">Nombre de Tarifa</th>
                        <th className="px-4 py-3 font-medium">Tipo</th>
                        <th className="px-4 py-3 font-medium">Precio</th>
                        <th className="px-4 py-3 font-medium">Envío Gratis Desde</th>
                        <th className="px-4 py-3 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {zone.rates.map((rate: any) => (
                        <tr key={rate.id} className="hover:bg-secondary/5 transition-colors">
                          <td className="px-4 py-3 font-medium flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                            {rate.name}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                              {rate.type === "POR_PESO" ? "Por kg extra" : "Fija"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold">${rate.price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {rate.freeShippingThreshold ? `$${rate.freeShippingThreshold.toLocaleString()}` : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-right">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground italic">
                    No hay tarifas para esta zona. Añade una para empezar a cobrar envíos.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone Modal */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6">
            <h3 className="text-xl font-bold mb-4">{editingZone ? "Editar Zona" : "Nueva Zona de Envío"}</h3>
            <form onSubmit={submitZone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre de la Zona (Ej. Nacional)</label>
                <input
                  type="text"
                  required
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ej: Bogotá y alrededores"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Ciudades incluidas (separadas por coma)</label>
                <textarea
                  required
                  value={ciudadesText}
                  onChange={(e) => setCiudadesText(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                  placeholder="Ej: bogota, chia, soacha"
                />
                <p className="text-xs text-muted-foreground mt-1">Escribe las ciudades exactamente como las escribirían tus clientes.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsZoneModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl border border-border font-medium hover:bg-secondary/50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50">
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6">
            <h3 className="text-xl font-bold mb-4">Nueva Tarifa</h3>
            <form onSubmit={submitRate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre (Ej. Envío Estándar)</label>
                <input
                  type="text"
                  required
                  value={rateName}
                  onChange={(e) => setRateName(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tipo de Tarifa</label>
                  <select
                    value={rateType}
                    onChange={(e: any) => setRateType(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="TARIFA_FIJA">Precio Fijo</option>
                    <option value="POR_PESO">Cobro por Kg extra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Precio ($)</label>
                  <input
                    type="number"
                    required
                    value={ratePrice}
                    onChange={(e) => setRatePrice(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Monto para Envío Gratis (Opcional)</label>
                <input
                  type="number"
                  value={freeThreshold}
                  onChange={(e) => setFreeThreshold(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ej: 150000"
                />
                <p className="text-xs text-muted-foreground mt-1">Si el pedido supera este monto, el envío será gratis.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsRateModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl border border-border font-medium hover:bg-secondary/50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50">
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
