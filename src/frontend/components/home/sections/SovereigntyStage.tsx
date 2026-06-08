"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
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
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.25, 0.15, 0.25, 0],
        scale: [0, 1, 0.9, 1, 0],
        x: [0, driftX * 0.3, driftX * 0.7, driftX, 0],
        y: [0, driftY * 0.3, driftY * 0.7, driftY, 0],
        rotate: [0, 15, -10, 5, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.25, 0.5, 0.75, 1],
      }}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
        <Icon className="text-primary/30" style={{ width: size, height: size }} />
      </div>
    </motion.div>
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
          <motion.div
            className="absolute inset-0 bg-primary/20 rounded-full blur-lg"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              delay: index * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, delay: index * 0.3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon className="w-5.5 h-5.5 text-primary" />
            </motion.div>
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
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const bgX = useTransform(mouseX, [0, 1], [0, 30]);
  const bgY = useTransform(mouseY, [0, 1], [0, 20]);
  const springBgX = useSpring(bgX, { stiffness: 50, damping: 30 });
  const springBgY = useSpring(bgY, { stiffness: 50, damping: 30 });

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
    >
      {/* Cinematic gradient background layer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          x: springBgX,
          y: springBgY,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03]" />
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, oklch(0.7 0.25 150 / 0.08), transparent 70%)",
          }}
          animate={{
            x: [0, 60, 0, -40, 0],
            y: [0, -40, 0, 50, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full"
          style={{
            background: "radial-gradient(circle, oklch(0.6 0.2 100 / 0.08), transparent 70%)",
          }}
          animate={{
            x: [0, -50, 0, 40, 0],
            y: [0, 50, 0, -40, 0],
            scale: [1, 0.9, 1.2, 1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Floating nature icons */}
      <div className="absolute inset-0 pointer-events-none">
        {FLOATING_ICONS.map((item, i) => (
          <FloatingIcon key={i} {...item} />
        ))}
      </div>

      {/* Horizontal rule decorations */}
      <motion.div
        className="absolute top-[15%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.7 0.25 150 / 0.15), transparent)",
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[15%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.6 0.2 100 / 0.15), transparent)",
        }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
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
          <motion.span
            className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold text-primary/70 tracking-[0.25em] uppercase"
            animate={{ letterSpacing: ["0.25em", "0.35em", "0.25em"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.span
              className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {t.about.badge}
          </motion.span>
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
          <motion.span
            className="inline-block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_200%] bg-clip-text text-transparent"
            style={{ animation: "gradient-shift 4s ease-in-out infinite" }}
          >
            Alimentaria
          </motion.span>
        </motion.h2>

        {/* Animated decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-0.5 w-24 bg-gradient-to-r from-primary/60 via-accent/40 to-transparent rounded-full mb-6 origin-left"
        />

        {/* Description - word reveal animation */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-muted-foreground/90 text-sm sm:text-base leading-relaxed sm:leading-relaxed mb-8 max-w-xl text-center sm:text-left"
        >
          {t.about.description1.split(" ").map((word: string, i: number) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.25em]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.5 + i * 0.025,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.p>

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
      `}</style>
    </div>
  );
};

export default SovereigntyStage;
