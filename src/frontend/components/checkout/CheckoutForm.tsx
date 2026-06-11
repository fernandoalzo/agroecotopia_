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
import { User, Mail, Phone, MapPin, Building2, FileText, Truck, Warehouse } from "lucide-react";
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
  cityZones: { name: string; cities: string[] }[];
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSubmit, defaultValues, onCityChange, onTipoEntregaChange, cityZones }) => {
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
    },
  });

  const watchCity = form.watch("city");
  const watchTipoEntrega = form.watch("tipoEntrega");

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
      <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-foreground/80 font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
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
                <FormLabel className="text-foreground/80 font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-foreground/80 font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
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
                <FormLabel className="text-foreground/80 font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
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
        <div className="pt-4 border-t border-border/50">
          <FormField
            control={form.control}
            name="tipoEntrega"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-xl font-display font-black text-foreground">
                  Tipo de entrega
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
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
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address - only for ENVIO */}
        {watchTipoEntrega === "ENVIO" && (
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-foreground/80 font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
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
                <FormLabel className="text-foreground/80 font-semibold flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-primary" />
                  Bodega de recogida
                </FormLabel>
                <BodegaSelect
                  city={watchCity}
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Selecciona una bodega"
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
              <FormLabel className="text-foreground/80 font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
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
        <div className="pt-6 border-t border-border/50">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-xl font-display font-black text-foreground">
                  {t.checkout.paymentMethod}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      return (
                        <FormItem key={method.id}>
                          <FormControl>
                            <RadioGroupItem value={method.id} className="sr-only" />
                          </FormControl>
                          <FormLabel className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-primary/5 shadow-sm",
                            field.value === method.id ? "border-primary bg-primary/10" : "border-border/50",
                            method.isMute && "opacity-60"
                          )}>
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", method.bgColor)}>
                              <Icon className="w-6 h-6" style={{ color: method.color }} />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-sm">{t.checkout[method.labelKey]}</p>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider italic">
                                {method.isMute ? t.checkout.paymentMuteNote : t.cart.completeOrder}
                              </p>
                            </div>
                          </FormLabel>
                        </FormItem>
                      );
                    })}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
};
