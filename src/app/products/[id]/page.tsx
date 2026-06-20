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
      const description = product.description?.length > 200
        ? `${product.description.slice(0, 200)}...`
        : product.description || "";
      const firstImage = product.images?.[0]?.trim() || undefined;
      const url = `${config.app.url}/products/${id}`;

      return {
        title: `${product.name} | ${config.app.name}`,
        description,
        openGraph: {
          title: product.name,
          description,
          url,
          siteName: config.app.name,
          type: "website",
          ...(firstImage ? { images: [{ url: firstImage, width: 800, height: 800 }] } : {}),
        },
        twitter: {
          card: "summary_large_image",
          title: product.name,
          description,
          ...(firstImage ? { images: [firstImage] } : {}),
        },
        alternates: { canonical: url },
      };
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
