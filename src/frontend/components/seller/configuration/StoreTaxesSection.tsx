import React, { useEffect, useState, useMemo } from "react";
import { Store as StoreType } from "@/types/store";
import { Plus, Trash2, Edit2, CheckCircle2, XCircle, Receipt, Save } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/Loading";
import { DataTable } from "@/frontend/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SidePanel } from "@/frontend/components/ui/side-panel";
import { TaxSidePanel, TaxData } from "./panels/TaxSidePanel";

interface StoreTaxesSectionProps {
  store: StoreType;
  actions: any;
}

export function StoreTaxesSection({ store, actions }: StoreTaxesSectionProps) {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<any>(null);
  const [deletingTaxId, setDeletingTaxId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTaxes = async () => {
    setLoading(true);
    try {
      const res = await actions.getStoreTaxes(store.id);
      if (res && res.success) {
        setTaxes(res.data);
      }
    } catch (err) {
      toast.error("Error al cargar impuestos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxes();
  }, [store.id]);

  const handleOpenModal = (tax?: any) => {
    if (tax) {
      setEditingTax(tax);
    } else {
      setEditingTax(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTax(null);
  };

  const handleSubmit = async (data: TaxData) => {
    setIsSubmitting(true);
    try {
      if (editingTax) {
        await actions.updateStoreTax(store.id, editingTax.id, data);
        toast.success("Impuesto actualizado");
      } else {
        await actions.createStoreTax(store.id, data);
        toast.success("Impuesto creado");
      }
      handleCloseModal();
      loadTaxes();
    } catch (err) {
      toast.error("Error al guardar impuesto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      await actions.deleteStoreTax(store.id, id);
      toast.success("Impuesto eliminado");
      loadTaxes();
    } catch (err) {
      toast.error("Error al eliminar impuesto");
    } finally {
      setDeletingTaxId(null);
    }
  };

  const handleToggleActive = async (tax: any) => {
    try {
      await actions.updateStoreTax(store.id, tax.id, { isActive: !tax.isActive });
      toast.success(`Impuesto ${!tax.isActive ? 'activado' : 'desactivado'}`);
      loadTaxes();
    } catch (err) {
      toast.error("Error al cambiar estado");
    }
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "percentage",
      header: "Porcentaje",
      cell: ({ row }) => <span>{row.original.percentage}%</span>,
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => {
        const tax = row.original;
        return (
          <button 
            onClick={() => handleToggleActive(tax)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              tax.isActive ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tax.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {tax.isActive ? "Activo" : "Inactivo"}
          </button>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const tax = row.original;
        return (
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => handleOpenModal(tax)}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {deletingTaxId === tax.id ? (
              <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                <button 
                  onClick={() => confirmDelete(tax.id)}
                  className="p-2 text-green-600 hover:bg-green-500/10 rounded-lg transition-colors"
                  title="Confirmar"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDeletingTaxId(null)}
                  className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  title="Cancelar"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setDeletingTaxId(tax.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ], [deletingTaxId]);

  if (loading) {
    return <div className="py-12 flex justify-center"><Loading /></div>;
  }

  return (
    <div className="flex flex-col h-full space-y-4 relative">
      <div className="flex justify-between items-end px-1 shrink-0 pt-2 pb-2">
        <div>
          <h2 className="text-lg font-bold font-display">Impuestos de la Tienda</h2>
          <p className="text-muted-foreground text-sm">Configura los impuestos que aplican a tus productos. Estos se sumarán al subtotal del pedido al momento del pago.</p>
        </div>
      </div>

      {/* Floating Action Button for Nuevo Impuesto */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all hover:shadow-xl hover:shadow-primary/40"
        title="Nuevo Impuesto"
      >
        <Plus className="w-6 h-6" />
      </button>

      <DataTable
        columns={columns}
        data={taxes}
        loading={loading}
        emptyTitle="Sin Impuestos"
        emptyDescription="No tienes impuestos configurados. Tus productos se venderán sin recargos adicionales."
        emptyIcon={Receipt}
      />

      <TaxSidePanel
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingTax}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
