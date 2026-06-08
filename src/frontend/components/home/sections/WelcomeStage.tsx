"use client";

import { motion } from "framer-motion";
import { Sprout, Leaf, Wheat, Sun, Wind, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FLOATING_ICONS = [
  { Icon: Leaf, x: 5, y: 10, size: 24, delay: 0, driftX: 40, driftY: -30, duration: 8 },
  { Icon: Sprout, x: 90, y: 18, size: 20, delay: 1.5, driftX: -35, driftY: -25, duration: 10 },
  { Icon: Wheat, x: 10, y: 75, size: 22, delay: 0.8, driftX: 30, driftY: 20, duration: 9 },
  { Icon: Sun, x: 88, y: 80, size: 28, delay: 2.2, driftX: -25, driftY: -35, duration: 11 },
  { Icon: Wind, x: 50, y: 5, size: 16, delay: 3, driftX: 50, driftY: 10, duration: 7 },
];

function FloatingIcon({
  Icon,
  x,
  y,
  size,
  delay,
  driftX,
  driftY,
  duration,
}: {
  Icon: React.ElementType;
  x: number;
  y: number;
  size: number;
  delay: number;
  driftX: number;
  driftY: number;
  duration: number;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        willChange: "transform",
        animation: `welcome-float ${duration}s ease-in-out ${delay}s infinite`,
        "--dx1": `${driftX * 0.3}px`,
        "--dy1": `${driftY * 0.3}px`,
        "--dx2": `${driftX * 0.7}px`,
        "--dy2": `${driftY * 0.7}px`,
        "--dx3": `${driftX}px`,
        "--dy3": `${driftY}px`,
      } as React.CSSProperties}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
        <Icon className="text-primary/30" style={{ width: size, height: size }} />
      </div>
    </div>
  );
}

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
      {/* Floating nature icons */}
      <div className="absolute inset-0 pointer-events-none">
        {FLOATING_ICONS.map((item, i) => (
          <FloatingIcon key={i} {...item} />
        ))}
      </div>

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
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
          transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
          transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
      </div>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.5); opacity: 1; }
        }
        @keyframes welcome-float {
          0% { opacity: 0; transform: translate(0, 0) scale(0) rotate(0deg); }
          25% { opacity: 0.25; transform: translate(var(--dx1), var(--dy1)) scale(1) rotate(15deg); }
          50% { opacity: 0.15; transform: translate(var(--dx2), var(--dy2)) scale(0.9) rotate(-10deg); }
          75% { opacity: 0.25; transform: translate(var(--dx3), var(--dy3)) scale(1) rotate(5deg); }
          100% { opacity: 0; transform: translate(0, 0) scale(0) rotate(0deg); }
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
