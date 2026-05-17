"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { Minus, Plus, ShoppingCart, Info, CheckCircle2, X, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { getDeterministicImage } from "@/lib/image-utils";

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal = ({ product, isOpen, onClose }: ProductModalProps) => {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const productTranslation = t.products.items[product.slug] || {
    name: product.name,
    description: product.description,
    unit: product.unidad
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  const handleClose = () => {
    setQuantity(1);
    setExpandedImage(null);
    setIsZoomed(false);
    onClose();
  };

  const handleDoubleClick = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <>
      {/* 1. Detail Dialog (Main UI) */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
          className="w-[92vw] sm:max-w-[650px] md:max-w-[700px] gap-0 p-0 border-border bg-card shadow-[0_0_100px_-20px_rgba(var(--primary),0.15)] rounded-3xl overflow-hidden transition-all duration-500"
        >
          <div className="max-h-[96vh] overflow-y-auto scrollbar-hide">
            <div className="grid md:grid-cols-2 relative">
              {/* Left Column: Image / Carousel */}
              <div className="bg-secondary/30 dark:bg-[#121212] p-3 md:p-6 flex items-center justify-center min-h-[240px] md:min-h-[400px] relative overflow-hidden group/modal transition-all duration-500">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/25 dark:bg-primary/20 rounded-full blur-[80px] -z-10 animate-pulse" />

                {product.stock === 0 && (
                  <>
                    {/* Image Veil */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px] z-20 pointer-events-none" />
                    {/* Professional Ribbon */}
                    <div className="absolute top-0 left-0 z-40 h-28 w-28 overflow-hidden pointer-events-none">
                      <div className="absolute top-[24px] left-[-50px] w-[180px] -rotate-45 bg-[#991b1b] py-1.5 text-center text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-[#fefce8] shadow-[0_4px_15px_rgba(0,0,0,0.4)] border-y border-white/5">
                        {t.products.outOfStock}
                      </div>
                    </div>
                  </>
                )}
                {/* Tag moved to details for a cleaner aesthetic */}

                {product.images && product.images.length > 0 ? (
                  <Carousel className="w-full max-w-[240px] md:max-w-[300px]" opts={{ align: "center", loop: true }}>
                    <CarouselContent>
                      {product.images.map((photo, index) => (
                        <CarouselItem key={index}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="flex aspect-square items-center justify-center p-2 relative w-full h-full"
                          >
                            <Image
                              src={getDeterministicImage(photo, `${product.slug}-${index}`)}
                              alt={`${productTranslation.name} - Vista ${index + 1}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 320px"
                              className="object-cover rounded-2xl shadow-2xl ring-1 ring-white/10 dark:ring-white/5 transform transition-transform group-hover/modal:scale-105 duration-700 ease-out cursor-zoom-in"
                              onClick={() => setExpandedImage(getDeterministicImage(photo, `${product.slug}-${index}`))}
                            />
                          </motion.div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {product.images.length > 1 && (
                      <div className="hidden md:block">
                        <CarouselPrevious className="h-10 w-10 -left-6 bg-background/80 backdrop-blur-md border-border/50 text-foreground hover:bg-primary hover:text-primary-foreground shadow-xl transition-all" />
                        <CarouselNext className="h-10 w-10 -right-6 bg-background/80 backdrop-blur-md border-border/50 text-foreground hover:bg-primary hover:text-primary-foreground shadow-xl transition-all" />
                      </div>
                    )}
                  </Carousel>
                ) : (
                  // Placeholder when no photos exist
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-8xl md:text-9xl drop-shadow-[0_0_50px_rgba(var(--primary),0.3)] select-none"
                  >
                    {product.emoji}
                  </motion.div>
                )}
              </div>

              {/* Right Column: Details */}
              <div className="p-5 md:p-7 flex flex-col bg-card">
                <div className="text-left space-y-0 mb-4 flex-none">
                  <div className="flex flex-wrap items-center gap-4 mb-2">
                    <div className="flex items-center gap-1.5 text-primary dark:text-[#10b981] uppercase font-black text-[10px] tracking-[0.2em] drop-shadow-sm">
                      <Tag className="w-3.5 h-3.5" />
                      {product.categoria}
                    </div>
                    {product.tag && (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white dark:text-black uppercase font-black text-[10px] tracking-[0.2em] px-2.5 py-1 rounded-md shadow-lg border border-white/20">
                        <Tag className="w-3.5 h-3.5" />
                        {product.tag}
                      </div>
                    )}
                  </div>
                  <DialogTitle className="font-display text-2xl md:text-3xl font-black leading-tight text-foreground">
                    {productTranslation.name}
                  </DialogTitle>
                  <div className="font-display text-2xl md:text-3xl font-black text-primary mt-4">
                    {formatPrice(product.price)}
                    <span className="text-sm font-body text-muted-foreground ml-2 font-medium">
                      {t.products.taxesIncluded}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-h-[100px]">
                  <DialogDescription className="font-body text-muted-foreground leading-relaxed text-sm md:text-base border-none p-0">
                    {productTranslation.description}
                  </DialogDescription>

                  <div className="mt-4 flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg border border-border/50">
                    <Info className="w-4 h-4 text-primary" />
                    <span>{t.products.productInfo.replace('{tag}', product.tag.toLowerCase())}</span>
                  </div>
                </div>

                {/* Action Area */}
                <div className="mt-8 md:mt-auto pt-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-sm font-bold text-foreground uppercase tracking-tight">{t.products.quantity}</span>
                      <div className={`flex items-center gap-2 text-[10px] md:text-xs font-black px-2.5 py-1 rounded-md border transition-all duration-300
                        ${product.stock > 5
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : product.stock > 0
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse
                          ${product.stock > 5 ? "bg-green-500" : product.stock > 0 ? "bg-amber-500" : "bg-red-500"}`}
                        />
                        {product.stock > 0 ? `${product.stock} ${t.products.available}` : t.products.outOfStock}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-secondary rounded-xl overflow-hidden border border-border/50 shadow-inner">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="p-3 hover:bg-black/5 active:bg-black/10 transition-colors rounded-l-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-bold text-base select-none">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          disabled={quantity >= product.stock}
                          className="p-3 hover:bg-black/5 active:bg-black/10 transition-colors rounded-r-xl disabled:opacity-20 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={added || product.stock === 0}
                    className={`w-full py-6 rounded-xl font-display text-lg font-bold shadow-lg transition-all
                      ${added
                        ? "bg-green-600 hover:bg-green-700 shadow-green-600/20 text-[#fefce8]"
                        : product.stock === 0
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] active:shadow-inner border border-[#fcd200]"}`}
                  >
                    {added ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> {t.products.added}
                      </span>
                    ) : product.stock === 0 ? (
                      <span>{t.products.noStock}</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
                        {t.products.addToCart}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* 2. Zoom Overlay (Truly Fullscreen) */}
      <Dialog open={!!expandedImage} onOpenChange={() => { setIsZoomed(false); setExpandedImage(null); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-[210] flex items-center justify-center outline-none cursor-zoom-out"
            onClick={() => { setIsZoomed(false); setExpandedImage(null); }}
          >
            <DialogTitle className="sr-only">Imagen de producto ampliada</DialogTitle>
            <DialogDescription className="sr-only">
              Vista en detalle del producto {product.name}. Haz doble clic para hacer zoom.
            </DialogDescription>
            <button
              className="fixed top-8 right-8 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-[220] backdrop-blur-md border border-white/20 shadow-2xl group"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(false);
                setExpandedImage(null);
              }}
            >
              <X className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </button>

            <AnimatePresence mode="wait">
              {expandedImage && (
                <motion.div
                  key={expandedImage}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    scale: isZoomed ? 2 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`max-w-[95vw] max-h-[90vh] relative shadow-2xl transition-all duration-300 w-full h-full
                  ${isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
                  onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(); }}
                  drag={isZoomed}
                  dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
                  dragElastic={0.05}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={expandedImage}
                    alt="Producto ampliado"
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </Dialog>
    </>
  );
};

export default ProductModal;
