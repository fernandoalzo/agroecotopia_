"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Leaf, ShoppingBag, CreditCard, Clock, CheckCircle2, Bitcoin } from "lucide-react";
import { motion } from "framer-motion";

import { config } from "@/config/config";
import { calculateDiscountedPrice } from "@/utils/promotions";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/checkout/OrderSummary.tsx");

interface OrderSummaryProps {
  isSubmitting?: boolean;
  destinationCity?: string;
  tipoEntrega?: string;
  isConfirmDisabled?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ isSubmitting, destinationCity, tipoEntrega, isConfirmDisabled }) => {
  const { cart, totalPrice } = useCart();
  const { t, language } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);
  const [calculatedTaxes, setCalculatedTaxes] = useState<number>(0);
  const [taxBreakdown, setTaxBreakdown] = useState<any[]>([]);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingBreakdown, setShippingBreakdown] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchTaxesAndShipping = async () => {
      const cartItems = cart.map(item => {
        const discountedPrice = calculateDiscountedPrice(
          item.product.price,
          (item.product as any).promotions,
          (item.product as any).store?.promotions
        );
        const finalPrice = discountedPrice !== null ? discountedPrice : item.product.price;
        return {
          storeId: item.product.storeId || (item.product as any).store?.id || "",
          subtotal: finalPrice * item.quantity
        };
      });

      try {
        const res = await fetch('/api/calculate-taxes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItems }),
        });
        const data = await res.json();
        if (data.success) {
          setCalculatedTaxes(data.taxes);
          setTaxBreakdown(data.taxBreakdown || []);
        }
      } catch (err) {
        log.error('Error fetching taxes:', err);
      }

      // Only fetch shipping when a city is selected and delivery type is ENVIO
      if (tipoEntrega !== "RECOJO_EN_BODEGA" && destinationCity && destinationCity.trim()) {
        try {
          const shipRes = await fetch('/api/calculate-shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems, destinationCity }),
          });
          const shipData = await shipRes.json();
          if (shipData.success) {
            setShippingCost(shipData.totalShippingCost);
            setShippingBreakdown(shipData.storeBreakdown || []);
          }
        } catch (err) {
            log.error('Error fetching shipping:', err);
        }
      } else {
        setShippingCost(0);
        setShippingBreakdown([]);
      }
    };

    if (cart.length > 0) {
      fetchTaxesAndShipping();
    } else {
      setCalculatedTaxes(0);
      setTaxBreakdown([]);
      setShippingCost(0);
      setShippingBreakdown([]);
    }
  }, [cart, destinationCity]);

  const formattedTotal = new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
    style: "currency",
    currency: language === 'es' ? "COP" : "USD",
    maximumFractionDigits: 0,
  }).format(totalPrice);

  const subtotal = totalPrice; // Assuming no tax/shipping for now as per current cart
  const formattedSubtotal = new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
    style: "currency",
    currency: language === 'es' ? "COP" : "USD",
    maximumFractionDigits: 0,
  }).format(subtotal);

  const today = new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const orderId = Math.floor(Math.random() * 900000) + 100000;

  return (
    <div className="bg-card border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col h-full ring-1 ring-primary/5">
      {/* Invoice Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-display font-black text-xl mb-1">
              <Leaf className="w-6 h-6" />
              <span>{config.app.name.toUpperCase()}</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              {t.checkout.invoiceTitle}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono font-bold text-muted-foreground">
              {t.checkout.invoiceNumber} <span className="text-foreground">#{orderId}</span>
            </p>
            <p className="text-xs font-mono font-medium text-muted-foreground">
              {t.checkout.invoiceDate}: {today}
            </p>
          </div>
        </div>

        {/* Order Summary Label */}
        <div className="flex justify-between items-center pt-5 mt-2 border-t border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs font-black text-foreground uppercase tracking-widest">
              {t.cart.orderSummary}
            </p>
          </div>
          <p className="text-sm font-mono font-bold text-muted-foreground">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="px-5 sm:px-6 py-4 flex-1 space-y-1 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
        {cart.map((item) => {
          const productTranslation = t.products.items[item.product.id!] || {
            name: item.product.name,
            unit: item.product.unidad
          };

          const discountedPrice = calculateDiscountedPrice(
            item.product.price,
            (item.product as any).promotions,
            (item.product as any).store?.promotions
          );
          const hasDiscount = discountedPrice !== null;
          const finalPrice = hasDiscount ? discountedPrice : item.product.price;

          return (
            <div key={item.product.id} className="group flex justify-between items-center py-3 border-b border-border/40 last:border-0 transition-all">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {productTranslation.name}
                </p>
                {hasDiscount ? (
                  <div className="flex items-center gap-1.5 text-xs mt-0.5">
                    <span className="text-muted-foreground line-through decoration-muted-foreground/50 font-mono">
                      {item.quantity} x {formatPrice(item.product.price)}
                    </span>
                    <span className="font-bold text-red-600 font-mono">
                      {item.quantity} x {formatPrice(finalPrice)}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {item.quantity} x {formatPrice(item.product.price)}
                  </p>
                )}
              </div>
              <div className="text-right ml-4">
                {hasDiscount ? (
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-muted-foreground line-through decoration-muted-foreground/50 font-mono">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                    <p className="text-sm font-black text-red-600 font-mono">
                      {formatPrice(finalPrice * item.quantity)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-black text-foreground font-mono">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice Totals */}
      <div className="p-5 sm:p-6 bg-secondary/30 border-t border-border mt-auto rounded-b-3xl">
        <div className="space-y-4 font-mono text-sm text-muted-foreground mb-6">
          <div className="flex justify-between items-end">
            <span className="uppercase tracking-wider">{t.cart.subtotal}</span>
            <span className="text-base font-medium text-foreground">{formattedSubtotal}</span>
          </div>
          {taxBreakdown.length > 0 ? (
            taxBreakdown.map((tax, idx) => (
              <div key={idx} className="flex justify-between items-end">
                <span className="uppercase tracking-wider">{tax.name} ({tax.percentage}%)</span>
                <span className="text-base font-medium text-foreground">
                  {new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
                    style: "currency",
                    currency: language === 'es' ? "COP" : "USD",
                    maximumFractionDigits: 0,
                  }).format(tax.amount)}
                </span>
              </div>
            ))
          ) : (
            <div className="flex justify-between items-end">
              <span className="uppercase tracking-wider">{t.cart.taxes}</span>
              <span className="text-base font-medium text-foreground">
                {new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
                  style: "currency",
                  currency: language === 'es' ? "COP" : "USD",
                  maximumFractionDigits: 0,
                }).format(calculatedTaxes)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-end">
            <span className="uppercase tracking-wider">{t.cart.shipping}</span>
            {tipoEntrega === "RECOJO_EN_BODEGA" ? (
              <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-tighter ring-1 ring-emerald-500/20">
                Sin costo
              </span>
            ) : !destinationCity || !destinationCity.trim() ? (
              <span className="font-medium text-primary">
                {t.cart.toCalculate}
              </span>
            ) : shippingCost > 0 ? (
              <span className="text-base font-medium text-foreground">
                {new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
                  style: "currency",
                  currency: language === 'es' ? "COP" : "USD",
                  maximumFractionDigits: 0,
                }).format(shippingCost)}
              </span>
            ) : (
              <span className="font-medium text-primary">
                {t.cart.toCalculate}
              </span>
            )}
          </div>
        </div>

        <div className="border-t-2 border-dashed border-foreground/20 w-full mb-6" />

        <div className="flex justify-between items-end mb-1">
          <span className="font-black uppercase tracking-widest text-foreground font-display text-lg">{t.cart.total}</span>
          <span className="font-mono text-3xl font-black text-primary">
            {new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
              style: "currency",
              currency: language === 'es' ? "COP" : "USD",
              maximumFractionDigits: 0,
            }).format(subtotal + calculatedTaxes + shippingCost)}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-right mb-8">
          {t.products.taxesIncluded}
        </p>

        {isConfirmDisabled && !isSubmitting && (
          <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Bitcoin className="w-4 h-4 text-orange-500 shrink-0" />
            <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
              Ingresa un ID de transacción válido para completar tu pedido con criptomonedas.
            </p>
          </div>
        )}

        {showConfirm ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm font-bold text-center text-foreground px-4">
              {t.checkout.confirmQuestion}
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl font-bold border-primary/20 hover:bg-primary/5"
              >
                {t.checkout.confirmNo}
              </Button>
              <Button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || isConfirmDisabled}
                className={cn(
                  "flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all",
                  isConfirmDisabled
                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isSubmitting ? (
                  <Clock className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  t.checkout.confirmYes
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={isSubmitting || isConfirmDisabled}
            className={cn(
              "w-full h-14 rounded-2xl font-display font-black text-lg shadow-xl transition-all group relative overflow-hidden",
              isConfirmDisabled
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {!isConfirmDisabled && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
            )}
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6" />
              <span>{t.checkout.confirmOrder}</span>
            </div>
          </Button>
        )}

        <p className="mt-6 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 uppercase tracking-widest font-mono">
          <CreditCard className="w-3 h-3 text-primary opacity-60" />
          {t.cart.securePayment}
        </p>
      </div>
    </div>
  );
};
