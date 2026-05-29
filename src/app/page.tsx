import ImmersiveJourney from "@/components/home/ImmersiveJourney";
import Footer from "@/components/Footer";
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
      <main>
        <ImmersiveJourney initialProducts={products} />
      </main>
      <Footer />
    </div>
  );
}

