"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { CheckoutForm } from "./CheckoutForm";
import { Translations } from "@/architecture/languages/types";
import { CheckoutValues } from "@/lib/validations/checkout.schema";

interface CheckoutFormSectionProps {
  t: Translations;
  onSubmit: (data: CheckoutValues) => void;
  defaultValues?: Partial<CheckoutValues>;
  onCityChange?: (city: string) => void;
  onTipoEntregaChange?: (tipoEntrega: string) => void;
  onPaymentMethodChange?: (method: string) => void;
  onTransactionIdChange?: (txId: string) => void;
  cityZones: { name: string; cities: string[] }[];
  bodegas: any[];
  isLoadingBodegas: boolean;
  storeConfigs?: any[];
  isLoadingStoreConfigs?: boolean;
}

export const CheckoutFormSection: React.FC<CheckoutFormSectionProps> = ({
  t,
  onSubmit,
  defaultValues,
  onCityChange,
  onTipoEntregaChange,
  onPaymentMethodChange,
  onTransactionIdChange,
  cityZones,
  bodegas,
  isLoadingBodegas,
  storeConfigs,
  isLoadingStoreConfigs,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="pt-2"
    >
      <div className="mb-10 border-b-2 border-foreground/10 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-black uppercase tracking-widest text-foreground">
          {t.checkout.shippingInfo}
        </h2>
      </div>

      <CheckoutForm
        onSubmit={onSubmit}
        defaultValues={defaultValues}
        onCityChange={onCityChange}
        onTipoEntregaChange={onTipoEntregaChange}
        onPaymentMethodChange={onPaymentMethodChange}
        onTransactionIdChange={onTransactionIdChange}
        cityZones={cityZones}
        bodegas={bodegas}
        isLoadingBodegas={isLoadingBodegas}
        storeConfigs={storeConfigs}
        isLoadingStoreConfigs={isLoadingStoreConfigs}
      />
    </motion.div>
  );
};
