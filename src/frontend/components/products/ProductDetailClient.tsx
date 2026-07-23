"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Info, Minus, Plus, ShoppingCart, Store, Tag, Truck, ShieldCheck, Star, StarHalf, X, Share2, Check } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";

import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { formatPrice, cn } from "@/lib/utils";
import { getDeterministicImage } from "@/lib/image-utils";
import { calculateDiscountedPrice } from "@/utils/promotions";
import Footer from "@/components/Footer";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export const ProductDetailClient = ({ product, relatedProducts }: ProductDetailClientProps) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const DESCRIPTION_MAX_LENGTH = 250;
  const productUrl = typeof window !== "undefined" ? window.location.href : "";

  const discountedPrice = calculateDiscountedPrice(
    product.price,
    (product as any).promotions,
    (product as any).store?.promotions
  );
  const hasDiscount = discountedPrice !== null;

  const productTranslation = t.products.items[product.id!] || {
    name: product.name,
    description: product.description,
    unit: product.unidad,
  };

  const categoryNames = Array.isArray((product as any).categories)
    ? (product as any).categories.map((c: any) => c?.name).filter(Boolean)
    : [];

  const productRatingAverage = product.ratingAverage ?? 0;
  const productRatingCount = product.ratingCount ?? 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-body">
        <main className="pt-24 pb-16 md:pt-32 md:pb-32">
          <div className="container mx-auto px-4 md:px-6">
            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {language === "es" ? "Volver" : "Back"}
            </button>

            {/* Product Detail Grid */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* Image Section */}
              <div className="bg-secondary/30 dark:bg-[#121212] p-4 md:p-8 flex items-center justify-center h-[400px] md:h-[500px] relative overflow-hidden rounded-3xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/25 dark:bg-primary/20 rounded-full blur-[80px] animate-pulse" />

                {product.stock === 0 && (
                  <>
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px] z-20 pointer-events-none" />
                    <div className="absolute top-0 left-0 z-40 h-28 w-28 overflow-hidden pointer-events-none">
                      <div className="absolute top-[24px] left-[-50px] w-[180px] -rotate-45 bg-[#991b1b] py-1.5 text-center text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-[#fefce8] shadow-[0_4px_15px_rgba(0,0,0,0.4)] border-y border-white/5">
                        {t.products.outOfStock}
                      </div>
                    </div>
                  </>
                )}

                {product.images && product.images.length > 0 && product.images[0]?.trim() !== "" ? (
                  <Carousel className="w-full max-w-[300px] md:max-w-[400px]" opts={{ align: "center", loop: true }}>
                    <CarouselContent>
                      {product.images.map((photo: string, index: number) => (
                        <CarouselItem key={index}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="flex aspect-square items-center justify-center p-2 relative w-full h-full"
                          >
                            <div
                              className="relative w-full h-full overflow-hidden rounded-2xl"
                              onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                setZoomPos({ x, y });
                              }}
                              onMouseEnter={() => setIsImageHovered(true)}
                              onMouseLeave={() => setIsImageHovered(false)}
                            >
                              <Image
                                src={getDeterministicImage(photo, `${product.id!}-${index}`)}
                                alt={`${productTranslation.name} - Vista ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 400px"
                                className="object-cover shadow-2xl ring-1 ring-white/10 dark:ring-white/5 transition-transform duration-200 ease-out cursor-zoom-in"
                                style={{
                                  transform: isImageHovered ? "scale(2.5)" : "scale(1)",
                                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                                }}
                                onClick={() => setExpandedImage(getDeterministicImage(photo, `${product.id!}-${index}`))}
                              />
                            </div>
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
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-8xl md:text-9xl drop-shadow-[0_0_50px_rgba(var(--primary),0.3)] select-none"
                  >
                    {product.emoji || "📦"}
                  </motion.div>
                )}
              </div>

              {/* Details Section */}
              <div className="flex flex-col">
                {/* Categories & Tags */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {categoryNames.length > 0 && (
                    <div className="flex items-center gap-1.5 text-primary dark:text-[#10b981] uppercase font-black text-[10px] tracking-[0.2em]">
                      <Tag className="w-3.5 h-3.5" />
                      {categoryNames.join(", ")}
                    </div>
                  )}
                  {product.tag && (
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white dark:text-black uppercase font-black text-[10px] tracking-[0.2em] px-2.5 py-1 rounded-md shadow-lg border border-white/20">
                      <Tag className="w-3.5 h-3.5" />
                      {product.tag}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h1 className="font-display text-3xl md:text-4xl font-black leading-tight text-foreground mb-1">
                  {productTranslation.name}
                </h1>

                {/* Store */}
                {(product as any).store?.name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/80 mt-2 mb-3">
                    <Store className="w-4 h-4 text-primary/70" />
                    {(product as any).store.slug ? (
                      <motion.div whileHover={{ scale: 1.03, x: 2 }} whileTap={{ scale: 0.97 }}>
                        <Link
                          href={`/tienda/${(product as any).store.slug}`}
                          className="truncate text-foreground/90 hover:text-primary hover:underline transition-colors font-semibold"
                        >
                          {(product as any).store.name}
                        </Link>
                      </motion.div>
                    ) : (
                      <span className="truncate">{(product as any).store.name}</span>
                    )}
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-[#ffa41c]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(productRatingAverage) ? "fill-current" : "text-muted-foreground/20"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-[#007185] font-medium">
                    {productRatingCount > 0 ? `${productRatingAverage.toFixed(1)} (${productRatingCount})` : ""}
                  </span>
                </div>

                {/* Price */}
                {hasDiscount ? (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-sm">Oferta</span>
                    </div>
                    <div className="font-display text-xl text-muted-foreground line-through decoration-muted-foreground/50">
                      {formatPrice(product.price)}
                    </div>
                    <div className="font-display text-3xl md:text-4xl font-black text-red-600">
                      {formatPrice(discountedPrice)}
                    </div>
                  </div>
                ) : (
                  <div className="font-display text-3xl md:text-4xl font-black text-primary mb-6">
                    {formatPrice(product.price)}
                  </div>
                )}

                {/* Delivery Info */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>{language === "es" ? "Envío gratis disponible" : "Free shipping available"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span>{language === "es" ? "Producto de origen agroecológico" : "Agroecological source product"}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <p className="font-body text-muted-foreground leading-relaxed text-sm md:text-base">
                    {isDescriptionExpanded || !productTranslation.description || productTranslation.description.length <= DESCRIPTION_MAX_LENGTH
                      ? productTranslation.description
                      : `${productTranslation.description.slice(0, DESCRIPTION_MAX_LENGTH)}...`}
                  </p>
                  {productTranslation.description && productTranslation.description.length > DESCRIPTION_MAX_LENGTH && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="text-primary font-bold text-xs mt-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
                    >
                      {isDescriptionExpanded
                        ? (language === "es" ? "Ver menos" : "Show less")
                        : (language === "es" ? "Ver más" : "See more")}
                    </button>
                  )}
                  {product.tag && (
                    <div className="mt-4 flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg border border-border/50">
                      <Info className="w-4 h-4 text-primary" />
                      <span>{t.products.productInfo.replace("{tag}", product.tag.toLowerCase())}</span>
                    </div>
                  )}
                </div>

                {/* Share */}
                <div className="mb-6">
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(productUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      } catch { }
                    }}
                    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    {copiedLink
                      ? (language === "es" ? "Enlace copiado" : "Link copied")
                      : (language === "es" ? "Copiar enlace" : "Copy link")}
                  </button>
                </div>

                {/* Quantity & Add to Cart */}
                <div className="mt-auto space-y-4 pt-6 border-t border-border/50">
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-sm font-bold text-foreground uppercase tracking-tight">{t.products.quantity}</span>
                      <div
                        className={`flex items-center gap-2 text-[10px] md:text-xs font-black px-2.5 py-1 rounded-md border transition-all duration-300 ${product.stock > 5
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : product.stock > 0
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full animate-pulse ${product.stock > 5
                            ? "bg-green-500"
                            : product.stock > 0
                              ? "bg-amber-500"
                              : "bg-red-500"
                            }`}
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
                        <span className="w-10 text-center font-bold text-base select-none">{quantity}</span>
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

                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddToCart}
                      disabled={added || product.stock === 0}
                      className={`flex-1 py-6 rounded-xl font-display text-lg font-bold shadow-lg transition-all ${added
                        ? "bg-green-600 hover:bg-green-700 shadow-green-600/20 text-[#fefce8]"
                        : product.stock === 0
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] active:shadow-inner border border-[#fcd200]"
                        }`}
                    >
                      {added ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" /> {t.products.added}
                        </span>
                      ) : product.stock === 0 ? (
                        <span>{t.products.noStock}</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5" />
                          {t.products.addToCart}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
              <section className="mt-16 md:mt-24">
                <h2 className="font-display text-2xl font-black mb-8">
                  {language === "es" ? "Productos Relacionados" : "Related Products"}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedProducts.map((rp) => (
                    <Link
                      key={rp.id}
                      href={`/products/${rp.id}`}
                      className="group bg-card border border-border rounded-2xl p-4 hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="aspect-square bg-secondary/40 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                        {rp.images && rp.images[0]?.trim() ? (
                          <Image
                            src={getDeterministicImage(rp.images[0], rp.id!)}
                            alt={rp.name}
                            width={200}
                            height={200}
                            className="object-contain p-2 w-full h-full group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <span className="text-4xl">{rp.emoji || "📦"}</span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {rp.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex text-[#ffa41c]">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= Math.round(rp.ratingAverage ?? 0) ? "fill-current" : "text-muted-foreground/20"}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {rp.ratingCount ? `(${rp.ratingCount})` : ""}
                        </span>
                      </div>
                      <p className="font-display font-black text-primary">
                        {formatPrice(Number(rp.price))}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Expanded Image Lightbox */}
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
                  animate={{ opacity: 1, scale: isZoomed ? 2 : 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`max-w-[95vw] max-h-[90vh] relative shadow-2xl transition-all duration-300 w-full h-full ${isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
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
