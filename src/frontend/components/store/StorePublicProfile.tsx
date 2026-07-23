"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  User,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import type { Product } from "@/types";
import type { Store as StoreType } from "@/types/store";

interface StorePublicProfileProps {
  store: StoreType & {
    owner?: { id: string; name?: string | null; image?: string | null };
    _count?: { products: number };
  };
  products: Product[];
}

export function StorePublicProfile({ store, products }: StorePublicProfileProps) {
  const router = useRouter();
  const { language } = useLanguage();

  const t = {
    back: language === "es" ? "Volver" : "Back",
    about: language === "es" ? "Sobre la Tienda" : "About the Store",
    details: language === "es" ? "Detalles" : "Details",
    owner: language === "es" ? "Propietario" : "Owner",
    products: language === "es" ? "Productos" : "Products",
    memberSince: language === "es" ? "Miembro desde" : "Member since",
    city: language === "es" ? "Ciudad" : "City",
    address: language === "es" ? "Dirección" : "Address",
    phone: language === "es" ? "Teléfono" : "Phone",
    email: language === "es" ? "Correo" : "Email",
    notSpecified: language === "es" ? "No especificado" : "Not specified",
    activeStore: language === "es" ? "Tienda Verificada" : "Verified Store",
    productCount: (n: number) =>
      language === "es" ? `${n} producto${n !== 1 ? "s" : ""}` : `${n} product${n !== 1 ? "s" : ""}`,
    noProducts: language === "es" ? "Esta tienda aún no tiene productos." : "This store has no products yet.",
    storeOwner: language === "es" ? "Dueño de la tienda" : "Store owner",
  };

  const infoItems = [
    { icon: MapPin, label: t.city, value: store.city || t.notSpecified },
    { icon: MapPin, label: t.address, value: store.address || t.notSpecified },
    { icon: Phone, label: t.phone, value: store.phone || t.notSpecified },
    { icon: Mail, label: t.email, value: store.email || t.notSpecified },
    {
      icon: Calendar,
      label: t.memberSince,
      value: new Date(store.createdAt).toLocaleDateString(
        language === "es" ? "es-CO" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <main className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 md:px-6">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t.back}
          </button>

          {/* ── Hero Section ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/30 border border-border/50 p-6 sm:p-10 mb-10"
          >
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-secondary/40 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Store Avatar */}
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-card border border-border/50 shadow-xl flex items-center justify-center shrink-0 overflow-hidden">
                {store.logo ? (
                  <Image
                    src={store.logo}
                    alt={store.name}
                    width={112}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Store className="w-12 h-12 text-primary" />
                )}
              </div>

              {/* Store Info */}
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                  {store.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    {t.activeStore}
                  </span>
                  {store._count && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary/80 text-muted-foreground border border-border/50">
                      <Package className="w-3 h-3" />
                      {t.productCount(store._count.products)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {store.description && (
              <p className="relative text-base text-muted-foreground leading-relaxed mt-8 max-w-3xl">
                {store.description}
              </p>
            )}
          </motion.div>

          {/* ── Info Grid + Owner ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
            {/* Info Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6 sm:p-8"
            >
              <h2 className="text-xs font-black text-foreground uppercase tracking-widest mb-6 opacity-80">
                {t.details}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                {infoItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-secondary/50 text-muted-foreground shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                          {item.label}
                        </p>
                        <p className="text-sm text-foreground font-semibold truncate">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Owner Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8 flex flex-col items-center justify-center text-center"
            >
              <h2 className="text-xs font-black text-foreground uppercase tracking-widest mb-6 opacity-80 self-start">
                {t.owner}
              </h2>
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-secondary/80 border-2 border-border/50 flex items-center justify-center overflow-hidden shadow-lg">
                  {store.owner?.image ? (
                    <Image
                      src={store.owner.image}
                      alt={store.owner.name || ""}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-foreground">
                    {store.owner?.name || t.notSpecified}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.storeOwner}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Products Section ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-black text-foreground">
                {t.products}
              </h2>
              {store._count && (
                <span className="text-sm text-muted-foreground font-medium">
                  {t.productCount(store._count.products)}
                </span>
              )}
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((p, i) => (
                  <ProductCard key={p.id} p={p} priority={i < 4} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">{t.noProducts}</p>
              </div>
            )}
          </motion.section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
