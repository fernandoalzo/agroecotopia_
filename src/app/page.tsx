import Navbar from "@/components/Navbar";
import HeroSection from "@/components/home/HeroSection";
import ProductsSection from "@/components/home/ProductsSection";
import AboutUsSection from "@/components/home/AboutUsSection";
import ContactSection from "@/components/home/ContactSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { ProductService } from "@/services/product.service";

export default async function Home() {
  const products = await ProductService.getCatalog();

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ProductsSection initialProducts={products} />
      <AboutUsSection />

      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
