import { product as fertilizante } from "./fertilizante-organico-premium";
import { product as semillas } from "./semillas-certificadas-maiz";
import { product as motoguadana } from "./motoguadana-profesional";
import { product as herbicida } from "./herbicida-ecologico";
import { product as riego } from "./sistema-de-riego-por-goteo";
import { product as cal } from "./cal-agricola-dolomitica";
import { Product } from "@/types";

// Next.js (Webpack/Turbopack) does not support import.meta.glob like Vite.
// We'll use a manual approach for the products that have photos.
// In this case, only "fertilizante-organico-premium" has photos.

const productsList: Product[] = [
  {
    ...fertilizante,
    photos: [
      "/products/fertilizante-organico-premium/photos/1.png",
      "/products/fertilizante-organico-premium/photos/2.png",
    ],
  },
  { ...semillas, photos: [] },
  { ...motoguadana, photos: [] },
  { ...herbicida, photos: [] },
  { ...riego, photos: [] },
  { ...cal, photos: [] },
];

export const productsValue: Product[] = productsList;
export { productsValue as products };
