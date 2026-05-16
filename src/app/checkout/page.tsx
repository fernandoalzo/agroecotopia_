"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { CheckoutFormSection } from "@/components/checkout/CheckoutFormSection";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { CheckoutValues } from "@/lib/validations/checkout.schema";
import { motion } from "framer-motion";
import { ArrowLeft, Truck, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { PAYMENT_METHODS, generateWhatsAppUrl } from "@/utils/PaymentsMethods";
import { placeOrderAction } from "@/backend/modules/orders";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { cart, totalPrice, clearCart } = useCart();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Protected route logic
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  // If cart is empty, redirect back to cart page
  useEffect(() => {
    if (cart.length === 0 && status === "authenticated") {
      router.push("/cart");
    }
  }, [cart.length, status, router]);

  if (status === "loading" || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const handleCheckoutSubmit = async (values: CheckoutValues) => {
    setIsSubmitting(true);
    
    try {
      const { toast } = await import("sonner");
      
      // 1. Create order in Database
      const orderData = {
        direccionEntrega: `${values.address}, ${values.city}`,
        notasCliente: values.notes,
        costoEnvio: 0, // Simplified for now
        impuestosPorcentaje: 19, // Standard in many regions, or 0 if included
        detalles: cart.map(item => ({
          productoId: item.product.id,
          cantidad: item.quantity,
          precioUnitario: item.product.price,
          unidadMedida: item.product.unidad || "unidad"
        }))
      };

      const result = await placeOrderAction(orderData);

      if ("error" in result) {
        toast.error("Error al crear el pedido", {
          description: result.error
        });
        return;
      }

      // 2. Handle Payment Method logic (Success flow)
      const selectedMethod = PAYMENT_METHODS.find(m => m.id === values.paymentMethod);
      
      if (selectedMethod?.id === "whatsapp") {
        const whatsappUrl = generateWhatsAppUrl({ values, cart, totalPrice, language, t });
        clearCart();
        window.open(whatsappUrl, "_blank");
        router.push("/");
      } else {
        // Handle all other methods (currently mute)
        clearCart();
        
        toast.success(t.checkout.processing, {
          description: t.checkout.paymentMuteNote,
        });
        
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
      
    } catch (error) {
      console.error("Checkout error:", error);
      const { toast } = await import("sonner");
      toast.error("Ocurrió un error inesperado al procesar tu pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 md:px-6 max-w-7xl mx-auto">
          {/* Header */}
          <CheckoutHeader t={t} />

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Form Section */}
            <CheckoutFormSection 
              t={t} 
              onSubmit={handleCheckoutSubmit} 
              defaultValues={{
                fullName: session?.user?.name || "",
                email: session?.user?.email || "",
              }}
            />

            {/* Summary/Invoice Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-5 lg:sticky lg:top-24"
            >
              <OrderSummary isSubmitting={isSubmitting} />
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
