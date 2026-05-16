"use client";

import { motion } from "framer-motion";
import { Heart, Leaf, Recycle, Sprout, Sun, Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const AboutUsSection = () => {
  const { t } = useLanguage();

  const pillars = [
    { icon: Leaf, title: t.about.pillars.organic.title, desc: t.about.pillars.organic.desc },
    { icon: Recycle, title: t.about.pillars.sustainable.title, desc: t.about.pillars.sustainable.desc },
    { icon: Heart, title: t.about.pillars.healthy.title, desc: t.about.pillars.healthy.desc },
    { icon: Truck, title: t.about.pillars.direct.title, desc: t.about.pillars.direct.desc },
    { icon: Sprout, title: t.about.pillars.biodiversity.title, desc: t.about.pillars.biodiversity.desc },
    { icon: Sun, title: t.about.pillars.fairTrade.title, desc: t.about.pillars.fairTrade.desc },
  ];

  return (
    <section id="nosotros" className="relative overflow-hidden bg-secondary/30 py-20 md:py-32">
      {/* Subtle decorative elements */}
      <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* Storytelling Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <div>
              <span className="mb-2 inline-block font-body text-xs font-semibold uppercase tracking-widest text-primary md:text-sm">
                {t.about.badge}
              </span>
              <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                {t.about.title}
              </h2>
            </div>
            
            <div className="flex flex-col gap-4 font-body text-base leading-relaxed text-muted-foreground md:text-lg">
              <p>
                {t.about.description1}
              </p>
              <p>
                {t.about.description2}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="h-px flex-1 bg-border/50" />
              <span className="font-display italic text-primary">{t.about.tagline}</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>
          </motion.div>

        {/* Pillars Grid Side */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md border border-border/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground md:h-12 md:w-12">
                <p.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <h3 className="mb-1 font-display text-base font-bold text-card-foreground md:text-lg">
                  {p.title}
                </h3>
                <p className="font-body text-xs leading-snug text-muted-foreground md:text-sm">
                  {p.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
}

export default AboutUsSection;
