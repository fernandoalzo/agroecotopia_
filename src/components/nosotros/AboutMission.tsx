"use client";

import { motion } from "framer-motion";

interface AboutMissionProps {
  t: any;
}

export function AboutMission({ t }: AboutMissionProps) {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* Story Side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col gap-8 md:gap-12"
          >
            <div>
              <h2 className="font-display text-4xl font-black leading-tight text-foreground sm:text-5xl md:text-6xl">
                Nuestra <span className="text-primary italic">Misión</span>
              </h2>
              <div className="mt-8 flex items-center gap-6">
                <span className="h-px flex-1 bg-border/50" />
                <span className="font-display italic text-primary text-lg md:text-xl">{t.about.tagline}</span>
                <span className="h-px flex-1 bg-border/50" />
              </div>
            </div>

            <div className="flex flex-col gap-6 font-body text-lg leading-relaxed text-muted-foreground md:text-xl">
              <p>
                {t.about.description1}
              </p>
              <p>
                {t.about.description2}
              </p>
            </div>
          </motion.div>

          {/* Vision/Imagery Side (Placeholder with themed design) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative h-[400px] w-full md:h-[600px] overflow-hidden rounded-[2.5rem] bg-secondary/30 dark:bg-primary/5 p-4 md:p-8"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Luxury Textures/Abstract Shapes */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] w-[80%] border-2 border-primary/20 rounded-full animate-spin-slow" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] w-[60%] border-2 border-accent/20 rounded-full animate-spin-slow-reverse" />
              
              <div className="z-10 text-center">
                <span className="mb-4 block font-display text-6xl font-black text-primary/30 md:text-8xl select-none">
                  AGRO
                </span>
                <span className="block font-display text-4xl font-bold tracking-widest text-foreground/20 italic select-none">
                  ECOTOPIA
                </span>
              </div>
            </div>
            
            {/* Soft Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
