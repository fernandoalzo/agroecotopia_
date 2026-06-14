import React, { useState } from "react";
import { Control, Controller } from "react-hook-form";
import { StoreConfigFormValues } from "../../schemas/store-config.schema";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Settings2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvisorPaymentMethodProps {
  control: Control<StoreConfigFormValues>;
  isEnabled: boolean;
}

export function AdvisorPaymentMethod({ control, isEnabled }: AdvisorPaymentMethodProps) {
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
            isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
              Coordinar con el Asesor
              {isEnabled && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                  Activo
                </span>
              )}
            </h4>
            <p className="text-sm text-muted-foreground font-medium">
              Permite a los clientes acordar el pago manualmente después del pedido.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <Controller
            control={control}
            name="paymentMethods.advisor.enabled"
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
                <div className="w-14 h-7 bg-muted/80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
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
              <div className="p-5 rounded-xl bg-background/50 border border-border/50 space-y-4">
                <div className="flex items-center gap-2 mb-2 text-foreground/80">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <h5 className="font-semibold text-sm">Configuración del Método</h5>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Instrucciones Adicionales (Opcional)
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Este mensaje se mostrará al cliente al seleccionar este método de pago.
                  </p>
                  <Controller
                    control={control}
                    name="paymentMethods.advisor.instructions"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={3}
                        className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-sm"
                        placeholder="Ej. Te contactaremos vía WhatsApp al finalizar para acordar el pago mediante transferencia bancaria o Nequi..."
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
