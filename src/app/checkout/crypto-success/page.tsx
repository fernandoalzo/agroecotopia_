"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, Bitcoin, Database, Truck, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyToClipboard } from "@/frontend/components/shared/CopyToClipboard";
import logger from "@/utils/logger";

const log = logger.child("src/app/checkout/crypto-success/page.tsx");

function CryptoSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();

  const [storeSummaries, setStoreSummaries] = useState<Array<{
    pedidoId: string;
    storeId: string;
    storeName: string;
    content: string;
  }>>([]);

  const [savedTxId, setSavedTxId] = useState("");

  const orderId = searchParams.get("id") || "";
  const orderIds = (searchParams.get("ids") || orderId)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const displayOrderCode = orderIds.length > 1 ? orderIds.join(", ") : orderId;

  const isEs = language === "es";

  useEffect(() => {
    if (!orderId) {
      const timeout = setTimeout(() => {
        router.push("/");
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [orderId, router]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("crypto-order-summary");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.orderId !== orderId || !Array.isArray(parsed?.summaries)) return;
      setStoreSummaries(parsed.summaries);
      if (parsed?.transactionId) setSavedTxId(parsed.transactionId);
    } catch (error) {
      log.error("No se pudo leer el resumen cripto:", error);
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto w-full px-4"
    >
      {/* Icono de Éxito */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.1 }}
            className="w-24 h-24 bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 relative z-10 shadow-lg shadow-orange-500/5"
          >
            <Bitcoin className="w-12 h-12" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute inset-0 bg-orange-500/20 rounded-full filter blur-xl -z-0"
          />
        </div>
      </div>

      {/* Encabezado */}
      <motion.div variants={itemVariants} className="text-center space-y-3 mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
          {isEs ? "¡Pago en Cripto Registrado!" : "Crypto Payment Registered!"}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {isEs
            ? "Tu pedido y el ID de transacción han sido enviados al asesor para verificación. Te notificaremos cuando sea confirmado."
            : "Your order and transaction ID have been sent to the advisor for verification. You will be notified once confirmed."}
        </p>
      </motion.div>

      {/* ID del Pedido */}
      <motion.div variants={itemVariants} className="mb-10">
        <Card className="rounded-3xl border-border/60 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl relative overflow-hidden shadow-xl shadow-primary/5">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background border-r border-border rounded-r-full -ml-px z-10" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background border-l border-border rounded-l-full -mr-px z-10" />
          <CardContent className="p-6 md:p-8 relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs font-bold uppercase tracking-widest">
                <Database className="w-3.5 h-3.5" />
                {isEs ? "Registro Exitoso en DB" : "DB Registry Success"}
              </div>
              <div className="w-full space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 block">
                  {isEs ? "Código de Pedido" : "Order Code"}
                </span>
                <div className="relative group max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl filter blur opacity-15 group-hover:opacity-25 transition-opacity" />
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

              {savedTxId && (
                <div className="w-full space-y-2 pt-2 border-t border-border/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 block">
                    TXID (ID de Transacción)
                  </span>
                  <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary/20 border border-border/60 font-mono text-xs text-foreground/80 break-all">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold">{savedTxId}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>
                  {isEs
                    ? "Guarda estos datos para tus registros."
                    : "Save this data for your records."}
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
          <div className="p-5 rounded-2xl border border-border/40 bg-secondary/10 dark:bg-secondary/5 space-y-3 hover:border-emerald-500/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">1</div>
            <h4 className="font-bold text-sm text-foreground">
              {isEs ? "TXID Enviado" : "TXID Sent"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEs
                ? "El ID de tu transacción ya fue enviado al asesor para su verificación."
                : "Your transaction ID has been sent to the advisor for verification."}
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-border/40 bg-secondary/10 dark:bg-secondary/5 space-y-3 hover:border-amber-500/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">2</div>
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Bitcoin className="w-3.5 h-3.5" />
              {isEs ? "Verificación" : "Verification"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEs
                ? "El asesor verificará la transacción en la blockchain y confirmará el pedido."
                : "The advisor will verify the transaction on the blockchain and confirm the order."}
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-border/40 bg-secondary/10 dark:bg-secondary/5 space-y-3 hover:border-primary/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">3</div>
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              {isEs ? "Despacho" : "Dispatch"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEs
                ? "Una vez verificado, despachamos tus productos directo del campo a tu puerta."
                : "Once verified, we dispatch your products direct from field to your door."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Resumen por Tienda */}
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
          className="w-full sm:w-auto rounded-2xl px-8 py-6 font-bold shadow-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
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

function CryptoSuccessLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 w-full">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4 animate-spin" />
    </div>
  );
}

export default function CryptoSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background/50 selection:bg-primary/20">
      <main className="flex-1 pt-28 pb-20 md:pt-36 flex items-center">
        <Suspense fallback={<CryptoSuccessLoading />}>
          <CryptoSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
