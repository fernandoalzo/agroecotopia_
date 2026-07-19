"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, PhoneCall, Database, Truck, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyToClipboard } from "@/frontend/components/shared/CopyToClipboard";
import logger from "@/utils/logger";

const log = logger.child("src/app/checkout/advisor-success/page.tsx");

function AdvisorSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();

  const [storeSummaries, setStoreSummaries] = useState<Array<{
    pedidoId: string;
    storeId: string;
    storeName: string;
    content: string;
  }>>([]);

  const orderId = searchParams.get("id") || "";
  const orderIds = (searchParams.get("ids") || orderId)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const displayOrderCode = orderIds.length > 1 ? orderIds.join(", ") : orderId;

  const isEs = language === "es";

  // Redirigir a inicio si no hay ID de pedido
  React.useEffect(() => {
    if (!orderId) {
      const timeout = setTimeout(() => {
        router.push("/");
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [orderId, router]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("advisor-order-summary");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.orderId !== orderId || !Array.isArray(parsed?.summaries)) return;
      setStoreSummaries(parsed.summaries);
    } catch (error) {
      log.error("No se pudo leer el resumen por tienda:", error);
    }
  }, [orderId]);

  const groupedSummaries = useMemo(() => {
    if (storeSummaries.length > 0) return storeSummaries;
    return orderIds.map((pedidoId, index) => ({
      pedidoId,
      storeId: pedidoId,
      storeName: isEs ? `Tienda ${index + 1}` : `Store ${index + 1}`,
      content: "",
    }));
  }, [storeSummaries, orderIds, isEs]);



  if (!orderId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 w-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"
        />
        <h2 className="text-xl font-bold mb-2">
          {isEs ? "No se encontró el ID del pedido" : "Order ID not found"}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {isEs
            ? "Redirigiéndote a la página de inicio en unos segundos..."
            : "Redirecting you to the home page in a few seconds..."}
        </p>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const drawCheck = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: 0.2, type: "spring" as const, stiffness: 100, damping: 20 },
        opacity: { delay: 0.2, duration: 0.2 },
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto w-full px-4"
    >
      {/* Icono de Éxito Animado */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.1 }}
            className="w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 relative z-10 shadow-lg shadow-emerald-500/5"
          >
            <svg
              className="w-12 h-12 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                variants={drawCheck}
                d="M20 6L9 17L4 12"
              />
            </svg>
          </motion.div>

          {/* Auras y Chispas decorativas */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute inset-0 bg-emerald-500/20 rounded-full filter blur-xl -z-0"
          />
        </div>
      </div>

      {/* Encabezado Principal */}
      <motion.div variants={itemVariants} className="text-center space-y-3 mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground bg-gradient-to-r from-emerald-600 via-green-600 to-amber-600 bg-clip-text text-transparent">
          {t.checkout.advisorSuccessTitle}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {t.checkout.advisorSuccessMessage}
        </p>
      </motion.div>

      {/* Caja de ID en Base de Datos (Muy Estilizada como un Ticket) */}
      <motion.div variants={itemVariants} className="mb-10">
        <Card className="rounded-3xl border-border/60 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl relative overflow-hidden shadow-xl shadow-primary/5">
          {/* Elementos Decorativos de Ticket */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background border-r border-border rounded-r-full -ml-px z-10" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background border-l border-border rounded-l-full -mr-px z-10" />

          <CardContent className="p-6 md:p-8 relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-widest">
                <Database className="w-3.5 h-3.5" />
                {isEs ? "Registro Exitoso en DB" : "DB Registry Success"}
              </div>

              <div className="w-full space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 block">
                  {isEs ? "ID del Registro / Código de Pedido" : "Registry ID / Order Code"}
                </span>

                {/* ID en un contenedor muy premium */}
                <div className="relative group max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-2xl filter blur opacity-15 group-hover:opacity-25 transition-opacity" />

                  <div className="relative flex items-center justify-between gap-4 p-4 bg-secondary/30 dark:bg-secondary/15 backdrop-blur-md rounded-2xl border border-border/80 font-mono text-sm md:text-base text-foreground break-all shadow-inner">
                    <span className="flex-1 text-center font-bold tracking-tight select-all pl-2 select-text">
                      {displayOrderCode}
                    </span>

                    <CopyToClipboard
                      text={displayOrderCode}
                      iconClassName="w-4 h-4"
                      className="p-2.5 rounded-xl bg-background hover:bg-primary/10 border border-border hover:border-primary/30 shadow-sm"
                      ariaLabel={isEs ? "Copiar ID" : "Copy ID"}
                    />
                  </div>
                </div>
              </div>

              {/* Nota sobre el Guardado */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>
                  {isEs
                    ? "Guarda este ID para tus registros y referencias."
                    : "Save this ID for your records and reference."}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Siguientes Pasos */}
      <motion.div variants={itemVariants} className="space-y-4 mb-10">
        <h3 className="text-lg font-black tracking-tight flex items-center gap-2 border-b border-border/50 pb-2 text-foreground">
          <FileText className="w-4.5 h-4.5 text-primary" />
          {isEs ? "Siguientes Pasos" : "Next Steps"}
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Paso 1 */}
          <div className="p-5 rounded-2xl border border-border/40 bg-secondary/10 dark:bg-secondary/5 space-y-3 hover:border-emerald-500/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              1
            </div>
            <h4 className="font-bold text-sm text-foreground">
              {isEs ? "Registro Seguro" : "Secure Record"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEs
                ? "El pedido ya está asentado en nuestra base de datos con estado pendiente."
                : "The order is already registered in our database with a pending status."}
            </p>
          </div>

          {/* Paso 2 */}
          <div className="p-5 rounded-2xl border border-border/40 bg-secondary/10 dark:bg-secondary/5 space-y-3 hover:border-amber-500/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              2
            </div>
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" />
              {isEs ? "Contacto Directo" : "Direct Contact"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEs
                ? "Un asesor experto te llamará o escribirá para afinar detalles de pago y envío."
                : "An expert advisor will call or write to you to details payment and shipment."}
            </p>
          </div>

          {/* Paso 3 */}
          <div className="p-5 rounded-2xl border border-border/40 bg-secondary/10 dark:bg-secondary/5 space-y-3 hover:border-primary/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              3
            </div>
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              {isEs ? "Envío Rápido" : "Fast Shipment"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEs
                ? "Despachamos tus productos agroecológicos directo del campo a tu puerta."
                : "We dispatch your agroecological products direct from the field to your door."}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4 mb-10">
        <h3 className="text-lg font-black tracking-tight flex items-center gap-2 border-b border-border/50 pb-2 text-foreground">
          <ShoppingBag className="w-4.5 h-4.5 text-primary" />
          {isEs ? "Resumen por Tienda" : "Store Summary"}
        </h3>

        <div className="grid gap-4">
          {groupedSummaries.map((summary, index) => (
            <Card key={`${summary.storeId}-${index}`} className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                      {isEs ? "Tienda" : "Store"}
                    </p>
                    <h4 className="text-base font-black text-foreground">{summary.storeName}</h4>
                  </div>
                  <Badge className="rounded-full bg-primary/10 text-primary border-primary/20">
                    {summary.pedidoId.slice(-6).toUpperCase()}
                  </Badge>
                </div>

                {summary.content ? (
                  <pre className="whitespace-pre-wrap rounded-2xl border border-border/60 bg-secondary/20 p-4 text-xs leading-relaxed text-foreground/80 overflow-auto">
                    {summary.content}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isEs ? "No se encontró detalle para esta tienda." : "No detail found for this store."}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Botones de Acción */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
      >
        <Button
          onClick={() => router.push(`/pedidos/${orderId}`)}
          className="w-full sm:w-auto rounded-2xl px-8 py-6 font-bold shadow-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
        >
          {isEs ? "Ver Detalles del Pedido" : "View Order Details"}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push("/products")}
          className="w-full sm:w-auto rounded-2xl px-8 py-6 font-bold border-border/60 hover:bg-primary/5 hover:text-primary transition-all duration-200 flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          {isEs ? "Volver a Productos" : "Back to Shop"}
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Loading state for Suspense
function AdvisorSuccessLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 w-full">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4 animate-spin" />
    </div>
  );
}

export default function AdvisorSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background/50 selection:bg-primary/20">

      <main className="flex-1 pt-28 pb-20 md:pt-36 flex items-center">
        <Suspense fallback={<AdvisorSuccessLoading />}>
          <AdvisorSuccessContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
