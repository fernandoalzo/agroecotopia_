"use client";

import React, { useState } from "react";
import { Save, AlertCircle, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Store as StoreType, StoreCreateInput } from "@/types/store";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/seller/SellerStoreEditModal.tsx");

import { SidePanel } from "@/frontend/components/ui/side-panel";
import { storeRequestSchema, type StoreRequestFormInput } from "./schemas/store-request.schema";

interface SellerStoreEditPanelProps {
  open: boolean;
  store: StoreType;
  onClose: () => void;
  onSuccess?: () => void;
  onUpdateStore: (storeId: string, data: Partial<StoreCreateInput>) => Promise<any>;
}

export const SellerStoreEditPanel = ({ open, store, onClose, onSuccess, onUpdateStore }: SellerStoreEditPanelProps) => {
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
    <SidePanel
      open={open}
      onClose={onClose}
      title="Editar Tienda"
      subtitle="Modifica la información visible para tus clientes"
      icon={<Store className="h-4 w-4 text-primary" />}
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="store-edit-form"
            className="flex-1"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Guardando...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      }
    >
      <form id="store-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
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
      </form>
    </SidePanel>
  );
};
