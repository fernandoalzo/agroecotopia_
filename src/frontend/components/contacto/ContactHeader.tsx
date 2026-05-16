"use client";

import { motion } from "framer-motion";

interface ContactHeaderProps {
  t: any;
}

export function ContactHeader({ t }: ContactHeaderProps) {
  return (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary shadow-sm ring-1 ring-primary/20">
          {t.contact.badge}
        </span>
        <h1 className="font-display text-4xl font-black tracking-tighter text-foreground sm:text-5xl md:text-7xl lg:text-8xl">
          Escríbenos y <span className="text-primary italic">Conectemos</span>
        </h1>
        <p className="mx-auto mt-8 max-w-3xl font-body text-lg leading-relaxed text-muted-foreground md:text-2xl">
          {t.contact.description}
        </p>
      </motion.div>
  );
}
