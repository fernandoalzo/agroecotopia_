"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import heroImg from "@/assets/hero-agro.jpg";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section id="hero" className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image 
          src={heroImg} 
          alt={t.hero.imageAlt} 
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background/50 md:bg-gradient-to-r md:from-background/95 md:via-background/80 md:to-background/40" />
    </div>

    <div className="container mx-auto relative z-10 px-4 py-20 pb-24 md:px-6 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-lg md:max-w-2xl text-center md:text-left mx-auto md:mx-0"
      >
        <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 font-body text-xs font-semibold text-primary md:mb-4 md:px-4 md:py-1.5 md:text-sm">
          {t.hero.badge}
        </span>
        <h1 className="mb-4 font-display text-[28px] font-bold leading-tight text-foreground sm:text-4xl md:mb-6 md:text-5xl lg:text-6xl">
          {t.hero.title}{" "}
          <span className="text-primary">{t.hero.titleAccent}</span>
        </h1>
        <p className="mb-8 max-w-md mx-auto md:mx-0 font-body text-base text-muted-foreground/90 md:mb-10 md:max-w-lg md:text-xl leading-relaxed">
          {t.hero.description}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 items-center md:items-start justify-center md:justify-start">
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 font-body text-sm font-black text-white shadow-[0_10px_30px_rgba(var(--primary),0.3)] transition-all hover:scale-105 active:scale-95 md:text-base group"
          >
            {t.hero.ctaPrimary}
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="ml-1"
            >
              →
            </motion.div>
          </Link>
          <a
            href="#nosotros"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-background/40 px-8 py-4 font-body text-sm font-bold text-foreground backdrop-blur-xl transition-all hover:bg-background/80 md:text-base active:scale-95"
          >
            {t.hero.ctaSecondary}
          </a>
        </div>
      </motion.div>
    </div>

    {/* Scroll indicator */}
    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground md:bottom-8"
    >
      <ArrowDown className="h-5 w-5 md:h-6 md:w-6" />
    </motion.div>
  </section>
);
}

export default HeroSection;
