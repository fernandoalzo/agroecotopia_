"use client";

import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Leaf, Sprout, Sparkles, ArrowDown, ArrowUp } from "lucide-react";
import { Product } from "@/types";

// Import modular sections
import WelcomeStage from "./sections/WelcomeStage";
import SovereigntyStage from "./sections/SovereigntyStage";
import ProductsStage from "./sections/ProductsStage";
import CommunityStage from "./sections/CommunityStage";

interface ImmersiveJourneyProps {
  initialProducts: Product[];
  initialForumTopics?: any[];
  realStats?: { users: number; posts: number; products: number };
}

interface Particle {
  id: number;
  x: number; // percentage width
  y: number; // percentage height
  z: number; // depth
  scale: number;
  rotate: number;
  speed: number;
  type: "leaf" | "seed" | "sprout" | "sparkle";
}

interface ParticleElementProps {
  p: Particle;
  smoothProgress: any;
}

const ParticleElement = ({ p, smoothProgress }: ParticleElementProps) => {
  // Map scroll progress to each particle's Z translation
  const zProgress = useTransform(
    smoothProgress,
    [0, 1],
    [p.z, p.z + 2400]
  );

  // Fade out particles when they come extremely close to screen to avoid blocking view
  const opacityProgress = useTransform(
    zProgress,
    [-1500, -100, 300, 700],
    [0.15, 0.4, 0.4, 0]
  );

  const scaleProgress = useTransform(
    zProgress,
    [-2000, 500],
    [p.scale * 0.4, p.scale * 1.5]
  );

  return (
    <motion.div
      style={{
        position: "absolute",
        left: `${p.x}%`,
        top: `${p.y}%`,
        z: zProgress,
        scale: scaleProgress,
        opacity: opacityProgress,
        transformStyle: "preserve-3d",
        rotateZ: p.rotate
      }}
      className="pointer-events-none z-10"
    >
      {p.type === "leaf" && <Leaf className="w-8 h-8 text-primary/30" />}
      {p.type === "sprout" && <Sprout className="w-7 h-7 text-accent/30" />}
      {p.type === "sparkle" && <Sparkles className="w-5 h-5 text-yellow-500/20" />}
      {p.type === "seed" && (
        <div className="w-3 h-4 bg-amber-600/20 rounded-full border border-amber-600/10 rotate-45" />
      )}
    </motion.div>
  );
};

