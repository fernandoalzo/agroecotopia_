"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle, ImageIcon, Plus, Trash2, Search, Check } from "lucide-react";
import { Product } from "@prisma/client";
import { Button } from "@/components/ui/button";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/shared/productos/ProductEditModal.tsx");

interface ProductEditModalProps {
  product: (Product & { categories?: any[] }) | null;
  onClose: () => void;
  storeId?: string;
  availableCategories: string[];
  onSubmitForm: (productId: string, payload: any) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
}

export const ProductEditModal = ({
  product,
  onClose,
  storeId,
  availableCategories,
  onSubmitForm,
  onDeleteProduct
}: ProductEditModalProps) => {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [newImage, setNewImage] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryFocused, setIsCategoryFocused] = useState(false);

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
    }
  }, [product]);

  if (!product) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Numeric conversions
    if (name === "price" || name === "stock") {
      setFormData((prev: any) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        categories: categoriesList,
        images: imagesList,
      };

      const success = await onSubmitForm(product.id, dataToSave);
      if (success) {
        onClose();
      }
    } catch (error) {
      log.error("Error saving edited product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
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
              <h2 className="text-xl font-black tracking-tight text-foreground">Editar Producto</h2>
              <p className="text-xs font-bold text-muted-foreground">ID: {product.id}</p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-muted text-muted-foreground transition-all disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Nombre del Producto</label>
                  <input
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Ej. Tomate Cherry"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Precio ($)</label>
                    <input
                      name="price"
                      type="number"
                      value={formData.price || ""}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Ej. 15000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Stock</label>
                    <input
                      name="stock"
                      type="number"
                      step="0.01"
                      value={formData.stock !== undefined ? String(formData.stock) : ""}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Ej. 50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Etiqueta (Tag)</label>
                    <input
                      name="tag"
                      value={formData.tag || ""}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Ej. Orgánico, Nuevo"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Emoji</label>
                    <input
                      name="emoji"
                      value={formData.emoji || ""}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Ej. 🍅"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Categorías</label>
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
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Unidad</label>
                    <input
                      name="unidad"
                      value={formData.unidad || ""}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Ej. kg, ud, manojo"
                    />
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
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Descripción</label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none custom-scrollbar"
                placeholder="Descripción detallada del producto..."
              />
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary/80 leading-relaxed font-medium">
                Verifica todos los datos antes de guardar. Si cambias el precio, afectará solo a los nuevos pedidos.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 z-20 px-6 py-4 border-t border-border/50 bg-card/80 backdrop-blur-md">
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
                    ¿Estás seguro de eliminar este producto? Esta acción es irreversible.
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
                      {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
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
                  <Button
                    variant="ghost"
                    className="rounded-xl font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                  >
                    Eliminar Producto
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold px-6"
                      onClick={onClose}
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
                          Guardar Cambios
                        </div>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
