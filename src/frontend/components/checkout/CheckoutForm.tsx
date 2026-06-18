"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckoutSchema, CheckoutValues } from "@/lib/validations/checkout.schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/LanguageContext";
import { User, Mail, Phone, MapPin, Building2, FileText, Truck, Warehouse, Bitcoin, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/utils/PaymentsMethods";
import { CitySelect } from "./CitySelect";
import { BodegaSelect } from "./BodegaSelect";

interface CheckoutFormProps {
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

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSubmit, defaultValues, onCityChange, onTipoEntregaChange, onPaymentMethodChange, onTransactionIdChange, cityZones, bodegas, isLoadingBodegas, storeConfigs, isLoadingStoreConfigs }) => {
  const { t } = useLanguage();

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      fullName: defaultValues?.fullName || "",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone || "",
      tipoEntrega: "ENVIO",
      address: defaultValues?.address || "",
      city: defaultValues?.city || "",
      bodegaId: "",
      notes: defaultValues?.notes || "",
      paymentMethod: (defaultValues?.paymentMethod as any) || "advisor",
      transactionId: "",
    },
  });

  const watchCity = form.watch("city");
  const watchTipoEntrega = form.watch("tipoEntrega");
  const watchPaymentMethod = form.watch("paymentMethod");
  const watchTransactionId = form.watch("transactionId");

  React.useEffect(() => {
    if (onCityChange) {
      onCityChange(watchCity || "");
    }
  }, [watchCity, onCityChange]);

  React.useEffect(() => {
    if (onTipoEntregaChange) {
      onTipoEntregaChange(watchTipoEntrega);
    }
  }, [watchTipoEntrega, onTipoEntregaChange]);

  React.useEffect(() => {
    if (onPaymentMethodChange) {
      onPaymentMethodChange(watchPaymentMethod || "");
    }
  }, [watchPaymentMethod, onPaymentMethodChange]);

  React.useEffect(() => {
    if (onTransactionIdChange) {
      onTransactionIdChange(watchTransactionId || "");
    }
  }, [watchTransactionId, onTransactionIdChange]);

  // Reset bodegaId when city or tipoEntrega changes
  React.useEffect(() => {
    if (watchTipoEntrega === "ENVIO") {
      form.setValue("bodegaId", "");
    }
  }, [watchTipoEntrega, form]);

  React.useEffect(() => {
    if (watchCity) {
      form.setValue("bodegaId", "");
    }
  }, [watchCity, form]);

  return (
    <Form {...form}>
      <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary" />
                  {t.checkout.fullName}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 transition-all" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  {t.checkout.email}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="john@example.com" 
                    className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 transition-all" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  {t.checkout.phone}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+57 300 000 0000" 
                    className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 transition-all" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  {t.checkout.city}
                </FormLabel>
                <CitySelect
                  zones={cityZones}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecciona una ciudad"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Delivery Type */}
        <div className="pt-8 mt-4 border-t-2 border-dashed border-foreground/20">
          <FormField
            control={form.control}
            name="tipoEntrega"
            render={({ field }) => {
              const isDeliveryEnabled = storeConfigs?.every(sc => {
                const sm = sc.config?.shippingMethods as any;
                if (!sm || !sm.delivery) return true;
                return sm.delivery.enabled !== false;
              }) ?? true;

              const isPickupEnabled = storeConfigs?.every(sc => {
                const sm = sc.config?.shippingMethods as any;
                if (!sm || !sm.pickup) return true;
                return sm.pickup.enabled !== false;
              }) ?? true;

              // Auto-select logic if current value is disabled
              React.useEffect(() => {
                if (field.value === "ENVIO" && !isDeliveryEnabled && isPickupEnabled) {
                  form.setValue("tipoEntrega", "RECOJO_EN_BODEGA");
                } else if (field.value === "RECOJO_EN_BODEGA" && !isPickupEnabled && isDeliveryEnabled) {
                  form.setValue("tipoEntrega", "ENVIO");
                }
              }, [isDeliveryEnabled, isPickupEnabled, field.value, form]);

              return (
              <FormItem className="space-y-6">
                <FormLabel className="text-lg font-display font-black uppercase tracking-widest text-foreground">
                  Tipo de entrega
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {isDeliveryEnabled && (
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem value="ENVIO" className="sr-only" />
                      </FormControl>
                      <FormLabel className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-primary/5 shadow-sm",
                        field.value === "ENVIO" ? "border-primary bg-primary/10" : "border-border/50"
                      )}>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">Envío a domicilio</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider italic">
                            Recibe en tu dirección
                          </p>
                        </div>
                      </FormLabel>
                    </FormItem>
                    )}

                    {isPickupEnabled && (
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem value="RECOJO_EN_BODEGA" className="sr-only" />
                      </FormControl>
                      <FormLabel className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-primary/5 shadow-sm",
                        field.value === "RECOJO_EN_BODEGA" ? "border-primary bg-primary/10" : "border-border/50"
                      )}>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Warehouse className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">Recoger en bodega</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider italic">
                            Sin costo de envío
                          </p>
                        </div>
                      </FormLabel>
                    </FormItem>
                    )}
                  </RadioGroup>
                </FormControl>
                {(!isDeliveryEnabled && !isPickupEnabled) && (
                  <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-xl border border-destructive/20 mt-4">
                    No hay métodos de entrega disponibles para los productos de tu carrito.
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}}
          />
        </div>

        {/* Address - only for ENVIO */}
        {watchTipoEntrega === "ENVIO" && (
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {t.checkout.address}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Calle 123 #45-67" 
                    className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 transition-all" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Bodega Select - only for RECOJO_EN_BODEGA */}
        {watchTipoEntrega === "RECOJO_EN_BODEGA" && (
          <FormField
            control={form.control}
            name="bodegaId"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Warehouse className="w-3.5 h-3.5 text-primary" />
                  Bodega de recogida
                </FormLabel>
                <BodegaSelect
                  city={watchCity}
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Selecciona una bodega"
                  bodegas={bodegas}
                  isLoading={isLoadingBodegas}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                {t.checkout.notes}
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t.checkout.notesPlaceholder}
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl min-h-[100px] transition-all resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Method Section */}
        <div className="pt-8 mt-4 border-t-2 border-dashed border-foreground/20">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem className="space-y-6">
                <FormLabel className="text-lg font-display font-black uppercase tracking-widest text-foreground">
                  {t.checkout.paymentMethod}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {isLoadingStoreConfigs ? (
                      <div className="col-span-1 md:col-span-2 text-sm text-muted-foreground p-4 bg-secondary/30 rounded-xl border border-border animate-pulse">
                        Cargando métodos de pago disponibles...
                      </div>
                    ) : (
                      PAYMENT_METHODS.filter(method => {
                        if (method.isMute) return false;
                        if (!storeConfigs || storeConfigs.length === 0) return false;
                        return storeConfigs.every(sc => {
                          const methods = sc.config?.paymentMethods as any;
                          if (!methods) return false;
                          return methods[method.id]?.enabled === true;
                        });
                      }).map((method) => {
                        const Icon = method.icon;
                        return (
                          <FormItem key={method.id}>
                            <FormControl>
                              <RadioGroupItem value={method.id} className="sr-only" />
                            </FormControl>
                            <FormLabel className={cn(
                              "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-primary/5 shadow-sm",
                              field.value === method.id ? "border-primary bg-primary/10" : "border-border/50"
                            )}>
                              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", method.bgColor)}>
                                <Icon className="w-6 h-6" style={{ color: method.color }} />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-sm">{t.checkout[method.labelKey]}</p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider italic">
                                  {t.cart.completeOrder}
                                </p>
                              </div>
                            </FormLabel>
                          </FormItem>
                        );
                      })
                    )}
                  </RadioGroup>
                </FormControl>
                {!isLoadingStoreConfigs && storeConfigs && storeConfigs.length > 0 && PAYMENT_METHODS.filter(method => {
                  if (method.isMute) return false;
                  return storeConfigs.every(sc => {
                    const methods = sc.config?.paymentMethods as any;
                    if (!methods) return false;
                    return methods[method.id]?.enabled === true;
                  });
                }).length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-sm text-destructive p-4 bg-destructive/10 rounded-xl border border-destructive/20 mt-4">
                    No hay métodos de pago disponibles en común para los productos de tu carrito. Por favor, contacta a soporte o al vendedor.
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("paymentMethod") === "crypto" && (
            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem className="space-y-2 mt-6">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Bitcoin className="w-3.5 h-3.5 text-orange-500" />
                    ID de Transacción (TXID)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="0x... o el TXID de tu transacción blockchain"
                        className="bg-background/50 border-border/50 focus:border-orange-500/50 focus:ring-orange-500/20 rounded-xl h-12 transition-all font-mono text-sm pr-10"
                        {...field}
                      />
                      {field.value && (
                        <button
                          type="button"
                          onClick={() => form.setValue("transactionId", "", { shouldValidate: true })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                          aria-label="Limpiar TXID"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground">
                    Ingresa el TXID de tu pago con criptomonedas para que el asesor lo verifique.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </form>
    </Form>
  );
};
