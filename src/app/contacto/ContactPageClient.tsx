"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

// Modular Components
import { ContactHeader } from "@/components/contacto/ContactHeader";
import { ContactGrid } from "@/components/contacto/ContactGrid";

export default function ContactPageClient() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30">

      <main className="flex-grow pt-24 md:pt-40 pb-20 md:pb-32">
        <div className="container mx-auto px-4 md:px-6">
          <ContactHeader t={t} />
          
          <div className="mt-16 md:mt-24">
            <ContactGrid t={t} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
