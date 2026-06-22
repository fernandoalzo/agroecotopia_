import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Store as StoreType } from "@/types/store";
import { Plus, Trash2, Edit2, CheckCircle2, XCircle, X, Warehouse, MapPin, Building2, ImageIcon, Save } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";
import { DataTable } from "@/frontend/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SidePanel } from "@/frontend/components/ui/side-panel";
import { BodegaSidePanel, BodegaData } from "./panels/BodegaSidePanel";

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
    } else {
      setEditingBodega(null);
    }
    setIsModalOpen(true);
  };

  const submitBodega = async (data: BodegaData) => {
    setIsSubmitting(true);
    try {
      if (editingBodega) {
        await actions.updateBodega(editingBodega.id, data);
        toast.success("Bodega actualizada");
      } else {
        await actions.createBodega(store.id, data);
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

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Bodega",
      cell: ({ row }) => {
        const bodega = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-emerald-500/10 flex items-center justify-center">
              {bodega.imagenUrl ? (
                <Image
                  src={bodega.imagenUrl}
                  alt={bodega.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <Warehouse className="w-5 h-5 text-emerald-600/50" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm">{bodega.name}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "address",
      header: "Dirección",
      cell: ({ row }) => (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{row.original.address}</span>
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: "Ciudad",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Building2 className="w-4 h-4 text-muted-foreground/60 shrink-0" />
          <span>{row.original.city}</span>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => {
        const bodega = row.original;
        return (
          <span className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
            bodega.isActive !== false ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
          )}>
            {bodega.isActive !== false ? "Activa" : "Inactiva"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const bodega = row.original;
        return (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleOpenModal(bodega)}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {deletingId === bodega.id ? (
              <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                <button
                  onClick={() => deleteBodega(bodega.id)}
                  className="p-2 text-green-600 hover:bg-green-500/10 rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeletingId(bodega.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
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
      {/* Desktop header */}
      <div className="flex justify-between items-end px-1 shrink-0 pt-2 pb-2">
        <div>
          <h2 className="text-lg font-bold font-display">Bodegas de Recojo</h2>
          <p className="text-muted-foreground text-sm">
            Configura las bodegas donde los clientes pueden recoger sus pedidos sin costo.
          </p>
        </div>
      </div>

      {/* Floating Action Button for Nueva Bodega */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all hover:shadow-xl hover:shadow-primary/40"
        title="Nueva Bodega"
      >
        <Plus className="w-6 h-6" />
      </button>

      <DataTable
        columns={columns}
        data={bodegas}
        loading={loading}
        emptyTitle="No tienes bodegas configuradas"
        emptyDescription="Crea una bodega para que los clientes puedan seleccionar 'Recoger en bodega' durante el checkout."
        emptyIcon={Warehouse}
      />

      <BodegaSidePanel
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={submitBodega}
        initialData={editingBodega}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
