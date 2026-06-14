"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, Minus, Plus, ShoppingCart, Store, Tag, X } from "lucide-react";
import Image from "next/image";

import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { formatPrice } from "@/lib/utils";
import { getDeterministicImage } from "@/lib/image-utils";
import { calculateDiscountedPrice } from "@/utils/promotions";

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  viewOnly?: boolean;
  resolvedProduct?: Product;
}

const ProductModal = ({ product, isOpen, onClose, viewOnly = false, resolvedProduct }: ProductModalProps) => {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const currentProduct = resolvedProduct || product;

  const discountedPrice = calculateDiscountedPrice(
    currentProduct.price,
    (currentProduct as any).promotions,
    (currentProduct as any).store?.promotions
  );
  const hasDiscount = discountedPrice !== null;

  const productTranslation = t.products.items[currentProduct.id!] || {
    name: currentProduct.name,
    description: currentProduct.description,
    unit: currentProduct.unidad,
  };

  const categoryNames = Array.isArray((currentProduct as any).categories)
    ? (currentProduct as any).categories.map((c: any) => c?.name).filter(Boolean)
    : [];

  const handleAddToCart = () => {
    addToCart(currentProduct, quantity);
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-[92vw] sm:max-w-[650px] md:max-w-[700px] gap-0 p-0 border-border bg-card shadow-[0_0_100px_-20px_rgba(var(--primary),0.15)] rounded-3xl overflow-hidden transition-all duration-500">
          <DialogTitle className="sr-only">
            {currentProduct.name ? `Detalle de producto: ${currentProduct.name}` : "Detalle de producto"}
          </DialogTitle>
          <div className="max-h-[96vh] overflow-y-auto scrollbar-hide">
            <div className="grid md:grid-cols-2 relative">
              <div className="bg-secondary/30 dark:bg-[#121212] p-3 md:p-6 flex items-center justify-center min-h-[240px] md:min-h-[400px] relative overflow-hidden group/modal transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/25 dark:bg-primary/20 rounded-full blur-[80px] -z-10 animate-pulse" />

                  {currentProduct.stock === 0 && (
                    <>
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px] z-20 pointer-events-none" />
                      <div className="absolute top-0 left-0 z-40 h-28 w-28 overflow-hidden pointer-events-none">
                        <div className="absolute top-[24px] left-[-50px] w-[180px] -rotate-45 bg-[#991b1b] py-1.5 text-center text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-[#fefce8] shadow-[0_4px_15px_rgba(0,0,0,0.4)] border-y border-white/5">
                          {t.products.outOfStock}
                        </div>
                      </div>
                    </>
                  )}

                  {currentProduct.images && currentProduct.images.length > 0 && currentProduct.images[0]?.trim() !== "" ? (
                    <Carousel className="w-full max-w-[240px] md:max-w-[300px]" opts={{ align: "center", loop: true }}>
                      <CarouselContent>
                        {currentProduct.images.map((photo: string, index: number) => (
                          <CarouselItem key={index}>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.4 }}
                              className="flex aspect-square items-center justify-center p-2 relative w-full h-full"
                            >
                              <Image
                                src={getDeterministicImage(photo, `${currentProduct.id!}-${index}`)}
                                alt={`${productTranslation.name} - Vista ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 320px"
                                className="object-cover rounded-2xl shadow-2xl ring-1 ring-white/10 dark:ring-white/5 transform transition-transform group-hover/modal:scale-105 duration-700 ease-out cursor-zoom-in"
                                onClick={() => setExpandedImage(getDeterministicImage(photo, `${currentProduct.id!}-${index}`))}
                              />
                            </motion.div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {currentProduct.images.length > 1 && (
                        <div className="hidden md:block">
                          <CarouselPrevious className="h-10 w-10 -left-6 bg-background/80 backdrop-blur-md border-border/50 text-foreground hover:bg-primary hover:text-primary-foreground shadow-xl transition-all" />
                          <CarouselNext className="h-10 w-10 -right-6 bg-background/80 backdrop-blur-md border-border/50 text-foreground hover:bg-primary hover:text-primary-foreground shadow-xl transition-all" />
                        </div>
                      )}
                    </Carousel>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-8xl md:text-9xl drop-shadow-[0_0_50px_rgba(var(--primary),0.3)] select-none"
                    >
                      {currentProduct.emoji || "📦"}
                    </motion.div>
                  )}
              </div>

              <div className="p-5 md:p-7 flex flex-col bg-card">
                  <div className="text-left space-y-0 mb-4 flex-none">
                    <div className="flex flex-wrap items-center gap-4 mb-2">
                      {categoryNames.length > 0 && (
                        <div className="flex items-center gap-1.5 text-primary dark:text-[#10b981] uppercase font-black text-[10px] tracking-[0.2em] drop-shadow-sm">
                          <Tag className="w-3.5 h-3.5" />
                          {categoryNames.join(", ")}
                        </div>
                      )}
                      {currentProduct.tag && (
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white dark:text-black uppercase font-black text-[10px] tracking-[0.2em] px-2.5 py-1 rounded-md shadow-lg border border-white/20">
                          <Tag className="w-3.5 h-3.5" />
                          {currentProduct.tag}
                        </div>
                      )}
                    </div>

                    <DialogTitle className="font-display text-2xl md:text-3xl font-black leading-tight text-foreground">
                      {productTranslation.name}
                    </DialogTitle>

                    {(currentProduct as any).store?.name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground/80 mt-2">
                        <Store className="w-4 h-4 text-primary/70" />
                        <span className="truncate">{(currentProduct as any).store.name}</span>
                      </div>
                    )}

                    {hasDiscount ? (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-sm">Oferta</span>
                        </div>
                        <div className="font-display text-lg text-muted-foreground line-through decoration-muted-foreground/50">
                          {formatPrice(currentProduct.price)}
                        </div>
                        <div className="font-display text-2xl md:text-3xl font-black text-red-600">
                          {formatPrice(discountedPrice)}
                        </div>
                      </div>
                    ) : (
                      <div className="font-display text-2xl md:text-3xl font-black text-primary mt-4">
                        {formatPrice(currentProduct.price)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-h-[100px]">
                    <DialogDescription className="font-body text-muted-foreground leading-relaxed text-sm md:text-base border-none p-0">
                      {productTranslation.description}
                    </DialogDescription>

                    {currentProduct.tag && (
                      <div className="mt-4 flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg border border-border/50">
                        <Info className="w-4 h-4 text-primary" />
                        <span>{t.products.productInfo.replace("{tag}", currentProduct.tag.toLowerCase())}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 md:mt-auto pt-6 space-y-4">
                    {viewOnly ? (
                      <Button
                        onClick={handleClose}
                        className="w-full py-6 rounded-xl font-display text-lg font-bold shadow-sm transition-all bg-secondary/80 hover:bg-secondary text-foreground border border-border/50"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" /> Entendido
                        </span>
                      </Button>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-sm font-bold text-foreground uppercase tracking-tight">{t.products.quantity}</span>
                            <div
                              className={`flex items-center gap-2 text-[10px] md:text-xs font-black px-2.5 py-1 rounded-md border transition-all duration-300 ${
                                currentProduct.stock > 5
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : currentProduct.stock > 0
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    : "bg-red-500/10 text-red-600 border-red-500/20"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                  currentProduct.stock > 5
                                    ? "bg-green-500"
                                    : currentProduct.stock > 0
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                              />
                              {currentProduct.stock > 0 ? `${currentProduct.stock} ${t.products.available}` : t.products.outOfStock}
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
                              <span className="w-10 text-center font-bold text-base select-none">{quantity}</span>
                              <button
                                onClick={() => setQuantity(Math.min(currentProduct.stock, quantity + 1))}
                                disabled={quantity >= currentProduct.stock}
                                className="p-3 hover:bg-black/5 active:bg-black/10 transition-colors rounded-r-xl disabled:opacity-20 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleAddToCart}
                          disabled={added || currentProduct.stock === 0}
                          className={`w-full py-6 rounded-xl font-display text-lg font-bold shadow-lg transition-all ${
                            added
                              ? "bg-green-600 hover:bg-green-700 shadow-green-600/20 text-[#fefce8]"
                              : currentProduct.stock === 0
                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                : "bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] active:shadow-inner border border-[#fcd200]"
                          }`}
                        >
                          {added ? (
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5" /> {t.products.added}
                            </span>
                          ) : currentProduct.stock === 0 ? (
                            <span>{t.products.noStock}</span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
                              {t.products.addToCart}
                            </span>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!expandedImage} onOpenChange={() => { setIsZoomed(false); setExpandedImage(null); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-[210] flex items-center justify-center outline-none cursor-zoom-out"
            onClick={() => { setIsZoomed(false); setExpandedImage(null); }}
          >
            <DialogTitle className="sr-only">Imagen de producto ampliada</DialogTitle>
            <DialogDescription className="sr-only">
              Vista en detalle del producto {currentProduct.name}. Haz doble clic para hacer zoom.
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
                  animate={{ opacity: 1, scale: isZoomed ? 2 : 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`max-w-[95vw] max-h-[90vh] relative shadow-2xl transition-all duration-300 w-full h-full ${
                    isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                  }`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed((value) => !value);
                  }}
                  drag={isZoomed}
                  dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
                  dragElastic={0.05}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image src={expandedImage} alt="Producto ampliado" fill sizes="100vw" className="object-contain" />
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
