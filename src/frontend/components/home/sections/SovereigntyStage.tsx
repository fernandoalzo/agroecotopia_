"use client";

import { motion } from "framer-motion";
import { MessageCircle, Globe, Leaf, Sprout, Wheat, Sun, Wind } from "lucide-react";



function AnimatedPillar({
  icon: Icon,
  title,
  desc,
  index,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.7 + index * 0.15,
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative"
    >
      <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] p-5 sm:p-6 transition-all duration-500 hover:border-primary/25 hover:shadow-[0_0_40px_-8px_oklch(0.7_0.25_150/0.15)] cursor-default backdrop-blur-xl">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="relative shrink-0 mt-0.5">
            <div
              className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
              style={{
                willChange: "transform",
                animation: `pillar-glow 3s ease-in-out ${index * 0.5}s infinite`,
              }}
            />
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center ring-1 ring-primary/15 group-hover:ring-primary/30 group-hover:shadow-[0_0_20px_-4px_oklch(0.7_0.25_150/0.25)] transition-all duration-500">
              <div
                style={{
                  willChange: "transform",
                  animation: `pillar-rotate 4s ease-in-out ${index * 0.3}s infinite`,
                }}
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <motion.h4
              className="text-base sm:text-lg font-bold text-foreground"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.15, duration: 0.5 }}
            >
              {title}
            </motion.h4>
            <motion.p
              className="text-sm sm:text-base text-muted-foreground/80 mt-2 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95 + index * 0.15, duration: 0.6 }}
            >
              {desc}
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface SovereigntyStageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

const SovereigntyStage = ({ t }: SovereigntyStageProps) => {
  const words = t.about.description1.split(" ");

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">


      {/* Horizontal rule decorations */}
      <div
        className="absolute top-[12%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.7 0.25 150 / 0.15), transparent)",
          animation: "sovereignty-line 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[12%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.6 0.2 100 / 0.15), transparent)",
          animation: "sovereignty-line 5s ease-in-out 1s infinite",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12 xl:gap-20 items-center">
          {/* Left column: text */}
          <div className="flex flex-col">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4 sm:mb-6"
            >
              <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold text-primary/70 tracking-[0.25em] uppercase">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
                  style={{
                    willChange: "transform",
                    animation: "dot-pulse 2s ease-in-out infinite",
                  }}
                />
                {t.about.badge}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-4"
            >
              <span className="text-foreground">Soberanía</span>
              <br />
              <span
                className="inline-block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_200%] bg-clip-text text-transparent"
                style={{ animation: "gradient-shift 4s ease-in-out infinite" }}
              >
                Alimentaria
              </span>
            </motion.h2>

            {/* Animated decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-0.5 w-24 bg-gradient-to-r from-primary/60 via-accent/40 to-transparent rounded-full mb-6 origin-left"
            />

            {/* Description — CSS word reveal */}
            <p className="text-muted-foreground/90 text-sm sm:text-base lg:text-lg leading-relaxed mb-0 max-w-xl">
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
          </div>

          {/* Right column: pillars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col gap-4 sm:gap-5 mt-8 lg:mt-0"
          >
            <AnimatedPillar
              icon={MessageCircle}
              title={t.about.pillars.foro.title}
              desc={t.about.pillars.foro.desc}
              index={0}
            />
            <AnimatedPillar
              icon={Globe}
              title={t.about.pillars.conexion.title}
              desc={t.about.pillars.conexion.desc}
              index={1}
            />
          </motion.div>
        </div>
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

        @keyframes sovereignty-line {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes pillar-glow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes pillar-rotate {
          0%, 100% { transform: rotate(0deg); }
          33% { transform: rotate(6deg); }
          66% { transform: rotate(-6deg); }
        }
        @keyframes word-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SovereigntyStage;
