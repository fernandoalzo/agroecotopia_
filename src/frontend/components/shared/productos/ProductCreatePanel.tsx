"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle, ImageIcon, Plus, Trash2, Search, Check, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { getProductSchema, ProductFormValues } from "./schemas/product.schema";
import { Store } from "lucide-react";
import { useLanguage } from "@/frontend/context/LanguageContext";
import logger from "@/utils/logger";
import { PRODUCT_FIELDS, FieldConfig } from "./productFields.config";
import { GenerateDescriptionButton } from "@/frontend/components/ai";
import { SidePanel } from "@/frontend/components/ui/side-panel";

const log = logger.child("src/frontend/components/shared/productos/ProductCreatePanel.tsx");

interface ProductCreatePanelProps {
  open: boolean;
  onClose: () => void;
  storeId?: string;
  availableCategories: string[];
  storesList?: {id: string, name: string}[];
  onSubmitForm: (payload: any, targetStoreId?: string) => Promise<boolean>;
  onGenerateDescription?: (name: string, categories: string[], tags: string) => Promise<string>;
}

export const ProductCreatePanel = ({
  open,
  onClose,
  storeId,
  availableCategories,
  storesList = [],
  onSubmitForm,
  onGenerateDescription,
}: ProductCreatePanelProps) => {
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
    watch,
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
    <SidePanel
      open={open}
      onClose={onClose}
      title="Crear Nuevo Producto"
      subtitle="Añadir un nuevo producto al catálogo"
      icon={<Package className="h-4 w-4 text-primary" />}
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="product-create-form"
            className="flex-1"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creando...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Producto
              </>
            )}
          </Button>
        </div>
      }
    >
      <form id="product-create-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {(() => {
                const leftColumnNames = ["name", "price", "stock", "tag", "emoji", "peso", "dimensiones", "envioGratis"];
                const rightColumnNames = ["categories", "unidad", "images"];
                const fullWidthNames = ["description"];
                const requiredFields = ["name", "price", "stock", "categories", "unidad", "description"];

                const renderField = (field: FieldConfig) => {
                  const colSpanClass = field.colSpan === 2 ? "col-span-2" : "col-span-1";
                  const isRequired = requiredFields.includes(field.name);

                  if (field.type === "custom-categories") {
                    return (
                      <div key={field.name} className={colSpanClass}>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                          {field.editLabelIcon}{field.editLabel || field.label} {isRequired && <span className="text-red-500">*</span>}
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
                    );
                  }

                  if (field.type === "custom-images") {
                    return (
                      <div key={field.name} className={colSpanClass}>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                          {field.editLabelIcon}{field.editLabel || field.label} {isRequired && <span className="text-red-500">*</span>}
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

                  if (field.type === "checkbox") {
                    return (
                      <div key={field.name} className={`${colSpanClass} flex items-center gap-2 mt-2 bg-secondary/30 p-3 rounded-xl border border-border/50`}>
                        <input
                          type="checkbox"
                          id={field.name}
                          {...register(field.name)}
                          className="rounded border-border/50 text-primary focus:ring-primary/30"
                        />
                        <label htmlFor={field.name} className="text-sm font-bold text-foreground cursor-pointer">
                          {field.label}
                        </label>
                      </div>
                    );
                  }

                  return (
                    <div key={field.name} className={colSpanClass}>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        {field.editLabelIcon}{field.editLabel || field.label} {isRequired && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === "textarea" ? (
                        <div className="space-y-1.5">
                          <textarea
                            {...register(field.name)}
                            rows={3}
                            className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none custom-scrollbar"
                            placeholder={field.placeholder}
                          />
                          {field.name === "description" && onGenerateDescription && (
                            <GenerateDescriptionButton
                              name={watch("name") || ""}
                              categories={categoriesList}
                              tags={watch("tag") || ""}
                              onGenerate={onGenerateDescription}
                              onGenerated={(text) => setValue("description", text, { shouldValidate: true })}
                            />
                          )}
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          step={field.step}
                          {...register(field.name, { valueAsNumber: field.valueAsNumber })}
                          className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder={field.placeholder}
                        />
                      )}
                      {errors[field.name] && <p className="text-red-500 text-xs mt-1 font-medium">{errors[field.name]?.message as string}</p>}
                    </div>
                  );
                };

                return (
                  <div className="space-y-8">
                    {/* Sección 1: Información Principal */}
                    <div className="space-y-4">
                      <div className="border-b border-border/50 pb-2 mb-4">
                        <h3 className="text-sm font-bold text-foreground">Información Principal</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          {PRODUCT_FIELDS.filter(f => f.name === "name").map(renderField)}
                          {!storeId && (
                            <div className="mt-4">
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
                        </div>
                        <div className="col-span-2">
                          {PRODUCT_FIELDS.filter(f => f.name === "categories").map(renderField)}
                        </div>
                        {PRODUCT_FIELDS.filter(f => ["tag", "emoji"].includes(f.name)).map(renderField)}
                      </div>
                    </div>

                    {/* Sección 2: Precio e Inventario */}
                    <div className="space-y-4">
                      <div className="border-b border-border/50 pb-2 mb-4">
                        <h3 className="text-sm font-bold text-foreground">Precio e Inventario</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {PRODUCT_FIELDS.filter(f => ["price", "stock", "unidad"].includes(f.name)).map(renderField)}
                      </div>
                    </div>

                    {/* Sección 3: Logística y Envíos */}
                    <div className="space-y-4">
                      <div className="border-b border-border/50 pb-2 mb-4">
                        <h3 className="text-sm font-bold text-foreground">Logística y Envíos</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {PRODUCT_FIELDS.filter(f => ["peso", "dimensiones"].includes(f.name)).map(renderField)}
                        <div className="col-span-2">
                          {PRODUCT_FIELDS.filter(f => f.name === "envioGratis").map(renderField)}
                        </div>
                      </div>
                    </div>

                    {/* Sección 4: Multimedia */}
                    <div className="space-y-4">
                      <div className="border-b border-border/50 pb-2 mb-4">
                        <h3 className="text-sm font-bold text-foreground">Multimedia</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {PRODUCT_FIELDS.filter(f => f.name === "images").map(field => {
                          const f = { ...field, colSpan: 1 } as FieldConfig;
                          return renderField(f);
                        })}
                      </div>
                    </div>

                    {/* Sección 5: Detalles */}
                    <div className="space-y-4">
                      <div className="border-b border-border/50 pb-2 mb-4">
                        <h3 className="text-sm font-bold text-foreground">Detalles del Producto</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {PRODUCT_FIELDS.filter(f => f.name === "description").map(renderField)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 mt-6">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary/80 leading-relaxed font-medium">
                  Una vez creado, el producto estará visible en el catálogo inmediatamente.
                </p>
              </div>
      </form>
    </SidePanel>
  );
};
