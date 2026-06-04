"use client";

import { motion } from "framer-motion";
import { Sprout, ArrowRight, ArrowDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WelcomeStageProps {
  t: any;
  language: string;
  onStartJourney: () => void;
}

const WelcomeStage = ({ t, language, onStartJourney }: WelcomeStageProps) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <>
      {/* Gradient veil for text readability — background image is handled by ImmersiveJourney slideshow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background" />
      </div>

      <motion.div 
        animate={isNavigating ? { scale: 1.4, opacity: 0, filter: "blur(10px)" } : {}}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="max-w-4xl text-center z-20"
      >
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
            onClick={() => {
              setIsNavigating(true);
              setTimeout(() => {
                router.push('/products');
              }, 800);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-base font-bold text-white shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
          >
            {language === "es" ? "Mira nuestros productos" : "View our products"}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>


      </motion.div>
    </>
  );
};

export default WelcomeStage;
