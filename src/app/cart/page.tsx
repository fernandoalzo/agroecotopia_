"use client";

import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft, Leaf, Tag } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";
import { calculateDiscountedPrice } from "@/utils/promotions";
import { useEffect, useState } from "react";

const CartContent = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { t, language } = useLanguage();
  const { status } = useSession();
  const router = useRouter();
  const [calculatedTaxes, setCalculatedTaxes] = useState<number>(0);
  const [taxBreakdown, setTaxBreakdown] = useState<any[]>([]);

  useEffect(() => {
    const fetchTaxes = async () => {
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
    };

    if (cart.length > 0) {
      fetchTaxes();
    } else {
      setCalculatedTaxes(0);
      setTaxBreakdown([]);
    }
  }, [cart]);

  if (cart.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative rounded-full bg-primary/10 p-10 shadow-inner border border-primary/20">
            <motion.div
              className="text-primary"
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <ShoppingCart className="h-16 w-16 drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
            </motion.div>
          </div>
        </div>
        <h2 className="font-display text-3xl font-black mb-3 text-foreground">{t.cart.empty}</h2>
        <p className="text-muted-foreground mb-10 max-w-sm text-balance leading-relaxed">
          {t.cart.emptyCartPrompt}
        </p>
        <Link href="/products">
          <Button size="lg" className="rounded-full px-10 h-14 font-display font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.05] transition-transform active:scale-95 text-[#fefce8]">
            {t.cart.viewProducts}
          </Button>
        </Link>
      </motion.div>
    );
  }

  // Format total as currency string safely
  const formattedTotal = new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
    style: "currency",
    currency: language === 'es' ? "COP" : "USD",
    maximumFractionDigits: 0,
  }).format(totalPrice);

  const handleCompleteOrder = () => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
      return;
    }

    router.push("/checkout");
  };

  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <AnimatePresence mode="popLayout">
          {cart.map((item) => {
            const productTranslation = t.products.items[item.product.id!] || {
              name: item.product.name,
              description: item.product.description,
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
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 py-6 border-b border-border/60 last:border-0 relative"
              >
                {/* Item Image */}
                <div className="h-28 w-28 shrink-0 bg-secondary/30 rounded-xl flex items-center justify-center text-4xl relative overflow-hidden border border-border/40">
                  {hasDiscount && (
                    <div className="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 z-10 rounded-br-xl shadow-sm">
                      Oferta
                    </div>
                  )}
                  {item.product.images && item.product.images.length > 0 && item.product.images[0]?.trim() !== "" ? (
                    <Image
                      src={item.product.images[0]}
                      alt={productTranslation.name}
                      fill
                      sizes="112px"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span>{item.product.emoji || "📦"}</span>
                  )}
                </div>

                {/* Item Info */}
                <div className="flex-1 flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-display font-medium text-lg text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-2">
                        {productTranslation.name}
                      </h3>
                      <p className="text-xs text-green-600 mt-1.5 font-medium flex items-center gap-1">
                        {t.products.available || "En stock"}
                      </p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider shrink-0 bg-secondary/50 px-2 py-1 rounded-md border border-border/50">
                          <Tag className="w-3 h-3" />
                          {item.product.categories.map((c: any) => c.name).join(", ")}
                        </div>
                      </div>
                    </div>

                    {/* Price Section */}
                    <div className="text-left sm:text-right flex flex-col sm:items-end mt-2 sm:mt-0">
                      {hasDiscount ? (
                        <>
                          <span className="text-xl sm:text-2xl font-black text-red-600 font-mono tracking-tight">
                            {formatPrice(finalPrice)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through font-mono">
                            {formatPrice(item.product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl sm:text-2xl font-black text-foreground font-mono tracking-tight">
                          {formatPrice(item.product.price)}
                        </span>
                      )}
                      {item.product.unidad && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                          / {item.product.unidad}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Quantity & Remove) */}
                  <div className="flex items-center gap-4 sm:gap-6 mt-6 sm:mt-auto pt-2">
                    <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.product.id!, item.quantity - 1)}
                        className="p-2.5 hover:bg-secondary/80 active:bg-secondary transition-colors focus-visible:outline-none"
                      >
                        <Minus className="w-3.5 h-3.5 text-foreground/70" />
                      </button>
                      <span className="w-10 text-center font-mono font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id!, item.quantity + 1)}
                        className="p-2.5 hover:bg-secondary/80 active:bg-secondary transition-colors focus-visible:outline-none"
                      >
                        <Plus className="w-3.5 h-3.5 text-foreground/70" />
                      </button>
                    </div>
                    
                    <div className="h-5 w-px bg-border/80"></div>
                    
                    <button
                      onClick={() => removeFromCart(item.product.id!)}
                      className="text-sm font-medium text-foreground/60 hover:text-destructive hover:underline transition-all flex items-center gap-1.5"
                      aria-label={t.cart.remove}
                    >
                      {t.cart.remove}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Agregar mas productos button */}
        <div className="pt-8 pb-4">
          <Link href="/products" className="block w-full group relative">
            {/* Animated Glow Background */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-green-400/30 to-primary/30 rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            {/* Button Surface */}
            <Button
              size="lg"
              variant="outline"
              className="relative w-full rounded-2xl py-8 font-display font-black text-lg bg-card/80 backdrop-blur-xl border-2 border-primary/20 shadow-lg overflow-hidden flex items-center justify-center transition-all duration-500 group-hover:border-primary group-hover:shadow-[0_0_30px_rgba(var(--primary),0.15)] hover:scale-[1.01] active:scale-[0.98]"
            >
              {/* Shine effect overlay */}
              <div className="absolute inset-0 -translate-x-[150%] skew-x-12 bg-gradient-to-r from-transparent via-primary/10 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary group-hover:shadow-md transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  <ShoppingCart className="w-5 h-5 text-primary group-hover:text-[#fefce8] transition-colors duration-500" />
                </div>
                <span className="tracking-wide text-foreground group-hover:text-primary transition-colors duration-500">
                  Agregar mas productos
                </span>
                <div className="overflow-hidden flex items-center">
                  <ArrowLeft className="w-5 h-5 -ml-10 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 group-hover:ml-0 rotate-180 text-primary" />
                </div>
              </div>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 pt-2">
          <div className="mb-6 border-b-2 border-foreground/10 pb-4">
            <h3 className="font-display text-2xl font-black uppercase tracking-widest text-foreground">{t.cart.orderSummary}</h3>
          </div>

          <div className="space-y-4 font-mono text-sm text-muted-foreground mb-6">
            <div className="flex justify-between items-end">
              <span className="uppercase tracking-wider">{t.cart.subtotal}</span>
              <span className="text-base font-medium text-foreground">{formattedTotal}</span>
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
              <span className="font-medium text-primary">{t.cart.toCalculate}</span>
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
              }).format(totalPrice + calculatedTaxes)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-right mb-8">
            {t.products.taxesIncluded}
          </p>

          <div className="relative group w-full mt-4">
            {/* Animated Glow Background */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-green-400/30 to-primary/30 rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            {/* Button Surface */}
            <Button
              onClick={handleCompleteOrder}
              size="lg"
              variant="outline"
              className="relative w-full rounded-2xl py-8 font-display font-black text-lg bg-card/80 backdrop-blur-xl border-2 border-primary/20 shadow-lg overflow-hidden flex items-center justify-center transition-all duration-500 group-hover:border-primary group-hover:shadow-[0_0_30px_rgba(var(--primary),0.15)] hover:scale-[1.01] active:scale-[0.98]"
            >
              {/* Shine effect overlay */}
              <div className="absolute inset-0 -translate-x-[150%] skew-x-12 bg-gradient-to-r from-transparent via-primary/10 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              
              <div className="flex items-center gap-4 relative z-10">
                <span className="tracking-wide text-foreground group-hover:text-primary transition-colors duration-500">
                  {t.cart.completeOrder}
                </span>
                <div className="overflow-hidden flex items-center">
                  <ArrowLeft className="w-5 h-5 -ml-10 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 group-hover:ml-0 rotate-180 text-primary" />
                </div>
              </div>
            </Button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-6 flex items-center justify-center gap-1.5 uppercase tracking-widest font-mono">
            <Leaf className="w-3 h-3 text-primary" /> {t.cart.securePayment}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function CartPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4 group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              {t.cart.keepShopping}
            </Link>
            <h1 className="font-display text-3xl font-black md:text-5xl text-foreground">
              {t.cart.title.split(' ')[0]} <span className="text-primary">{t.cart.title.split(' ').slice(1).join(' ')}</span>
            </h1>
          </div>

          <CartContent />
        </div>
      </main>
      <Footer />
    </div>
  );
}
