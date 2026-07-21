"use client";

import { motion } from "framer-motion";
import { Sprout, Leaf, Wheat, Sun, Wind, ArrowRight } from "lucide-react";
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
  const words = (t.hero.description || "").split(" ");

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">


      {/* Horizontal rule decorations */}
      <div
        className="absolute top-[12%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.7 0.25 150 / 0.12), transparent)",
          animation: "welcome-line 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[12%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.6 0.2 100 / 0.12), transparent)",
          animation: "welcome-line 5s ease-in-out 1s infinite",
        }}
      />

      {/* Content */}
      <motion.div
        animate={isNavigating ? { scale: 1.4, opacity: 0, filter: "blur(10px)" } : {}}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative z-10 w-full max-w-3xl mx-auto px-4 py-4 text-center"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="mb-5"
        >
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold text-primary/70 tracking-[0.25em] uppercase">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
              style={{
                willChange: "transform",
                animation: "dot-pulse 2s ease-in-out infinite",
              }}
            />
            {t.hero.badge}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-4xl sm:text-6xl md:text-7xl font-black leading-[1.15] sm:leading-[1.2] mb-4"
        >
          <span className="text-foreground">{t.hero.title}</span>
          <br />
          <span
            className="inline-block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_200%] bg-clip-text text-transparent"
            style={{ animation: "gradient-shift 4s ease-in-out infinite" }}
          >
            {t.hero.titleAccent}
          </span>
        </motion.h1>

        {/* Animated decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="h-0.5 w-20 sm:w-24 bg-gradient-to-r from-primary/60 via-accent/40 to-transparent rounded-full mb-6 mx-auto origin-center"
        />

        {/* Description — CSS word reveal */}
        <p className="text-muted-foreground/90 text-sm sm:text-lg leading-[2] sm:leading-[2.2] max-w-xl mx-auto mb-10">
          {words.map((word: string, i: number) => (
            <span
              key={i}
              className="inline-block mr-[0.25em]"
              style={{
                animation: `word-fade 0.4s ease-out ${0.5 + i * 0.025}s both`,
              }}
            >
              {word}
            </span>
          ))}
        </p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <button
            onClick={() => {
              setIsNavigating(true);
              setTimeout(() => {
                router.push('/products');
              }, 800);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-base font-bold text-white shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
          >
            {language === "es" ? "Mira nuestros productos" : "View our products"}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.5); opacity: 1; }
        }

        @keyframes welcome-line {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        @keyframes word-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default WelcomeStage;
