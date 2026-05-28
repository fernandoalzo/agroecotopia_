import HeroSection from "@/components/home/HeroSection";
import ProductsSection from "@/components/home/ProductsSection";
import Footer from "@/components/Footer";
import Link from "next/link";
import { getPaginatedProductsAction } from "@/backend/modules/product/product.actions";
import logger from "@/utils/logger";

const log = logger.child("src/app/page.tsx");

export const dynamic = "force-dynamic";

export default async function Home() {
  log.info("Renderizando página de inicio (Home Page).");

  let products: any[] = [];
  try {
    log.debug("Página de inicio: consultando catálogo de productos.");
    const result = await getPaginatedProductsAction(1, 40);
    products = result.products;
    log.debug("Página de inicio: catálogo de productos cargado exitosamente.", { totalProductos: products.length });
  } catch (error) {
    log.error("Página de inicio: error al cargar el catálogo de productos:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <main>
        <ProductsSection initialProducts={products} />
        {/* Story Teaser (Optional: simplified preview) */}
        <div className="py-24 bg-secondary/10 border-y border-border/50">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="font-display text-3xl font-black text-foreground md:text-5xl mb-6 italic">
              Cultivamos <span className="text-primary italic">conciencia</span>
            </h2>
            <p className="max-w-2xl mx-auto text-muted-foreground mb-10">
              Somos una red comprometida con la soberanía alimentaria y la agroecología.
            </p>
            <Link href="/nosotros" className="text-primary font-bold hover:underline decoration-primary/30 underline-offset-8">
              Conoce nuestra historia →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
