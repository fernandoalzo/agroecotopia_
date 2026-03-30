import Navbar from "@/components/Navbar";
import HeroSection from "@/pages_components/HeroSection";
import ProductsSection from "@/pages_components/ProductsSection";
import AboutUsSection from "@/pages_components/AboutUsSection";
import ContactSection from "@/pages_components/ContactSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ProductsSection />
      <AboutUsSection />

      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
