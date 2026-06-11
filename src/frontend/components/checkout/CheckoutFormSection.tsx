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
  cityZones: { name: string; cities: string[] }[];
}

export const CheckoutFormSection: React.FC<CheckoutFormSectionProps> = ({ 
  t, 
  onSubmit, 
  defaultValues,
  onCityChange,
  onTipoEntregaChange,
  cityZones,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="lg:col-span-7"
    >
      <div className="bg-card/50 backdrop-blur-sm border border-border p-8 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-black text-foreground">
            {t.checkout.shippingInfo}
          </h2>
        </div>
        
        <CheckoutForm 
          onSubmit={onSubmit} 
          defaultValues={defaultValues}
          onCityChange={onCityChange}
          onTipoEntregaChange={onTipoEntregaChange}
          cityZones={cityZones}
        />
      </div>
    </motion.div>
  );
};