const ImmersiveJourney = ({ initialProducts, initialForumTopics, realStats }: ImmersiveJourneyProps) => {
  const { t, language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  // State to handle hydration and client-side setup
  const [mounted, setMounted] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [renderedStages, setRenderedStages] = useState([true, true, true, true]);
  const touchStartY = useRef<number>(0);
  const targetStageRef = useRef(0);       // Tracks INTENDED destination (not mid-animation state)
  const isAnimating = useRef(false);       // Animation lock — blocks all events during transition
  const wheelAccumulator = useRef(0);      // Absorbs trackpad inertia before triggering
  const wheelResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Track scroll position within the entire height of the container
  const { scrollYProgress } = useScroll({
    target: mounted ? containerRef : undefined,
    offset: ["start start", "end end"]
  });

  // Smooth scroll progress to eliminate any jittering
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001
  });

  // Generate deterministic particles for 3D depth parallax
  const particles = useMemo<Particle[]>(() => {
    const arr: Particle[] = [];
    const types: Particle["type"][] = ["leaf", "seed", "sprout", "sparkle"];
    for (let i = 0; i < 28; i++) {
      arr.push({
        id: i,
        x: Math.random() * 140 - 20, // Spread beyond screen edges
        y: Math.random() * 120 - 10,
        z: Math.random() * -2000 - 300, // Z depth range
        scale: Math.random() * 0.8 + 0.4,
        rotate: Math.random() * 360,
        speed: Math.random() * 0.5 + 0.8,
        type: types[i % types.length]
      });
    }
    return arr;
  }, []);

  // Update active stage AND conditionally mount/unmount stages based on scroll progress.
  // Stages whose opacity is 0 are removed from the DOM entirely so they cannot
  // intercept pointer events in the preserve-3d compositing context.
  useEffect(() => {
    let prevRendered = [true, true, true, true];

    return smoothProgress.on("change", (v) => {
      // ── Active stage (for HUD indicator + pointer-events class) ──
      let stage = 0;
      if (v < 0.18) stage = 0;
      else if (v < 0.52) stage = 1;
      else if (v < 0.84) stage = 2;
      else stage = 3;
      setActiveStage(stage);

      // ── Conditional rendering: mount a stage only when its opacity could be > 0 ──
      // Thresholds include a small margin beyond the opacity=0 boundaries so
      // stages mount slightly before they fade in and unmount slightly after they fade out.
      const next = [
        v < 0.33,                    // Stage 0 fades out at 0.29
        v > 0.12 && v < 0.67,        // Stage 1 fades in at 0.16, out at 0.63
        v > 0.46 && v < 0.95,        // Stage 2 fades in at 0.50, out at 0.95
        v > 0.75                     // Stage 3 fades in at 0.78
      ];

      if (next[0] !== prevRendered[0] || next[1] !== prevRendered[1] ||
          next[2] !== prevRendered[2] || next[3] !== prevRendered[3]) {
        prevRendered = next;
        setRenderedStages(next);
      }
    });
  }, [smoothProgress]);

  // Stage 1 (Welcome / Intro) Transforms
  // On mobile, disable the 3D immersion (Z + scale) — only fade out
  const introZ = useTransform(smoothProgress, [0, 0.29], isMobile ? [0, 0] : [0, 700]);
  const introOpacity = useTransform(smoothProgress, [0.16, 0.29], [1, 0]);
  const introScale = useTransform(smoothProgress, [0, 0.29], isMobile ? [1, 1] : [1, 1.2]);

  // Stage 2 (Soberanía Alimentaria) Transforms
  const stage2Z = useTransform(smoothProgress, [0.16, 0.37, 0.63], [-1200, 0, 700]);
  const stage2Opacity = useTransform(smoothProgress, [0.16, 0.32, 0.53, 0.63], [0, 1, 1, 0]);
  const stage2Scale = useTransform(smoothProgress, [0.16, 0.37, 0.63], [0.7, 1, 1.2]);

  // Stage 3 (Catalog 3D Showcase) Transforms
  const stage3Z = useTransform(smoothProgress, [0.50, 0.68, 0.95], [-1200, 0, 700]);
  const stage3Opacity = useTransform(smoothProgress, [0.50, 0.63, 0.84, 0.95], [0, 1, 1, 0]);
  const stage3Scale = useTransform(smoothProgress, [0.50, 0.68, 0.95], [0.7, 1.0, 1.0]);

  // Stage 4 (Community & Network) Transforms
  const stage4Z = useTransform(smoothProgress, [0.78, 0.92], [-1200, 0]);
  const stage4Opacity = useTransform(smoothProgress, [0.78, 0.88, 0.92], [0, 1, 1]);
  const stage4Scale = useTransform(smoothProgress, [0.78, 0.92], [0.7, 1]);


  // Snap points for each stage (progress values matching navigation targets)
  const snapPoints = useMemo(() => [0, 0.37, 0.68, 1.0], []);

  // Centralized scroll-to-stage function
  const scrollToStage = useCallback((stageIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(3, stageIndex));
    targetStageRef.current = clampedIndex;
    const targetProgress = snapPoints[clampedIndex];
    const scrollHeight = containerRef.current?.scrollHeight || 0;
    const maxScroll = Math.max(0, scrollHeight - window.innerHeight);
    window.scrollTo({
      top: targetProgress * maxScroll,
      behavior: "smooth"
    });
  }, [snapPoints]);

  // ── Scroll Snapping: intercept wheel / touch / keyboard to navigate section-by-section ──
  useEffect(() => {
    if (!mounted) return;

    const ANIMATION_LOCK_MS = 1200; // Full lockout during smooth scroll animation
    const WHEEL_THRESHOLD = 60;     // Accumulated delta required to trigger snap

    const shouldIgnoreGlobalNavigation = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return false;

      const interactiveElement = target.closest(
        'input, textarea, select, button, a, [role="button"], [contenteditable="true"], [data-home-snap-ignore="true"]'
      );

      return Boolean(interactiveElement);
    };

    const isInContainer = () => {
      const container = containerRef.current;
      if (!container) return false;
      const rect = container.getBoundingClientRect();
      return rect.top <= window.innerHeight && rect.bottom >= 0;
    };

    const snapToDirection = (direction: number) => {
      if (isAnimating.current) return;

      const current = targetStageRef.current;
      const nextStage = Math.max(0, Math.min(3, current + direction));

      if (nextStage !== current) {
        isAnimating.current = true;

        // Kill native momentum scroll on desktop by briefly hiding overflow.
        // On mobile, skip this to avoid breaking touch/click events on interactive elements.
        if (!isMobile) {
          const originalOverflow = document.body.style.overflow;
          document.body.style.overflow = "hidden";
          setTimeout(() => {
            document.body.style.overflow = originalOverflow;
          }, ANIMATION_LOCK_MS);
        }

        scrollToStage(nextStage);

        setTimeout(() => {
          isAnimating.current = false;
        }, ANIMATION_LOCK_MS);
      }
    };

    // Desktop: accumulate wheel delta → snap once threshold is crossed
    const handleWheel = (e: WheelEvent) => {
      if (shouldIgnoreGlobalNavigation(e)) return;
      if (!isInContainer()) return;
      e.preventDefault();

      if (isAnimating.current) return;

      // Accumulate delta from trackpad inertia
      wheelAccumulator.current += e.deltaY;

      // Reset accumulator after brief pause (gesture ended)
      if (wheelResetTimer.current) clearTimeout(wheelResetTimer.current);
      wheelResetTimer.current = setTimeout(() => {
        wheelAccumulator.current = 0;
      }, 200);

      // Only trigger when accumulated delta exceeds threshold
      if (Math.abs(wheelAccumulator.current) < WHEEL_THRESHOLD) return;

      const direction = wheelAccumulator.current > 0 ? 1 : -1;
      wheelAccumulator.current = 0; // Reset after triggering
      snapToDirection(direction);
    };

    // Mobile: touch swipe → one section per swipe
    const handleTouchStart = (e: TouchEvent) => {
      if (shouldIgnoreGlobalNavigation(e)) return;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (shouldIgnoreGlobalNavigation(e)) return;
      if (!isInContainer()) return;

      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      const SWIPE_THRESHOLD = 50;

      if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;

      const direction = deltaY > 0 ? 1 : -1;
      snapToDirection(direction);
    };

    // Keyboard: arrow keys, PageUp/Down, Space → one section per press
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreGlobalNavigation(e)) return;
      if (!isInContainer()) return;

      let direction = 0;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") direction = 1;
      else if (e.key === "ArrowUp" || e.key === "PageUp") direction = -1;
      else return;

      e.preventDefault();
      snapToDirection(direction);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
      if (wheelResetTimer.current) clearTimeout(wheelResetTimer.current);
    };
    }, [mounted, scrollToStage, isMobile]);

  const startJourney = useCallback(() => {
    scrollToStage(1);
  }, [scrollToStage]);

  if (!mounted) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Sprout className="h-12 w-12 text-primary animate-bounce mx-auto mb-4" />
          <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // Filter 6 beautiful products for Stage 3 Showcase
  const featuredProducts = initialProducts.slice(0, 6);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-background"
      style={{ height: "340vh" }} // Provides scroll headroom for all 4 stages
    >
      {/* PERSISTENT HUD: Navigation dots and scroll indicators */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-4 items-center bg-background/30 backdrop-blur-md px-3 py-6 rounded-full border border-primary/10 shadow-lg">
        {[0, 1, 2, 3].map((idx) => {
          const labels = [
            language === "es" ? "Inicio" : "Welcome",
            language === "es" ? "Soberanía" : "Sovereignty",
            language === "es" ? "Nuestra Tierra" : "Harvest Showcase",
            language === "es" ? "Comunidad" : "Our Network"
          ];
          return (
            <button
              key={idx}
              onClick={() => scrollToStage(idx)}
              className="group relative flex items-center justify-center w-4 h-4 cursor-pointer"
            >
              <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeStage === idx
                ? "bg-primary scale-125 shadow-[0_0_10px_oklch(0.7_0.25_150)]"
                : "bg-muted-foreground/30 group-hover:bg-primary/50"
                }`} />
              <span className="absolute right-8 text-xs font-semibold px-2 py-1 rounded bg-card border border-border opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-md">
                {labels[idx]}
              </span>
            </button>
          );
        })}
      </div>

      {/* STICKY VIEWPORT CONTAINER (The Camera) */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center isolate backface-hidden" style={{ clipPath: "inset(0)" }}>

        {/* ATMOSPHERIC BACKGROUND EFFECTS */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,_var(--color-primary)_0%,_transparent_75%] opacity-5 mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background pointer-events-none" />

        {/* LIGHTWEIGHT DYNAMIC WAVE & GLOW BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-background transition-colors duration-500">
          <div className="absolute inset-0 opacity-40 dark:opacity-60 mix-blend-multiply dark:mix-blend-screen">
            <motion.div
              animate={{
                x: ["-5%", "0%", "-5%"],
                y: ["-5%", "5%", "-5%"],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/50 via-primary/10 to-transparent blur-3xl opacity-30 dark:opacity-50"
            />
            <motion.div
              animate={{
                x: ["0%", "-5%", "0%"],
                y: ["5%", "-5%", "5%"],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[20%] right-[-20%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/50 via-accent/10 to-transparent blur-[100px] opacity-25 dark:opacity-40"
            />
          </div>

          <div className="absolute bottom-0 w-full h-[35vh] overflow-hidden pointer-events-none opacity-30 dark:opacity-50">
            <svg className="absolute inset-0 w-[200%] h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path
                className="fill-primary"
                d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                style={{ willChange: "transform", animation: "wave-scroll 28s linear infinite" }}
              />
              <path
                className="fill-accent"
                d="M0,256L48,229.3C96,203,192,149,288,144C384,139,480,181,576,197.3C672,213,768,203,864,186.7C960,171,1056,149,1152,154.7C1248,160,1344,224,1392,240L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                style={{ willChange: "transform", animation: "wave-scroll 32s linear infinite reverse", opacity: 0.6 }}
              />
            </svg>
          </div>

          {/* Background gradient + animated orbs (shared across all stages for seamless transitions) */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03] pointer-events-none" />
          <div
            className="absolute top-1/4 -left-32 w-96 h-96 rounded-full pointer-events-none"
            style={{
              willChange: "transform",
              animation: "sovereignty-orb-a 20s ease-in-out infinite",
              background: "radial-gradient(circle, oklch(0.7 0.25 150 / 0.08), transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full pointer-events-none"
            style={{
              willChange: "transform",
              animation: "sovereignty-orb-b 18s ease-in-out infinite",
              background: "radial-gradient(circle, oklch(0.6 0.2 100 / 0.08), transparent 70%)",
            }}
          />
        </div>

        {/* 3D SCENE PERSPECTIVE WRAPPER */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
        >
          {/* FLOATING 3D PARALLAX NATURE PARTICLES */}
          {particles.map((p) => (
            <ParticleElement key={p.id} p={p} smoothProgress={smoothProgress} />
          ))}

          {/* ==========================================
              STAGE 1: PORTADA & BIENVENIDA (Z = 0)
              ========================================== */}
          {renderedStages[0] && (
            <motion.div
              style={{
                z: introZ,
                opacity: introOpacity,
                scale: introScale,
                zIndex: activeStage === 0 ? 30 : 0
              }}
              className={`absolute inset-0 flex items-center justify-center p-4 overflow-hidden backface-hidden ${activeStage === 0 ? "pointer-events-auto" : "pointer-events-none"}`}
            >
              <WelcomeStage t={t} language={language} onStartJourney={startJourney} />
            </motion.div>
          )}

          {/* ==========================================
              STAGE 2: SOBERANÍA ALIMENTARIA (Z = -1000)
              ========================================== */}
          {renderedStages[1] && (
            <motion.div
              style={{
                z: stage2Z,
                opacity: stage2Opacity,
                scale: stage2Scale,
                zIndex: activeStage === 1 ? 30 : 0
              }}
              className={`absolute inset-0 flex items-center justify-center overflow-hidden backface-hidden ${activeStage === 1 ? "pointer-events-auto" : "pointer-events-none"}`}
            >
              <SovereigntyStage t={t} />
            </motion.div>
          )}

          {/* ==========================================
              STAGE 3: CATÁLOGO FLOTANTE 3D (Z = -2000)
              ========================================== */}
          {renderedStages[2] && (
            <motion.div
              style={{
                z: stage3Z,
                opacity: stage3Opacity,
                scale: stage3Scale,
                zIndex: activeStage === 2 ? 30 : 0
              }}
              className={`absolute inset-0 flex items-center justify-center p-4 sm:p-8 overflow-hidden backface-hidden ${activeStage === 2 ? "pointer-events-auto" : "pointer-events-none"}`}
            >
              <ProductsStage t={t} language={language} featuredProducts={featuredProducts} />
            </motion.div>
          )}

          {/* ==========================================
              STAGE 4: COMUNIDAD & RED (Z = -3000)
              ========================================== */}
          {renderedStages[3] && (
            <motion.div
              style={{
                z: stage4Z,
                opacity: stage4Opacity,
                scale: stage4Scale,
                zIndex: activeStage === 3 ? 30 : 0
              }}
              className={`absolute inset-0 flex items-center justify-center overflow-hidden backface-hidden ${activeStage === 3 ? "pointer-events-auto" : "pointer-events-none"}`}
            >
              <CommunityStage t={t} language={language} initialForumTopics={initialForumTopics} realStats={realStats} />
            </motion.div>
          )}

        </div>

        {/* FLOATING ACTION BUTTON (NEXT STAGE / RETURN) */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, activeStage === 3 ? -8 : 8, 0] }}
          transition={{ 
            opacity: { duration: 0.3 },
            y: { repeat: Infinity, duration: 2 } 
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
          onClick={() => scrollToStage(activeStage === 3 ? 0 : activeStage + 1)}
          >
            {activeStage === 3 && <ArrowUp className="w-5 h-5 text-primary" />}
            <span className="text-xs tracking-widest font-semibold uppercase opacity-75">
              {activeStage === 3 
                ? (language === "es" ? "Volver al inicio" : "Back to top")
                : (language === "es" ? "Desliza para avanzar" : "Scroll to explore")}
            </span>
            {activeStage !== 3 && <ArrowDown className="w-5 h-5 text-primary" />}
        </motion.div> */}
      </div>

      <style>{`
        @keyframes wave-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes sovereignty-orb-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(60px, -40px) scale(1.2); }
          50% { transform: translate(0, 0) scale(0.9); }
          75% { transform: translate(-40px, 50px) scale(1.1); }
        }
        @keyframes sovereignty-orb-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-50px, 50px) scale(0.9); }
          50% { transform: translate(0, 0) scale(1.2); }
          75% { transform: translate(40px, -40px) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ImmersiveJourney;
