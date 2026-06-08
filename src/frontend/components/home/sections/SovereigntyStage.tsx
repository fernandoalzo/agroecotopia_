"use client";

import { motion } from "framer-motion";
import { Leaf, Sprout, Wheat, Sun, Wind } from "lucide-react";

const FLOATING_ICONS = [
  { Icon: Leaf, x: 5, y: 15, size: 28, delay: 0, driftX: 40, driftY: -30, duration: 8 },
  { Icon: Sprout, x: 92, y: 20, size: 24, delay: 1.5, driftX: -30, driftY: -40, duration: 10 },
  { Icon: Wheat, x: 12, y: 70, size: 20, delay: 0.8, driftX: 35, driftY: 25, duration: 9 },
  { Icon: Sun, x: 85, y: 75, size: 32, delay: 2.2, driftX: -25, driftY: -35, duration: 11 },
  { Icon: Wind, x: 50, y: 8, size: 18, delay: 3, driftX: 50, driftY: 10, duration: 7 },
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
        animation: `sovereignty-float ${duration}s ease-in-out ${delay}s infinite`,
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
      <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl transition-colors duration-500 hover:bg-white/[0.03] cursor-default">
        <div className="relative shrink-0 mt-0.5">
          <div
            className="absolute inset-0 bg-primary/20 rounded-full blur-lg"
            style={{
              willChange: "transform",
              animation: `pillar-glow 3s ease-in-out ${index * 0.5}s infinite`,
            }}
          />
          <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
            <div
              style={{
                willChange: "transform",
                animation: `pillar-rotate 4s ease-in-out ${index * 0.3}s infinite`,
              }}
            >
              <Icon className="w-5.5 h-5.5 text-primary" />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <motion.h4
            className="text-base sm:text-lg font-bold text-foreground"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.15, duration: 0.5 }}
          >
            {title}
          </motion.h4>
          <motion.p
            className="text-sm text-muted-foreground/80 mt-1.5 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95 + index * 0.15, duration: 0.6 }}
          >
            {desc}
          </motion.p>
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
      {/* Floating nature icons */}
      <div className="absolute inset-0 pointer-events-none">
        {FLOATING_ICONS.map((item, i) => (
          <FloatingIcon key={i} {...item} />
        ))}
      </div>

      {/* Horizontal rule decorations */}
      <div
        className="absolute top-[15%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.7 0.25 150 / 0.15), transparent)",
          animation: "sovereignty-line 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[15%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.6 0.2 100 / 0.15), transparent)",
          animation: "sovereignty-line 5s ease-in-out 1s infinite",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-3 sm:px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 text-center sm:text-left"
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
          className="text-4xl sm:text-6xl md:text-7xl font-black leading-[1.05] mb-4 text-center sm:text-left"
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
        <p className="text-muted-foreground/90 text-sm sm:text-base leading-relaxed sm:leading-relaxed mb-8 max-w-xl text-center sm:text-left">
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

        {/* Pillars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-1"
        >
          <AnimatedPillar
            icon={Leaf}
            title={t.about.pillars.organic.title}
            desc={t.about.pillars.organic.desc}
            index={0}
          />
          <AnimatedPillar
            icon={Sprout}
            title={t.about.pillars.sustainable.title}
            desc={t.about.pillars.sustainable.desc}
            index={1}
          />
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
        @keyframes sovereignty-float {
          0% { opacity: 0; transform: translate(0, 0) scale(0) rotate(0deg); }
          25% { opacity: 0.25; transform: translate(var(--dx1), var(--dy1)) scale(1) rotate(15deg); }
          50% { opacity: 0.15; transform: translate(var(--dx2), var(--dy2)) scale(0.9) rotate(-10deg); }
          75% { opacity: 0.25; transform: translate(var(--dx3), var(--dy3)) scale(1) rotate(5deg); }
          100% { opacity: 0; transform: translate(0, 0) scale(0) rotate(0deg); }
        }
        @keyframes sovereignty-line {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes pillar-glow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
        @keyframes pillar-rotate {
          0%, 100% { transform: rotate(0deg); }
          33% { transform: rotate(5deg); }
          66% { transform: rotate(-5deg); }
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
