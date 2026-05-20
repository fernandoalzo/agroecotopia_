"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

// Modular Components
import { AboutHero } from "@/components/nosotros/AboutHero";
import { AboutPillars } from "@/components/nosotros/AboutPillars";
import { AboutMission } from "@/components/nosotros/AboutMission";

export default function AboutPageClient() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30">

      <main className="flex-grow pt-24 md:pt-32">
        {/* About Hero Section */}
        <AboutHero t={t} />

        {/* Pillars Section */}
        <section className="bg-secondary/20 py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6 text-center mb-16">
            <h2 className="font-display text-3xl font-black text-foreground md:text-5xl">
              Nuestros <span className="text-primary italic">Pilares</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-body text-muted-foreground md:text-lg">
              Los valores fundamentales que guían cada cosecha y cada entrega en nuestra red agroecológica.
            </p>
          </div>
          <AboutPillars t={t} />
        </section>

        {/* Mission & Vision Section */}
        <AboutMission t={t} />
      </main>

      <Footer />
    </div>
  );
}
