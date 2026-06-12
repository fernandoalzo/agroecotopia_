"use client";

import React, { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { CheckoutFormSection } from "@/components/checkout/CheckoutFormSection";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { CheckoutValues } from "@/lib/validations/checkout.schema";
import { motion } from "framer-motion";
import { ArrowLeft, Truck, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { PAYMENT_METHODS, PaymentHandlerFactory } from "@/utils/PaymentsMethods";
// import { placeOrderAction } from "@/backend/modules/orders"; // moved to API route
import { Loading } from "@/components/ui/Loading";
import logger from "@/utils/logger";
import { calculateDiscountedPrice } from "@/utils/promotions";
import { getAllCitiesAction } from "@/backend/modules/shipping/shipping.actions";
import { getBodegasByCityAction } from "@/backend/modules/bodega/bodega.actions";

const log = logger.child("src/app/checkout/page.tsx");

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { cart, totalPrice, clearCart } = useCart();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [destinationCity, setDestinationCity] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<string>("ENVIO");

  const { data: cityZones, isLoading: isCitiesLoading } = useQuery({
    queryKey: ["checkoutCities"],
    queryFn: async () => {
      const res = await getAllCitiesAction();
      if (!res.success) throw new Error((res as any).error || "Error al cargar ciudades");
      return res.cities as { name: string; cities: string[] }[];
    },
    staleTime: 60000,
  });

  const { data: bodegas = [], isLoading: isLoadingBodegas } = useQuery({
    queryKey: ["bodegas", destinationCity],
    queryFn: async () => {
      if (!destinationCity) return [];
      const res = await getBodegasByCityAction(destinationCity);
      if (!res.success) return [];
      return res.bodegas as { id: string; name: string; address: string; city: string; store: { id: string; name: string } | null }[];
    },
    enabled: !!destinationCity && tipoEntrega === "RECOJO_EN_BODEGA",
    staleTime: 60000,
  });

  // Protected route logic
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  // If cart is empty, redirect back to cart page (only if not currently submitting an order)
  useEffect(() => {
    if (cart.length === 0 && status === "authenticated" && !isSubmitting) {
      router.push("/cart");
    }
  }, [cart.length, status, router, isSubmitting]);

  if ((status === "loading" && !session) || isSubmitting || (cart.length === 0 && !isSubmitting)) {
    return <Loading fullScreen />;
  }

  const handleCheckoutSubmit = async (values: CheckoutValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { toast } = await import("sonner");

      // 1. Create order in Database
      const orderData: Record<string, unknown> = {
        notasCliente: values.notes,
        costoEnvio: 0, // Simplified for now
        metodoPago: values.paymentMethod,
        tipoEntrega: values.tipoEntrega,
        detalles: cart.map(item => ({
          productoId: item.product.id!,
          cantidad: item.quantity,
          precioUnitario: calculateDiscountedPrice(item.product.price, (item.product as any).promotions, (item.product as any).store?.promotions) ?? item.product.price,
          unidadMedida: item.product.unidad || "unidad"
        }))
      };

      if (values.tipoEntrega === "ENVIO") {
        orderData.direccionEntrega = `${values.address}, ${values.city}`;
      } else {
        orderData.direccionEntrega = null;
        orderData.bodegaId = values.bodegaId;
      }

      const response = await fetch('/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const result = await response.json();

      if ("error" in result) {
        toast.error("Error al crear el pedido", {
          description: result.error
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Handle Payment Method logic via Centralized Factory
      const paymentHandler = PaymentHandlerFactory.getHandler(values.paymentMethod);
      await paymentHandler.process({
        pedidoId: result.pedidoId,
        pedidoIds: result.pedidoIds,
        values,
        cart,
        totalPrice,
        language,
        t,
        clearCart,
        router,
      });

    } catch (error) {
      log.error("Checkout error:", error);
      const { toast } = await import("sonner");
      toast.error("Ocurrió un error inesperado al procesar tu pedido.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">

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
              onCityChange={setDestinationCity}
              onTipoEntregaChange={setTipoEntrega}
              cityZones={cityZones ?? []}
              bodegas={bodegas}
              isLoadingBodegas={isLoadingBodegas}
            />

            {/* Summary/Invoice Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-5 lg:sticky lg:top-24"
            >
              <OrderSummary isSubmitting={isSubmitting} destinationCity={destinationCity} tipoEntrega={tipoEntrega} />
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
