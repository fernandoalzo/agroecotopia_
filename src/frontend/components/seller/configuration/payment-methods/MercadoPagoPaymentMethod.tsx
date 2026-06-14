import React, { useState } from "react";
import { Control, Controller } from "react-hook-form";
import { StoreConfigFormValues } from "../../schemas/store-config.schema";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, KeyRound, Settings2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MercadoPagoPaymentMethodProps {
  control: Control<StoreConfigFormValues>;
  isEnabled: boolean;
}

export function MercadoPagoPaymentMethod({ control, isEnabled }: MercadoPagoPaymentMethodProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      initial={false}
      animate={{ 
        borderColor: isEnabled ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))",
        backgroundColor: isEnabled ? "hsl(var(--primary) / 0.02)" : "hsl(var(--card))"
      }}
      className="overflow-hidden border-2 rounded-2xl transition-colors duration-300 shadow-sm hover:shadow-md"
    >
      <div 
        className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300",
            isEnabled ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"
          )}>
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
              Mercado Pago
              {isEnabled && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                  Activo
                </span>
              )}
            </h4>
            <p className="text-sm text-muted-foreground font-medium">
              Procesa pagos automáticamente con tarjetas, PSE o saldo en cuenta.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <Controller
            control={control}
            name="paymentMethods.mercadopago.enabled"
            render={({ field }) => (
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={field.value} 
                  onChange={(e) => {
                    field.onChange(e);
                    if (e.target.checked) setIsExpanded(true);
                  }} 
                />
                <div className="w-14 h-7 bg-muted/80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
              </label>
            )}
          />
          <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2">
              <div className="p-5 rounded-xl bg-background/50 border border-border/50 space-y-5">
                <div className="flex items-center gap-2 mb-2 text-foreground/80">
                  <Settings2 className="w-4 h-4 text-blue-600" />
                  <h5 className="font-semibold text-sm">Credenciales de Producción</h5>
                </div>
                
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                      Access Token
                    </label>
                    <p className="text-xs text-muted-foreground mb-2 h-8">
                      Tu token de acceso privado. Comienza con <code className="bg-muted px-1 py-0.5 rounded text-[10px]">APP_USR-</code>
                    </p>
                    <Controller
                      control={control}
                      name="paymentMethods.mercadopago.accessToken"
                      render={({ field }) => (
                        <input
                          {...field}
                          type="password"
                          className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                          placeholder="APP_USR-..."
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                      Webhook Secret
                    </label>
                    <p className="text-xs text-muted-foreground mb-2 h-8">
                      Secreto para validar notificaciones de pago seguras.
                    </p>
                    <Controller
                      control={control}
                      name="paymentMethods.mercadopago.secret"
                      render={({ field }) => (
                        <input
                          {...field}
                          type="password"
                          className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                          placeholder="Ingresa el secret del webhook..."
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
