"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductCard from "@/components/ProductCard";
import { products } from "@/utils/constants";
import { Leaf, Search, LayoutGrid, Grid2X2, List } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'list'>('grid');

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">
      <Navbar />

      <main className="pt-24 pb-16 md:pt-32 md:pb-32">
        {/* Header Section */}
        <div className="container px-4 md:px-6 mb-12 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-4 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary md:text-sm">
              <Leaf className="h-4 w-4" />
              {t.products.fullCatalog}
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-7xl mb-6">
              {t.products.ourHarvest.split(' ')[0]} <span className="text-primary italic">{t.products.ourHarvest.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="max-w-2xl font-body text-base leading-relaxed text-muted-foreground md:text-xl">
              {t.products.catalogDescription}
            </p>
          </motion.div>
        </div>

        {/* Toolbar */}
        <div className="container px-4 md:px-6 mb-12">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center border-b border-border pb-8">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t.products.searchPlaceholder}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body text-sm"
              />
            </div>
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground font-body">
                {t.products.showingResults.replace('{count}', products.length.toString()).split(products.length.toString())[0]}
                <span className="font-bold text-foreground">{products.length}</span>
                {t.products.showingResults.replace('{count}', products.length.toString()).split(products.length.toString())[1]}
              </div>

              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && setViewMode(value as any)}
                className="bg-card/30 backdrop-blur-md border border-border/60 p-1.5 rounded-2xl shadow-inner gap-1 relative overflow-hidden"
              >
                {/* Visual Options with Enhanced Contrast */}
                <ToggleGroupItem 
                  value="grid" 
                  className={cn(
                    "relative rounded-xl px-4 py-2 ring-offset-background transition-all hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-transparent active:scale-95 hover:scale-105",
                    viewMode === 'grid' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="h-5 w-5 relative z-10" />
                  {viewMode === 'grid' && (
                    <motion.div
                      layoutId="activeViewPill"
                      className="absolute inset-0 bg-[#a68953] dark:bg-[#a68953] rounded-xl shadow-[0_2px_12px_rgba(166,137,83,0.5)]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </ToggleGroupItem>

                <ToggleGroupItem 
                  value="compact" 
                  className={cn(
                    "relative rounded-xl px-4 py-2 ring-offset-background transition-all hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-transparent active:scale-95 hover:scale-105",
                    viewMode === 'compact' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Grid2X2 className="h-5 w-5 relative z-10" />
                  {viewMode === 'compact' && (
                    <motion.div
                      layoutId="activeViewPill"
                      className="absolute inset-0 bg-[#a68953] dark:bg-[#a68953] rounded-xl shadow-[0_2px_12px_rgba(166,137,83,0.5)]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </ToggleGroupItem>

                <ToggleGroupItem 
                  value="list" 
                  className={cn(
                    "relative rounded-xl px-4 py-2 ring-offset-background transition-all hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-transparent active:scale-95 hover:scale-105",
                    viewMode === 'list' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="h-5 w-5 relative z-10" />
                  {viewMode === 'list' && (
                    <motion.div
                      layoutId="activeViewPill"
                      className="absolute inset-0 bg-[#a68953] dark:bg-[#a68953] rounded-xl shadow-[0_2px_12px_rgba(166,137,83,0.5)]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        {/* Grid/List Section */}
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            layout
            className={`
              ${viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 justify-items-center" : ""}
              ${viewMode === 'compact' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center" : ""}
              ${viewMode === 'list' ? "flex flex-col gap-6" : ""}
            `}
          >
            <AnimatePresence mode="popLayout">
              {products.map((p, index) => (
                <motion.div
                  layout
                  key={p.slug}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={viewMode === 'list' ? "w-full" : ""}
                >
                  <ProductCard p={p} priority={index < 4} variant={viewMode} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
