"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Tag, Hash, Calendar, Box, Image as ImageIcon, Edit2, Save, AlertCircle, Plus, Trash2, Search, Check } from "lucide-react";
import { CopyToClipboard } from "@/frontend/components/shared/CopyToClipboard";
import type { Product } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logger from "@/utils/logger";
import { GenerateDescriptionButton } from "@/frontend/components/ai";

const log = logger.child("src/frontend/components/shared/productos/ProductDetailPanel.tsx");

import { FieldConfig, PRODUCT_FIELDS } from "./productFields.config";

interface ProductDetailPanelProps {
  product: (Product & { categories?: any[]; store?: any }) | null;
  onClose: () => void;
  // Edit props
  availableCategories?: string[];
  onSubmitUpdate?: (productId: string, payload: any) => Promise<boolean>;
  onDeleteProduct?: (productId: string) => Promise<boolean>;
  onGenerateDescription?: (name: string, categories: string[], tags: string) => Promise<string>;
}

export function ProductDetailPanel({ 
  product, 
  onClose,
  availableCategories = [],
  onSubmitUpdate,
  onDeleteProduct,
  onGenerateDescription,
}: ProductDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [newImage, setNewImage] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryFocused, setIsCategoryFocused] = useState(false);

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: Number(product.stock),
        unidad: product.unidad,
        tag: product.tag,
        emoji: product.emoji,
      });
      setCategoriesList(product.categories?.map((c: any) => c.name) || []);
      setImagesList(product.images || []);
      setIsEditing(false); // Reset to view mode on new product
      setShowDeleteConfirm(false);
    }
  }, [product]);

  if (!product) return null;

  const hasStock = Number(product.stock) > 0;
  const stockClass = hasStock
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    : "bg-red-500/10 text-red-500 border-red-500/20";

  // --- Edit Logic ---
  const filteredCategories = newCategory.trim() === ""
    ? availableCategories
    : availableCategories.filter(cat =>
        cat.toLowerCase().includes(newCategory.toLowerCase())
      );

  const showDropdown = isCategoryFocused && (filteredCategories.length > 0 || newCategory.trim() !== "");

  const handleAddCategory = () => {
    if (newCategory.trim() !== "" && !categoriesList.includes(newCategory.trim())) {
      setCategoriesList(prev => [...prev, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const toggleCategory = (cat: string) => {
    if (categoriesList.includes(cat)) {
      setCategoriesList(prev => prev.filter(c => c !== cat));
    } else {
      setCategoriesList(prev => [...prev, cat]);
    }
  };

  const selectCategory = (cat: string) => {
    if (!categoriesList.includes(cat)) {
      setCategoriesList(prev => [...prev, cat]);
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setCategoriesList(prev => prev.filter(c => c !== categoryToRemove));
  };

  const handleAddImage = () => {
    if (newImage.trim() !== "") {
      setImagesList(prev => [...prev, newImage.trim()]);
      setNewImage("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "price" || name === "stock") {
      setFormData((prev: any) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!onSubmitUpdate) return;
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        categories: categoriesList,
        images: imagesList,
      };

      const success = await onSubmitUpdate(product.id, dataToSave);
      if (success) {
        setIsEditing(false); // Back to view mode
      }
    } catch (error) {
      log.error("Error saving edited product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !onDeleteProduct) return;
    setIsDeleting(true);
    try {
      const success = await onDeleteProduct(product.id);
      if (success) {
        onClose();
      }
    } catch (error) {
      log.error("Error deleting product:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={loading ? undefined : onClose}
          className="fixed inset-0 backdrop-blur-[3px] z-40 cursor-pointer"
        />

        {/* Side Panel */}
        <motion.div
          key="panel"
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="min-w-0 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight truncate">
                  {isEditing ? "Editar Producto" : product.name}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  ID: {product.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && onSubmitUpdate && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-all"
                  title="Editar Producto"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                disabled={loading}
                className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
            {isEditing ? (
              // --- EDIT MODE ---
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {PRODUCT_FIELDS.filter(f => !f.hideInEdit).map(field => {
                    const colSpanClass = field.colSpan === 2 ? "col-span-2" : "col-span-1";
                    
                    if (field.type === "custom-categories") {
                      return (
                        <div key={field.name} className={colSpanClass}>
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                            {field.editLabelIcon}{field.editLabel || field.label}
                          </label>
                          <div className="relative">
                            <div className="relative flex items-center">
                              <div className="absolute left-3 text-muted-foreground/50">
                                <Search className="h-4 w-4" />
                              </div>
                              <input
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddCategory();
                                  }
                                }}
                                onFocus={() => setIsCategoryFocused(true)}
                                onBlur={() => setTimeout(() => setIsCategoryFocused(false), 200)}
                                className={`w-full border border-border/50 bg-background pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none transition-all placeholder:text-muted-foreground/40
                                  ${showDropdown
                                    ? 'rounded-t-xl border-b-transparent focus:ring-0 shadow-[0_4px_20px_-10px_rgba(var(--primary),0.3)]'
                                    : 'rounded-xl focus:ring-2 focus:ring-primary/30 shadow-sm'
                                  }`}
                                placeholder="Buscar o crear categoría..."
                              />
                            </div>
                            <AnimatePresence>
                              {showDropdown && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute z-20 w-full top-full bg-card border border-border/50 border-t-0 rounded-b-xl shadow-[0_15px_30px_-15px_rgba(var(--primary),0.2)] max-h-48 overflow-y-auto custom-scrollbar p-1"
                                >
                                  {filteredCategories.length > 0 ? (
                                    filteredCategories.map(cat => {
                                      const isSelected = categoriesList.includes(cat);
                                      return (
                                        <button
                                          key={cat}
                                          type="button"
                                          onClick={() => toggleCategory(cat)}
                                          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group text-left ${
                                            isSelected
                                              ? 'bg-primary/10 text-primary'
                                              : 'hover:bg-secondary/70 text-foreground/90'
                                          }`}
                                        >
                                          <span className="flex items-center gap-2">
                                            <span className={`flex items-center justify-center h-4 w-4 rounded border transition-all ${
                                              isSelected
                                                ? 'bg-primary border-primary text-primary-foreground'
                                                : 'border-border/70 group-hover:border-primary/50'
                                            }`}>
                                              {isSelected && <Check className="h-3 w-3" />}
                                            </span>
                                            {cat}
                                          </span>
                                          {!isSelected && (
                                            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Plus className="h-3.5 w-3.5" />
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })
                                  ) : null}

                                  {newCategory.trim() !== "" && !availableCategories.some(c => c.toLowerCase() === newCategory.trim().toLowerCase()) && (
                                    <button
                                      type="button"
                                      onClick={handleAddCategory}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors text-left border-t border-border/30 mt-1 pt-2"
                                    >
                                      <div className="flex items-center justify-center bg-primary/20 rounded-md p-1">
                                        <Plus className="h-3.5 w-3.5" />
                                      </div>
                                      Crear &quot;{newCategory.trim()}&quot;
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          {categoriesList.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 max-h-32 overflow-y-auto custom-scrollbar p-1">
                              <AnimatePresence>
                                {categoriesList.map((cat, index) => (
                                  <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    key={index}
                                    className="flex items-center gap-1.5 bg-background border border-border shadow-sm text-foreground text-xs font-bold px-3 py-1.5 rounded-full"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {cat}
                                    <button type="button" onClick={() => handleRemoveCategory(cat)} className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full p-0.5 transition-colors ml-1">
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (field.type === "custom-images") {
                      return (
                        <div key={field.name} className={colSpanClass}>
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                            {field.editLabelIcon}{field.editLabel || field.label}
                          </label>
                          <div className="flex gap-2 mb-3">
                            <input
                              type="url"
                              value={newImage}
                              onChange={(e) => setNewImage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddImage();
                                }
                              }}
                              className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="https://ejemplo.com/imagen.jpg"
                            />
                            <Button
                              type="button"
                              onClick={handleAddImage}
                              variant="secondary"
                              className="rounded-xl px-3"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {imagesList.length > 0 && (
                            <div className="space-y-2 mt-2">
                              {imagesList.map((url, index) => (
                                <div key={index} className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-lg border border-border/50">
                                  <span className="text-xs truncate max-w-[200px]" title={url}>{url}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={field.name} className={colSpanClass}>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                          {field.editLabelIcon}{field.editLabel || field.label}
                        </label>
                        {field.type === "textarea" ? (
                          <div className="space-y-1.5">
                            <textarea
                              name={field.name}
                              value={formData[field.name] || ""}
                              onChange={handleChange}
                              rows={3}
                              className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none custom-scrollbar"
                              placeholder={field.placeholder}
                            />
                            {field.name === "description" && onGenerateDescription && (
                              <GenerateDescriptionButton
                                name={formData.name || ""}
                                categories={categoriesList}
                                tags={formData.tag || ""}
                                onGenerate={onGenerateDescription}
                                onGenerated={(text) => setFormData((prev: any) => ({ ...prev, description: text }))}
                              />
                            )}
                          </div>
                        ) : (
                          <input
                            name={field.name}
                            type={field.type}
                            step={field.step}
                            value={
                              field.type === "number" 
                                ? (formData[field.name] !== undefined ? String(formData[field.name]) : "")
                                : (formData[field.name] || "")
                            }
                            onChange={handleChange}
                            className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    );
                  })}
                  
                  <div className="col-span-2 flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-primary/80 leading-relaxed font-medium">
                      Verifica todos los datos antes de guardar. Si cambias el precio, afectará solo a los nuevos pedidos.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // --- VIEW MODE ---
              <>
                {/* Product Image */}
                <section>
                  <div className="aspect-[16/10] w-full rounded-2xl bg-secondary/50 flex items-center justify-center border border-border/50 overflow-hidden shadow-inner group relative">
                    {product.images?.[0] ? (
                      <>
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {product.emoji && (
                          <div className="absolute bottom-3 right-3 text-2xl bg-background/50 backdrop-blur-sm rounded-full p-1.5 border border-border/50 shadow-sm">
                            {product.emoji}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
                        <ImageIcon className="h-12 w-12" />
                        <span className="text-xs font-bold uppercase tracking-wider">Sin Imagen</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Status Badges */}
                <section>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn("rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-sm", stockClass)}>
                      {hasStock ? `Stock: ${Number(product.stock)}` : "Agotado"}
                    </Badge>
                    {product.categories && product.categories.length > 0 && (
                      <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-bold shadow-sm">
                        <Tag className="h-3 w-3 mr-1 inline" />
                        {product.categories.map((c: any) => c.name).join(", ")}
                      </Badge>
                    )}
                  </div>
                </section>

                {/* Dynamic Sections */}
                {PRODUCT_FIELDS.filter(f => f.viewStyle === 'section').map(field => (
                  <section key={field.name}>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {field.label}
                    </h3>
                    <div className={field.name === 'price' ? "p-4 rounded-2xl bg-secondary/30 border border-border/50" : "bg-secondary/30 rounded-xl p-4"}>
                      {field.renderView?.(product[field.name as keyof typeof product], product)}
                    </div>
                  </section>
                ))}

                {/* Extra Meta Data */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Información Adicional
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {PRODUCT_FIELDS.filter(f => f.viewStyle === 'grid-item').map(field => (
                      <div key={field.name} className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                          {field.icon} {field.label}
                        </p>
                        {field.renderView ? (
                          field.renderView(product[field.name as keyof typeof product], product)
                        ) : (
                          <p className="text-xs font-bold text-foreground/90">
                            {product[field.name as keyof typeof product] as React.ReactNode}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Footer */}
          {isEditing ? (
            <div className="px-6 py-4 border-t border-border bg-card/80 backdrop-blur-md shrink-0">
              <AnimatePresence mode="wait">
                {showDeleteConfirm ? (
                  <motion.div
                    key="delete-confirm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <p className="text-sm font-bold text-red-500 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      ¿Eliminar producto? Irreversible.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        className="rounded-xl font-bold"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="rounded-xl font-bold shadow-md bg-red-600 text-white hover:bg-red-700 shadow-red-600/20 hover:shadow-red-600/40"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "..." : "Eliminar"}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="actions"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-4"
                  >
                    {onDeleteProduct && (
                      <Button
                        variant="ghost"
                        className="rounded-xl font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={loading}
                      >
                        Eliminar
                      </Button>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        className="rounded-xl font-bold px-6"
                        onClick={() => {
                          setIsEditing(false);
                          setShowDeleteConfirm(false);
                        }}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="rounded-xl font-bold px-8 shadow-md shadow-primary/20 transition-all hover:shadow-primary/40"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                            Guardando...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Guardar
                          </div>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="px-6 py-4 border-t border-border shrink-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Creado: {format(new Date(product.createdAt), "dd MMM yyyy", { locale: es })}</span>
                <span className="font-medium text-foreground/70">
                  {product.store?.name || ""}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </>
    </AnimatePresence>
  );
}
