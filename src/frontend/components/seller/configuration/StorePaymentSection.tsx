"use client";

import React, { useState, useEffect } from "react";
import { Store as StoreType } from "@/types/store";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStoreConfigSchema, StoreConfigFormValues } from "../schemas/store-config.schema";
import { useLanguage } from "@/frontend/context/LanguageContext";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { AdvisorPaymentMethod } from "./payment-methods/AdvisorPaymentMethod";
import { MercadoPagoPaymentMethod } from "./payment-methods/MercadoPagoPaymentMethod";

import { CryptoPaymentMethod } from "./payment-methods/CryptoPaymentMethod";
import logger from "@/utils/logger";

const log = logger.child();

interface StorePaymentSectionProps {
  store: StoreType;
  actions: any;
}

export function StorePaymentSection({ store, actions }: StorePaymentSectionProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCryptos, setAvailableCryptos] = useState<any[]>([]);

  useEffect(() => {
    actions.getCryptocurrencies().then(setAvailableCryptos).catch((err: unknown) => log.error("Error fetching cryptos:", err));
  }, []);

  // Parse config
  const defaultConfig = store.config?.paymentMethods || {};

  const { control, handleSubmit, watch, formState: { errors } } = useForm<StoreConfigFormValues>({
    resolver: zodResolver(createStoreConfigSchema(t)) as any,
    defaultValues: {
      paymentMethods: {
        advisor: {
          enabled: defaultConfig.advisor?.enabled || false,
          instructions: defaultConfig.advisor?.instructions || "",
        },
        mercadopago: {
          enabled: defaultConfig.mercadopago?.enabled || false,
          accessToken: defaultConfig.mercadopago?.accessToken || "",
          secret: defaultConfig.mercadopago?.secret || "",
        },
        crypto: {
          enabled: defaultConfig.crypto?.enabled || false,
          currencies: defaultConfig.crypto?.currencies || [],
        },
      },
    },
  });

  const isAdvisorEnabled = watch("paymentMethods.advisor.enabled") ?? false;
  const isMercadoPagoEnabled = watch("paymentMethods.mercadopago.enabled") ?? false;
  const isCryptoEnabled = watch("paymentMethods.crypto.enabled") ?? false;

  const onSubmit = async (data: StoreConfigFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Send the entire JSON config to the server action
      const res = await actions.updateStoreConfig(store.id, { paymentMethods: data.paymentMethods });
      if (res && res.success) {
        toast.success("Configuración de pagos guardada exitosamente");
      } else {
        toast.error("Error al guardar la configuración");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado al guardar la configuración");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-foreground font-display">Métodos de Pago</h3>
        <p className="text-sm text-muted-foreground mt-1">Configura las opciones de pago disponibles en tu tienda.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, (errs) => log.debug("Form errors:", errs))} className="space-y-6">
        
        {/* Coordinar con el Asesor */}
        <AdvisorPaymentMethod control={control} isEnabled={isAdvisorEnabled} />

        {/* MercadoPago */}
        <MercadoPagoPaymentMethod control={control} isEnabled={isMercadoPagoEnabled} />

        {/* Criptomonedas */}
        <CryptoPaymentMethod control={control} isEnabled={isCryptoEnabled} availableCryptos={availableCryptos} />

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
