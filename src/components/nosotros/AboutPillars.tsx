"use client";

import { motion } from "framer-motion";
import { Heart, Leaf, Recycle, Sprout, Sun, Truck } from "lucide-react";

interface AboutPillarsProps {
  t: any;
}

export function AboutPillars({ t }: AboutPillarsProps) {
  const pillars = [
    { icon: Leaf, title: t.about.pillars.organic.title, desc: t.about.pillars.organic.desc },
    { icon: Recycle, title: t.about.pillars.sustainable.title, desc: t.about.pillars.sustainable.desc },
    { icon: Heart, title: t.about.pillars.healthy.title, desc: t.about.pillars.healthy.desc },
    { icon: Truck, title: t.about.pillars.direct.title, desc: t.about.pillars.direct.desc },
    { icon: Sprout, title: t.about.pillars.biodiversity.title, desc: t.about.pillars.biodiversity.desc },
    { icon: Sun, title: t.about.pillars.fairTrade.title, desc: t.about.pillars.fairTrade.desc },
  ];

  return (
    <div className="container mx-auto px-4 md:px-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="group relative flex flex-col gap-4 rounded-3xl bg-card p-8 shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl border border-border/50 hover:border-primary/50 overflow-hidden"
          >
            {/* Background Grain/Texture effect */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,transparent_0%,rgba(var(--primary),0.03)_100%)] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground">
              <p.icon className="h-7 w-7" />
            </div>
            
            <div>
              <h3 className="mb-2 font-display text-xl font-bold text-card-foreground">
                {p.title}
              </h3>
              <p className="font-body text-sm leading-relaxed text-muted-foreground md:text-base">
                {p.desc}
              </p>
            </div>

            {/* Subtle decorative line */}
            <div className="mt-auto h-1 w-0 bg-primary/20 transition-all duration-500 group-hover:w-16" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
