import Navbar from "@/components/Navbar";
import HeroSection from "@/components/home/HeroSection";
import ProductsSection from "@/components/home/ProductsSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import Link from "next/link";
import { ProductService } from "@/services/product.service";

export default async function Home() {
  const { products } = await ProductService.getCatalog(1, 40);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
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
      <WhatsAppButton />
    </div>
  );
}
