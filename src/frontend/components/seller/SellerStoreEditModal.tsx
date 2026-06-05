"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Store as StoreType, StoreCreateInput } from "@/types/store";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/seller/SellerStoreEditModal.tsx");

const storeRequestSchema = z.object({
  name: z.string().min(3, "El nombre de la tienda debe tener al menos 3 caracteres."),
  description: z.string().min(20, "Por favor, danos una descripción más detallada (mínimo 20 caracteres)."),
  phone: z.string().min(7, "Ingresa un número de teléfono válido (mínimo 7 dígitos).").optional().or(z.literal("")),
  email: z.string().email("Ingresa un correo electrónico válido.").optional().or(z.literal("")),
  address: z.string().min(5, "La dirección debe ser más descriptiva (mínimo 5 caracteres).").optional().or(z.literal("")),
  city: z.string().min(3, "La ciudad debe tener al menos 3 caracteres.").optional().or(z.literal("")),
});

type StoreRequestFormInput = z.infer<typeof storeRequestSchema>;

interface SellerStoreEditModalProps {
  store: StoreType;
  onClose: () => void;
  onSuccess?: () => void;
  onUpdateStore: (storeId: string, data: Partial<StoreCreateInput>) => Promise<any>;
}

export const SellerStoreEditModal = ({ store, onClose, onSuccess, onUpdateStore }: SellerStoreEditModalProps) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreRequestFormInput>({
    resolver: zodResolver(storeRequestSchema),
    defaultValues: {
      name: store.name || "",
      description: store.description || "",
      phone: store.phone || "",
      email: store.email || "",
      address: store.address || "",
      city: store.city || "",
    },
  });

  const onSubmit = async (data: StoreRequestFormInput) => {
    if (loading) return;
    setLoading(true);
    try {
      const success = await onUpdateStore(store.id, data);
      if (success) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loading ? undefined : onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-all duration-300"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl shadow-black/5 custom-scrollbar"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-md">
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground font-display">Editar Tienda</h2>
              <p className="text-xs font-medium text-muted-foreground">Modifica la información visible para tus clientes</p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground transition-all disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Nombre de la Tienda <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("name")}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                      placeholder="Ej. Mi Finca Orgánica"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message as string}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register("description")}
                      rows={4}
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none custom-scrollbar text-foreground placeholder:text-muted-foreground"
                      placeholder="Cuéntanos sobre tu tienda, tus productos y tu historia..."
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1 font-medium">{errors.description.message as string}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Teléfono
                    </label>
                    <input
                      {...register("phone")}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                      placeholder="Ej. 300 123 4567"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone.message as string}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Ciudad
                    </label>
                    <input
                      {...register("city")}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                      placeholder="Ej. Medellín, Antioquia"
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1 font-medium">{errors.city.message as string}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Correo Electrónico
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                      placeholder="contacto@mitienda.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message as string}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Dirección Física
                    </label>
                    <input
                      {...register("address")}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                      placeholder="Vereda La Esperanza, Finca El Sol"
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1 font-medium">{errors.address.message as string}</p>}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 mt-6">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary leading-relaxed font-medium">
                  Los cambios realizados serán visibles inmediatamente en el perfil público de tu tienda.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 z-20 flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t border-border bg-card/80 backdrop-blur-md">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl font-bold px-6 border-border text-foreground hover:bg-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl font-bold px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </div>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
