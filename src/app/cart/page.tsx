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

const CartContent = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { t, language } = useLanguage();
  const { status } = useSession();
  const router = useRouter();

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
            const productTranslation = t.products.items[item.product.slug] || {
              name: item.product.name,
              description: item.product.description,
              unit: item.product.unidad
            };

            return (
              <motion.div 
                key={item.product.slug} 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm items-center relative overflow-hidden transition-all hover:shadow-md"
              >
                {/* Item Image */}
                <div className="h-20 w-20 shrink-0 md:h-24 md:w-24 bg-primary/5 rounded-xl flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
                  {item.product.images && item.product.images.length > 0 ? (
                    <Image 
                      src={item.product.images[0]} 
                      alt={productTranslation.name} 
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <span>{item.product.emoji}</span>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-display font-bold text-sm md:text-base leading-tight mb-1">{productTranslation.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 text-primary/70 uppercase font-black text-[8px] tracking-widest shrink-0 bg-primary/5 px-1.5 py-0.5 rounded-sm border border-primary/10">
                      <Tag className="w-2.5 h-2.5" />
                      {item.product.categoria}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {formatPrice(item.product.price)} / ud
                    </span>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-secondary rounded-full overflow-hidden border border-border/50">
                      <button 
                        onClick={() => updateQuantity(item.product.slug, item.quantity - 1)}
                        className="p-1 px-3 hover:bg-black/5 active:bg-black/10 transition-colors rounded-l-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.slug, item.quantity + 1)}
                        className="p-1 px-3 hover:bg-black/5 active:bg-black/10 transition-colors rounded-r-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove Button & Total Price */}
                <div className="flex flex-col items-end gap-2 shrink-0 pr-2">
                  <button 
                    onClick={() => removeFromCart(item.product.slug)}
                    className="text-muted-foreground/60 hover:text-destructive transition-colors p-2 rounded-full hover:bg-destructive/10"
                    aria-label={t.cart.remove}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
         </AnimatePresence>
         
          {/* Agregar mas productos button */}
          <div className="pt-6">
            <Link href="/products">
              <Button 
                size="lg"
                className="w-full rounded-2xl py-6 font-display font-bold text-lg hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20 text-[#fefce8] flex items-center justify-center gap-3"
              >
                <ShoppingCart className="w-4 h-4" />
                Agregar mas productos
              </Button>
            </Link>
          </div>
       </div>
 
       {/* Summary Sidebar */}
       <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-xl">
          <h3 className="font-display text-xl font-bold mb-6">{t.cart.orderSummary}</h3>
          
          <div className="space-y-4 font-body text-sm text-muted-foreground mb-6">
            <div className="flex justify-between">
              <span>{t.cart.subtotal}</span>
              <span className="font-medium text-foreground">{formattedTotal}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.cart.shipping}</span>
              <span className="font-medium text-primary">{t.cart.toCalculate}</span>
            </div>
          </div>
          
          <div className="h-px bg-border w-full mb-6" />
          
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-foreground">{t.cart.total}</span>
              <span className="font-display text-2xl font-black text-primary">{formattedTotal}</span>
            </div>
 
            <Button 
              onClick={handleCompleteOrder}
              className="w-full rounded-2xl py-6 font-display font-bold text-lg hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20 text-[#fefce8]"
            >
              {t.cart.completeOrder}
            </Button>
          <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
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
