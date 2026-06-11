import React, { useEffect, useState } from "react";
import { Store as StoreType } from "@/types/store";
import { Plus, Trash2, Edit2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/Loading";

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

  // Form states
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [isActive, setIsActive] = useState(true);
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
      setName(tax.name);
      setPercentage(tax.percentage.toString());
      setIsActive(tax.isActive);
    } else {
      setEditingTax(null);
      setName("");
      setPercentage("");
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTax(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !percentage || isSubmitting) return;
    
    const pct = parseFloat(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Porcentaje inválido");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTax) {
        await actions.updateStoreTax(store.id, editingTax.id, { name, percentage: pct, isActive });
        toast.success("Impuesto actualizado");
      } else {
        await actions.createStoreTax(store.id, { name, percentage: pct, isActive });
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

  if (loading) {
    return <div className="py-12 flex justify-center"><Loading /></div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="hidden sm:flex justify-between items-center bg-card p-6 rounded-2xl border border-border">
        <div>
          <h2 className="text-xl font-bold font-display">Impuestos de la Tienda</h2>
          <p className="text-muted-foreground text-sm mt-1">Configura los impuestos que aplican a tus productos. Estos se sumarán al subtotal del pedido al momento del pago.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Impuesto</span>
        </button>
      </div>

      {/* Mobile floating button */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-6 right-6 z-40 sm:hidden bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
      >
        <Plus className="w-7 h-7" />
      </button>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {taxes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No tienes impuestos configurados. Tus productos se venderán sin recargos adicionales.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre</th>
                <th className="px-6 py-4 font-medium">Porcentaje</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {taxes.map((tax) => (
                <tr key={tax.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 font-medium">{tax.name}</td>
                  <td className="px-6 py-4">{tax.percentage}%</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleActive(tax)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        tax.isActive ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {tax.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {tax.isActive ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6">
            <h3 className="text-xl font-bold mb-4">{editingTax ? "Editar Impuesto" : "Nuevo Impuesto"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre (ej: IVA, Consumo)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Nombre del impuesto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Porcentaje (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ej: 19"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Impuesto Activo</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 rounded-xl border border-border font-medium hover:bg-secondary/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
