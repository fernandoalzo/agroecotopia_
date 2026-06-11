import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Store as StoreType } from "@/types/store";
import { Plus, Trash2, Edit2, CheckCircle2, XCircle, X, Warehouse, MapPin, Building2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";

interface StoreBodegasSectionProps {
  store: StoreType;
  actions: {
    getStoreBodegas: (storeId: string) => Promise<{ success: boolean; bodegas: any[] }>;
    createBodega: (storeId: string, data: { name: string; address: string; city: string; imagenUrl?: string }) => Promise<{ success: boolean; bodega?: any; error?: string }>;
    updateBodega: (bodegaId: string, data: { name?: string; address?: string; city?: string; imagenUrl?: string }) => Promise<{ success: boolean; bodega?: any; error?: string }>;
    deleteBodega: (bodegaId: string) => Promise<{ success: boolean; error?: string }>;
  };
}

export function StoreBodegasSection({ store, actions }: StoreBodegasSectionProps) {
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBodega, setEditingBodega] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");

  const loadBodegas = async () => {
    setLoading(true);
    try {
      const res = await actions.getStoreBodegas(store.id);
      if (res && res.success) {
        setBodegas(res.bodegas);
      }
    } catch (err) {
      toast.error("Error al cargar bodegas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBodegas();
  }, [store.id]);

  const handleOpenModal = (bodega?: any) => {
    if (bodega) {
      setEditingBodega(bodega);
      setName(bodega.name);
      setAddress(bodega.address);
      setCity(bodega.city);
      setImagenUrl(bodega.imagenUrl || "");
    } else {
      setEditingBodega(null);
      setName("");
      setAddress("");
      setCity("");
      setImagenUrl("");
    }
    setIsModalOpen(true);
  };

  const submitBodega = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !city || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = { name, address, city, imagenUrl: imagenUrl || undefined };
      if (editingBodega) {
        await actions.updateBodega(editingBodega.id, payload);
        toast.success("Bodega actualizada");
      } else {
        await actions.createBodega(store.id, payload);
        toast.success("Bodega creada");
      }
      setIsModalOpen(false);
      loadBodegas();
    } catch (err) {
      toast.error("Error al guardar bodega");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBodega = async (id: string) => {
    try {
      await actions.deleteBodega(id);
      toast.success("Bodega eliminada");
      loadBodegas();
    } catch (err) {
      toast.error("Error al eliminar bodega");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="py-12 flex justify-center"><Loading /></div>;
  }

  return (
    <div className="space-y-6 relative">
      {/* Desktop header */}
      <div className="hidden sm:flex justify-between items-center bg-card p-6 rounded-2xl border border-border">
        <div>
          <h2 className="text-xl font-bold font-display">Bodegas de Recojo</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Registra las bodegas donde los clientes pueden recoger sus pedidos. 
            Cada bodega debe tener una ciudad asignada para aparecer en el checkout.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Bodega</span>
        </button>
      </div>

      {/* Mobile floating button */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-6 right-6 z-40 sm:hidden bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
      >
        <Plus className="w-7 h-7" />
      </button>

      {bodegas.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
            <Warehouse className="h-8 w-8 text-primary/40" />
          </div>
          <p className="text-muted-foreground font-medium mb-1">No tienes bodegas configuradas</p>
          <p className="text-sm text-muted-foreground/60">
            Crea una bodega para que los clientes puedan seleccionar "Recoger en bodega" durante el checkout.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {bodegas.map((bodega) => (
            <div
              key={bodega.id}
              className={cn(
                "group relative flex flex-col w-full h-full bg-card border border-border shadow-card",
                "hover:shadow-card-hover hover:scale-[1.03] hover:-translate-y-2 hover:border-primary",
                "transition-all duration-500 rounded-xl overflow-hidden",
                !bodega.isActive && "opacity-60"
              )}
            >
              {/* Image area */}
              <div className="relative h-32 w-full bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/5 dark:to-emerald-600/10 flex items-center justify-center overflow-hidden">
                {bodega.imagenUrl ? (
                  <Image
                    src={bodega.imagenUrl}
                    alt={bodega.name}
                    fill
                    className="object-cover group-hover:scale-115 transition-transform duration-700 ease-out"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                ) : (
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <Warehouse className="w-16 h-16 text-emerald-500/30 dark:text-emerald-400/20 drop-shadow-[0_0_40px_rgba(16,185,129,0.15)]" />
                    {!bodega.isActive && (
                      <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/40">
                        Inactiva
                      </span>
                    )}
                  </div>
                )}

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/5 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(bodega)}
                      className="bg-background/90 backdrop-blur-sm text-foreground px-4 py-2 rounded-full text-xs font-bold shadow-md hover:bg-background transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 inline-block mr-1.5" />
                      Editar
                    </button>
                    {deletingId === bodega.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteBodega(bodega.id)}
                          className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-full text-xs font-bold shadow-md hover:bg-red-600 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="bg-background/90 backdrop-blur-sm text-foreground p-2 rounded-full text-xs font-bold shadow-md hover:bg-background transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(bodega.id)}
                        className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-full text-xs font-bold shadow-md hover:bg-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Details section */}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-display font-bold text-base text-foreground mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {bodega.name}
                </h3>

                <div className="flex items-start gap-2 text-sm mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-snug line-clamp-2">{bodega.address}</span>
                </div>

                <div className="mt-auto pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    <span className="font-semibold text-foreground/80">{bodega.city}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] sm:items-center sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 my-auto max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 mb-6">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{editingBodega ? "Editar Bodega" : "Nueva Bodega"}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {editingBodega ? "Actualiza los datos de la bodega" : "Registra un punto de recogida para tus clientes"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            <form onSubmit={submitBodega} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre de la Bodega</label>
                <div className="relative">
                  <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    placeholder="Ej: Bodega Principal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Dirección</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    placeholder="Ej: Cra 45 #12-34, Local 201"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Ciudad</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    placeholder="Ej: Bogotá"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  La ciudad debe coincidir exactamente con la que los clientes seleccionan en el checkout.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Foto de la Bodega (opcional)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <input
                    type="url"
                    value={imagenUrl}
                    onChange={(e) => setImagenUrl(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    placeholder="https://ejemplo.com/foto-bodega.jpg"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  URL de una imagen que muestre la fachada o ubicación de la bodega.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-secondary/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Guardando...
                    </span>
                  ) : (
                    editingBodega ? "Actualizar Bodega" : "Crear Bodega"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
