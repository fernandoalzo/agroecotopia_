"use client";

import { motion } from "framer-motion";
import { Sprout, ArrowRight, ArrowDown } from "lucide-react";

interface WelcomeStageProps {
  t: any;
  language: string;
  onStartJourney: () => void;
}

const WelcomeStage = ({ t, language, onStartJourney }: WelcomeStageProps) => {
  return (
    <>
      {/* Gradient veil for text readability — background image is handled by ImmersiveJourney slideshow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background" />
      </div>

      <div className="max-w-4xl text-center z-20">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 font-body text-xs font-semibold text-primary uppercase tracking-widest"
        >
          <Sprout className="w-3.5 h-3.5" />
          {t.hero.badge}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 font-display text-4xl sm:text-6xl md:text-8xl font-black leading-tight tracking-tight text-foreground drop-shadow-sm"
        >
          {t.hero.title} <br className="hidden sm:inline" />
          <span className="text-primary italic relative">
            {t.hero.titleAccent}
            <span className="absolute bottom-1 left-0 w-full h-[6px] bg-primary/15 rounded-full -skew-x-12" />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mb-10 max-w-2xl mx-auto font-body text-base sm:text-xl text-muted-foreground/95 leading-relaxed"
        >
          {t.hero.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={onStartJourney}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-base font-bold text-white shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
          >
            {language === "es" ? "Iniciar Recorrido" : "Start Journey"}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
          onClick={onStartJourney}
        >
          <span className="text-xs tracking-widest font-semibold uppercase opacity-75">
            {language === "es" ? "Desliza para avanzar" : "Scroll to explore"}
          </span>
          <ArrowDown className="w-5 h-5 text-primary" />
        </motion.div>
      </div>
    </>
  );
};

export default WelcomeStage;
