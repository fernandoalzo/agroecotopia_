"use client";

import { motion } from "framer-motion";

interface AboutHeroProps {
  t: any;
}

export function AboutHero({ t }: AboutHeroProps) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Organic Decorative Background Elements */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-accent/10 blur-[130px] animate-pulse" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary shadow-sm ring-1 ring-primary/20">
              {t.about.badge}
            </span>
            <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-7xl lg:text-8xl">
              Nuestra <span className="text-primary italic">Historia</span>
            </h1>
            <p className="mt-8 font-body text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-2xl">
              Cultivando un futuro más <span className="font-bold text-foreground">consciente, justo y saludable</span> para todos.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
