"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle, ImageIcon, Plus, Trash2, Search, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { getProductSchema, ProductFormValues } from "./schemas/productSchema";
import { Store } from "lucide-react";
import { useLanguage } from "@/frontend/context/LanguageContext";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/shared/productos/ProductCreateModal.tsx");

interface ProductCreateModalProps {
  onClose: () => void;
  storeId?: string;
  availableCategories: string[];
  storesList?: {id: string, name: string}[];
  onSubmitForm: (payload: any, targetStoreId?: string) => Promise<boolean>;
}

export const ProductCreateModal = ({
  onClose,
  storeId,
  availableCategories,
  storesList = [],
  onSubmitForm,
}: ProductCreateModalProps) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [newImage, setNewImage] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryFocused, setIsCategoryFocused] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  // Show all categories when input is empty, or filter when typing
  const filteredCategories = newCategory.trim() === ""
    ? availableCategories
    : availableCategories.filter(cat =>
        cat.toLowerCase().includes(newCategory.toLowerCase())
      );

  // Determine if dropdown should be visible
  const showDropdown = isCategoryFocused && (filteredCategories.length > 0 || newCategory.trim() !== "");

  const handleAddCategory = () => {
    if (newCategory.trim() !== "" && !categoriesList.includes(newCategory.trim())) {
      const updatedList = [...categoriesList, newCategory.trim()];
      setCategoriesList(updatedList);
      setValue("categories", updatedList, { shouldValidate: true });
      setNewCategory("");
    }
  };

  const toggleCategory = (cat: string) => {
    if (categoriesList.includes(cat)) {
      const updatedList = categoriesList.filter(c => c !== cat);
      setCategoriesList(updatedList);
      setValue("categories", updatedList, { shouldValidate: true });
    } else {
      const updatedList = [...categoriesList, cat];
      setCategoriesList(updatedList);
      setValue("categories", updatedList, { shouldValidate: true });
    }
  };

  const selectCategory = (cat: string) => {
    if (!categoriesList.includes(cat)) {
      const updatedList = [...categoriesList, cat];
      setCategoriesList(updatedList);
      setValue("categories", updatedList, { shouldValidate: true });
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    const updatedList = categoriesList.filter(c => c !== categoryToRemove);
    setCategoriesList(updatedList);
    setValue("categories", updatedList, { shouldValidate: true });
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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(getProductSchema(t)),
    defaultValues: {
      name: "",
      description: "",
      price: "" as any,
      stock: "" as any,
      categories: [],
      unidad: "",
      tag: "",
      emoji: "",
      imagesText: "",
      peso: "" as any,
      dimensiones: "",
      envioGratis: false,
    },
  });

  const onSubmit = async (data: any) => {
    if (loading) return;
    setLoading(true);
    try {
      const payload = {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock as any, // Cast to any to bypass strict Prisma Decimal check
        categories: categoriesList,
        unidad: data.unidad,
        tag: data.tag || "",
        emoji: data.emoji || "",
        images: imagesList,
        peso: data.peso ? Number(data.peso) : null,
        dimensiones: data.dimensiones || null,
        envioGratis: data.envioGratis || false,
      };

      const targetStoreId = storeId || selectedStoreId;

      if (!storeId && !targetStoreId) {
        // Simple UI validation
        setLoading(false);
        return;
      }

      const success = await onSubmitForm(payload, targetStoreId);
      if (success) {
        onClose();
      }
    } catch (error) {
      log.error("Error submitting product create modal:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loading ? undefined : onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-all duration-300"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border/50 bg-card shadow-2xl shadow-primary/5 custom-scrollbar"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/80 backdrop-blur-md">
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground">Crear Nuevo Producto</h2>
              <p className="text-xs font-bold text-muted-foreground">Añadir al catálogo general</p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-muted text-muted-foreground transition-all disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Nombre del Producto <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("name")}
                      className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Ej. Tomate Cherry Orgánico"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message as string}</p>}
                  </div>

                  {!storeId && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Tienda Asignada <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                          <Store className="h-4 w-4" />
                        </div>
                        <select
                          value={selectedStoreId}
                          onChange={(e) => setSelectedStoreId(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-border/50 bg-background pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                          required
                        >
                          <option value="" disabled>Selecciona una tienda</option>
                          {storesList.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Precio ($) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        {...register("price", { valueAsNumber: true })}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Ej. 15000"
                      />
                      {errors.price && <p className="text-red-500 text-xs mt-1 font-medium">{errors.price.message as string}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Stock <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        {...register("stock", { valueAsNumber: true })}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Ej. 50"
                      />
                      {errors.stock && <p className="text-red-500 text-xs mt-1 font-medium">{errors.stock.message as string}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Etiqueta (Tag)
                      </label>
                      <input
                        {...register("tag")}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Ej. Orgánico, Nuevo"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Emoji
                      </label>
                      <input
                        {...register("emoji")}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Ej. 🍅"
                      />
                    </div>
                  </div>

                  {/* Shipping Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("peso", { valueAsNumber: true })}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Ej. 1.5"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Dimensiones
                      </label>
                      <input
                        {...register("dimensiones")}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Ej. 10x10x10 cm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 bg-secondary/30 p-3 rounded-xl border border-border/50">
                    <input
                      type="checkbox"
                      id="envioGratis"
                      {...register("envioGratis")}
                      className="rounded border-border/50 text-primary focus:ring-primary/30"
                    />
                    <label htmlFor="envioGratis" className="text-sm font-bold text-foreground cursor-pointer">
                      Envío Gratis
                    </label>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Categorías <span className="text-red-500">*</span>
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
                      {errors.categories && <p className="text-red-500 text-xs mt-1 font-medium">{errors.categories.message as string}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Unidad <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register("unidad")}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Ej. kg, ud, manojo"
                      />
                      {errors.unidad && <p className="text-red-500 text-xs mt-1 font-medium">{errors.unidad.message as string}</p>}
                    </div>
                  </div>



                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      <ImageIcon className="h-3 w-3 inline mr-1" />
                      Imágenes (URLs)
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
                </div>
              </div>

              {/* Description (Full Width) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none custom-scrollbar"
                  placeholder="Descripción detallada del producto..."
                />
                {errors.description && <p className="text-red-500 text-xs mt-1 font-medium">{errors.description.message as string}</p>}
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary/80 leading-relaxed font-medium">
                  Una vez creado, el producto estará visible en el catálogo inmediatamente.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 z-20 flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t border-border/50 bg-card/80 backdrop-blur-md">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl font-bold px-6"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl font-bold px-8 shadow-md shadow-primary/20 transition-all hover:shadow-primary/40"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    Creando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Crear Producto
                  </div>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
