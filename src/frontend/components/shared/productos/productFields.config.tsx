import React from "react";
import { Package, Box, Hash, Calendar, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CopyToClipboard } from "@/frontend/components/shared/CopyToClipboard";

export type FieldConfig = {
  name: string;
  label: string;
  editLabel?: string;
  placeholder?: string;
  type: "text" | "number" | "textarea" | "checkbox" | "custom-categories" | "custom-images" | "none";
  colSpan?: 1 | 2;
  step?: string;
  icon?: React.ReactNode;
  hideInEdit?: boolean;
  viewStyle?: "section" | "grid-item" | "none";
  renderView?: (val: any, product: any) => React.ReactNode;
  editLabelIcon?: React.ReactNode;
  valueAsNumber?: boolean;
};

export const PRODUCT_FIELDS: FieldConfig[] = [
  {
    name: "name",
    label: "Nombre del Producto",
    placeholder: "Ej. Tomate Cherry Orgánico",
    type: "text",
    colSpan: 2,
    viewStyle: "none",
  },
  {
    name: "price",
    label: "Precio de Venta",
    editLabel: "Precio ($)",
    placeholder: "Ej. 15000",
    type: "number",
    valueAsNumber: true,
    colSpan: 1,
    viewStyle: "section",
    renderView: (val, p) => (
      <p className="text-3xl font-black text-foreground flex items-baseline gap-1">
        ${Number(val).toLocaleString("es-CO")}
        <span className="text-sm font-medium text-muted-foreground">/{p.unidad || "ud"}</span>
      </p>
    )
  },
  {
    name: "stock",
    label: "Stock exacto",
    editLabel: "Stock",
    placeholder: "Ej. 50",
    type: "number",
    valueAsNumber: true,
    colSpan: 1,
    step: "1",
    icon: <Package className="h-3 w-3" />,
    viewStyle: "grid-item",
    renderView: (val) => Number(val)
  },
  {
    name: "tag",
    label: "Etiqueta",
    editLabel: "Etiqueta (Tag)",
    placeholder: "Ej. Orgánico, Nuevo",
    type: "text",
    colSpan: 1,
    icon: <Box className="h-3 w-3" />,
    viewStyle: "grid-item",
    renderView: (val) => val || "N/A"
  },
  {
    name: "unidad",
    label: "Unidad",
    placeholder: "Ej. kg, ud, manojo",
    type: "text",
    colSpan: 1,
    viewStyle: "none"
  },
  {
    name: "emoji",
    label: "Emoji",
    placeholder: "Ej. 🍅",
    type: "text",
    colSpan: 1,
    viewStyle: "none"
  },
  {
    name: "peso",
    label: "Peso (kg)",
    placeholder: "Ej. 1.5",
    type: "number",
    valueAsNumber: true,
    colSpan: 1,
    step: "0.01",
    viewStyle: "grid-item",
    icon: <Package className="h-3 w-3" />,
    renderView: (val) => val ? `${val} kg` : "N/A"
  },
  {
    name: "dimensiones",
    label: "Dimensiones",
    placeholder: "Ej. 10x10x10 cm",
    type: "text",
    colSpan: 1,
    viewStyle: "grid-item",
    icon: <Box className="h-3 w-3" />,
    renderView: (val) => val || "N/A"
  },
  {
    name: "envioGratis",
    label: "Envío Gratis",
    type: "checkbox",
    colSpan: 2,
    viewStyle: "none",
  },
  {
    name: "categories",
    label: "Categorías",
    type: "custom-categories",
    colSpan: 2,
    viewStyle: "none"
  },
  {
    name: "images",
    label: "Imágenes (URLs)",
    type: "custom-images",
    colSpan: 2,
    editLabelIcon: <ImageIcon className="h-3 w-3 inline mr-1" />,
    viewStyle: "none"
  },
  {
    name: "description",
    label: "Descripción",
    placeholder: "Descripción detallada del producto...",
    type: "textarea",
    colSpan: 2,
    viewStyle: "section",
    renderView: (val) => (
      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
        {val || "Sin descripción detallada."}
      </p>
    )
  },
  {
    name: "id",
    label: "ID",
    type: "none",
    icon: <Hash className="h-3 w-3" />,
    viewStyle: "grid-item",
    hideInEdit: true,
    renderView: (val) => (
      <div className="flex items-center gap-1">
        <p className="text-xs font-bold truncate text-foreground/90">{val}</p>
        <CopyToClipboard text={val} iconClassName="h-3 w-3" />
      </div>
    )
  },
  {
    name: "createdAt",
    label: "Creado",
    type: "none",
    icon: <Calendar className="h-3 w-3" />,
    viewStyle: "grid-item",
    hideInEdit: true,
    renderView: (val) => format(new Date(val), "dd MMM yyyy", { locale: es })
  }
];
