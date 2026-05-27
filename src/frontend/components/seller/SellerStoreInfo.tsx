"use client";

import React, { useState } from "react";
import { Store as StoreType, StoreCreateInput } from "@/types/store";
import { Store, MapPin, Phone, Mail, Calendar, Globe, Pencil } from "lucide-react";
import { SellerStoreEditModal } from "./SellerStoreEditModal";

interface SellerStoreInfoProps {
  store: StoreType;
  onStoreUpdated?: () => void;
  onUpdateStore: (storeId: string, data: Partial<StoreCreateInput>) => Promise<any>;
}

export function SellerStoreInfo({ store, onStoreUpdated, onUpdateStore }: SellerStoreInfoProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const infoItems = [
    { icon: Store, label: "Nombre", value: store.name },
    { icon: Globe, label: "Slug / URL", value: `/tienda/${store.slug}` },
    { icon: MapPin, label: "Ciudad", value: store.city || "No especificada" },
    { icon: MapPin, label: "Dirección", value: store.address || "No especificada" },
    { icon: Phone, label: "Teléfono", value: store.phone || "No especificado" },
    { icon: Mail, label: "Correo", value: store.email || "No especificado" },
    { icon: Calendar, label: "Miembro desde", value: new Date(store.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) },
  ];

  return (
    <>
      <div className="space-y-10">
        {/* Header Section */}
        <div className="relative">
          {/* Edit Button */}
          <div className="absolute top-0 right-0 z-10 flex justify-end">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/50 backdrop-blur-sm rounded-full text-sm font-bold text-foreground hover:bg-secondary transition-all group"
            >
              <Pencil className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              Editar Tienda
            </button>
          </div>

          {/* Minimal Banner Style */}
          <div className="flex items-end gap-6 mb-8 pt-4">
            <div className="h-20 w-20 rounded-3xl bg-secondary/80 flex items-center justify-center shrink-0">
              <Store className="w-10 h-10 text-primary" />
            </div>
            <div className="pb-2">
              <h2 className="text-3xl font-black text-foreground font-display tracking-tight">{store.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                  {store.status === "ACTIVE" ? "Activa" : store.status === "SUSPENDED" ? "Suspendida" : "Cerrada"}
                </span>
                {store._count && (
                  <span className="text-sm font-medium text-muted-foreground">
                    <strong className="text-foreground">{store._count.products}</strong> Productos
                  </span>
                )}
              </div>
            </div>
          </div>

          {store.description && (
            <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
              {store.description}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border/50" />

        {/* Info Grid */}
        <div>
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-6 opacity-80">Detalles de la Tienda</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-10">
            {infoItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-secondary/50 text-muted-foreground">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm text-foreground font-semibold truncate">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <SellerStoreEditModal
          store={store}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={onStoreUpdated}
          onUpdateStore={onUpdateStore}
        />
      )}
    </>
  );
}

