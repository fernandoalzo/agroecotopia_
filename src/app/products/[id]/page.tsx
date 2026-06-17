import { Metadata } from "next";
import { notFound } from "next/navigation";
import { config } from "@/config/config";
import {
  getProductByIdAction,
  getRelatedProductsAction,
} from "@/backend/modules/product/product.actions";
import { ProductDetailClient } from "@/components/products/ProductDetailClient";
import logger from "@/utils/logger";

const log = logger.child("src/app/products/[id]/page.tsx");

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProductByIdAction(id);
    if (product) {
      return { title: `${product.name} | ${config.app.name}` };
    }
  } catch {}
  return { title: `Producto | ${config.app.name}` };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  log.info("Renderizando página de detalle de producto:", { productId: id });

  const [product, relatedProducts] = await Promise.all([
    getProductByIdAction(id),
    getRelatedProductsAction(id, 8),
  ]);

  if (!product) {
    log.warn("Producto no encontrado:", { productId: id });
    notFound();
  }

  return <ProductDetailClient product={product as any} relatedProducts={relatedProducts as any[]} />;
}
