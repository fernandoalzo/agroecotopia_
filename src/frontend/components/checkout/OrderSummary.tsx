"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Leaf, ShoppingBag, CreditCard, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import { config } from "@/config/config";
import { calculateDiscountedPrice } from "@/utils/promotions";

interface OrderSummaryProps {
  isSubmitting?: boolean;
  destinationCity?: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ isSubmitting, destinationCity }) => {
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
        console.error('Error fetching taxes:', err);
      }

      // Only fetch shipping when a city is selected
      if (destinationCity && destinationCity.trim()) {
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
          console.error('Error fetching shipping:', err);
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
      <div className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
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
            <p className="text-xs font-bold text-muted-foreground transition-colors hover:text-primary">
              {t.checkout.invoiceNumber} <span className="text-foreground">#{orderId}</span>
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {t.checkout.invoiceDate}: {today}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 py-3 px-4 bg-background/50 rounded-2xl border border-primary/10 shadow-sm backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black text-primary/70 uppercase tracking-wider mb-0.5">
              {t.cart.orderSummary}
            </p>
            <p className="text-sm font-bold text-foreground">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="p-8 flex-1 space-y-6 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
        <div className="space-y-4">
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
              <div key={item.product.id} className="group flex justify-between items-center py-2 transition-all hover:translate-x-1">
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {productTranslation.name}
                  </p>
                  {hasDiscount ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                        {item.quantity} x {formatPrice(item.product.price)}
                      </span>
                      <span className="font-bold text-red-600">
                        {item.quantity} x {formatPrice(finalPrice)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground font-medium">
                      {item.quantity} x {formatPrice(item.product.price)}
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  {hasDiscount ? (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-muted-foreground line-through decoration-muted-foreground/50">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                      <p className="text-sm font-black text-red-600">
                        {formatPrice(finalPrice * item.quantity)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-black text-foreground">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice Totals */}
      <div className="p-8 bg-secondary/30 border-t border-border mt-auto">
        <div className="space-y-3 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">{t.cart.subtotal}</span>
            <span className="text-foreground font-bold">{formattedSubtotal}</span>
          </div>
          {taxBreakdown.length > 0 ? (
            taxBreakdown.map((tax, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">{tax.name} ({tax.percentage}%)</span>
                <span className="text-foreground font-bold">
                  {new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
                    style: "currency",
                    currency: language === 'es' ? "COP" : "USD",
                    maximumFractionDigits: 0,
                  }).format(tax.amount)}
                </span>
              </div>
            ))
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">{t.cart.taxes}</span>
              <span className="text-foreground font-bold">
                {new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
                  style: "currency",
                  currency: language === 'es' ? "COP" : "USD",
                  maximumFractionDigits: 0,
                }).format(calculatedTaxes)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground font-medium">{t.cart.shipping}</span>
            {!destinationCity || !destinationCity.trim() ? (
              <span className="text-[10px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-tighter ring-1 ring-border">
                {t.cart.toCalculate}
              </span>
            ) : shippingCost > 0 ? (
              <span className="text-foreground font-bold">
                {new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
                  style: "currency",
                  currency: language === 'es' ? "COP" : "USD",
                  maximumFractionDigits: 0,
                }).format(shippingCost)}
              </span>
            ) : (
              <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter ring-1 ring-primary/20">
                {t.cart.toCalculate}
              </span>
            )}
          </div>
          <Separator className="bg-primary/10 h-0.5" />
          <div className="flex justify-between items-end pt-2">
            <span className="text-base font-black text-foreground uppercase tracking-tight">{t.cart.total}</span>
            <div className="text-right">
              <span className="block text-3xl font-display font-black text-primary leading-none">
                {new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
                  style: "currency",
                  currency: language === 'es' ? "COP" : "USD",
                  maximumFractionDigits: 0,
                }).format(subtotal + calculatedTaxes + shippingCost)}
              </span>
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1 block">
                {t.products.taxesIncluded}
              </span>
            </div>
          </div>
        </div>

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
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
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
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl font-display font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6" />
              <span>{t.checkout.confirmOrder}</span>
            </div>
          </Button>
        )}
        
        <p className="mt-4 text-center text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-2">
          <CreditCard className="w-3 h-3 text-primary opacity-60" />
          {t.cart.securePayment}
        </p>
      </div>
    </div>
  );
};
