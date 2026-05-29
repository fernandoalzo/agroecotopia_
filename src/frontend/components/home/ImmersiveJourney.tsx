"use client";

import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Leaf, Sprout, Sparkles } from "lucide-react";
import { Product } from "@/types";

// Import ALL images from assets for dynamic background slideshow
import heroAgro from "@/assets/hero-agro.jpg";
import communityImg from "@/assets/agro_community_journey.png";
import ecoProducts from "@/assets/eco_products_journey.png";
import strawberry from "@/assets/beautiful-strawberry-garden-sunrise-doi-ang-khang-chiang-mai-thailand.jpg";
import envConservation from "@/assets/environmental-conservation-plant-sustainability.jpg";
import sunnyMeadow from "@/assets/sunny-meadow-landscape.jpg";
import cityMountains from "@/assets/city-with-mountains-background.jpg";
import coffeStillLife1 from "@/assets/delicious-organic-coffee-still-life (1).jpg";
import coffeStillLife2 from "@/assets/delicious-organic-coffee-still-life.jpg";
import greenTea from "@/assets/green-tea-plantations-hilltop-chiang-rai-province-thailand-landscape-view-nature.jpg";
import treeBranchCity from "@/assets/tree-branch-with-city-background.jpg";
import tropicalSunset from "@/assets/tropical-sunset-palm-trees-mountain-silhouette-beauty-generated-by-ai.jpg";

const BG_IMAGES = [heroAgro, communityImg, ecoProducts, strawberry, envConservation, sunnyMeadow, cityMountains, coffeStillLife1, coffeStillLife2, greenTea, treeBranchCity, tropicalSunset];

// Import modular sections
import WelcomeStage from "./sections/WelcomeStage";
import SovereigntyStage from "./sections/SovereigntyStage";
import ProductsStage from "./sections/ProductsStage";
import CommunityStage from "./sections/CommunityStage";
import CTAStage from "./sections/CTAStage";

interface ImmersiveJourneyProps {
  initialProducts: Product[];
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

const ImmersiveJourney = ({ initialProducts }: ImmersiveJourneyProps) => {
  const { t, language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  // State to handle hydration and client-side setup
  const [mounted, setMounted] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [bgIndex, setBgIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-cycle background images every 8 seconds
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BG_IMAGES.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [mounted]);

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

  // Update active stage based on scroll progress for the indicator HUD
  useEffect(() => {
    return smoothProgress.on("change", (latest) => {
      if (latest < 0.2) setActiveStage(0);
      else if (latest < 0.45) setActiveStage(1);
      else if (latest < 0.7) setActiveStage(2);
      else if (latest < 0.9) setActiveStage(3);
      else setActiveStage(4);
    });
  }, [smoothProgress]);

  // Stage 1 (Welcome / Intro) Transforms
  // On mobile, disable the 3D immersion (Z + scale) — only fade out
  const introZ = useTransform(smoothProgress, [0, 0.22], isMobile ? [0, 0] : [0, 700]);
  const introOpacity = useTransform(smoothProgress, [0.12, 0.22], [1, 0]);
  const introScale = useTransform(smoothProgress, [0, 0.22], isMobile ? [1, 1] : [1, 1.2]);

  // Stage 2 (Soberanía Alimentaria) Transforms
  const stage2Z = useTransform(smoothProgress, [0.12, 0.28, 0.48], [-1200, 0, 700]);
  const stage2Opacity = useTransform(smoothProgress, [0.12, 0.24, 0.4, 0.48], [0, 1, 1, 0]);
  const stage2Scale = useTransform(smoothProgress, [0.12, 0.28, 0.48], [0.7, 1, 1.2]);

  // Stage 3 (Catalog 3D Showcase) Transforms
  const stage3Z = useTransform(smoothProgress, [0.38, 0.52, 0.72], [-1200, 0, 700]);
  const stage3Opacity = useTransform(smoothProgress, [0.38, 0.48, 0.64, 0.72], [0, 1, 1, 0]);
  const stage3Scale = useTransform(smoothProgress, [0.38, 0.52, 0.72], [0.7, 1, 1.15]);

  // Stage 4 (Community & Network) Transforms
  const stage4Z = useTransform(smoothProgress, [0.62, 0.76, 0.92], [-1200, 0, 700]);
  const stage4Opacity = useTransform(smoothProgress, [0.62, 0.72, 0.86, 0.92], [0, 1, 1, 0]);
  const stage4Scale = useTransform(smoothProgress, [0.62, 0.76, 0.92], [0.7, 1, 1.15]);

  // Stage 5 (Cosechando Futuro / CTA) Transforms
  const stage5Z = useTransform(smoothProgress, [0.84, 0.95], [-1000, 0]);
  const stage5Opacity = useTransform(smoothProgress, [0.84, 0.92], [0, 1]);
  const stage5Scale = useTransform(smoothProgress, [0.84, 0.95], [0.85, 1]);

  const startJourney = () => {
    const scrollHeight = containerRef.current?.scrollHeight || 0;
    const maxScroll = Math.max(0, scrollHeight - window.innerHeight);
    window.scrollTo({
      top: 0.32 * maxScroll,
      behavior: "smooth"
    });
  };

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
      style={{ height: "480vh" }} // Provides the scroll headroom
    >
      {/* PERSISTENT HUD: Navigation dots and scroll indicators */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-4 items-center bg-background/30 backdrop-blur-md px-3 py-6 rounded-full border border-primary/10 shadow-lg">
        {[0, 1, 2, 3, 4].map((idx) => {
          const labels = [
            language === "es" ? "Inicio" : "Welcome",
            language === "es" ? "Soberanía" : "Sovereignty",
            language === "es" ? "Nuestra Tierra" : "Harvest Showcase",
            language === "es" ? "Comunidad" : "Our Network",
            language === "es" ? "Cosechar" : "Future"
          ];
          return (
            <button
              key={idx}
              onClick={() => {
                const targetScroll = [0, 0.32, 0.52, 0.76, 0.98][idx];
                const scrollHeight = containerRef.current?.scrollHeight || 0;
                const maxScroll = Math.max(0, scrollHeight - window.innerHeight);
                window.scrollTo({
                  top: targetScroll * maxScroll,
                  behavior: "smooth"
                });
              }}
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
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">

        {/* ATMOSPHERIC BACKGROUND EFFECTS */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,_var(--color-primary)_0%,_transparent_75%] opacity-5 mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background pointer-events-none" />

        {/* DYNAMIC BACKGROUND SLIDESHOW — always visible across all stages */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={bgIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={BG_IMAGES[bgIndex]}
                alt="Agroecotopia Background"
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-background/75 backdrop-blur-[1px]" />
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
          <motion.div
            style={{
              z: introZ,
              opacity: introOpacity,
              scale: introScale,
              transformStyle: "preserve-3d",
              zIndex: activeStage === 0 ? 30 : 0
            }}
            className={`absolute inset-0 flex items-center justify-center p-4 ${activeStage === 0 ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <WelcomeStage t={t} language={language} onStartJourney={startJourney} />
          </motion.div>

          {/* ==========================================
              STAGE 2: SOBERANÍA ALIMENTARIA (Z = -1000)
              ========================================== */}
          <motion.div
            style={{
              z: stage2Z,
              opacity: stage2Opacity,
              scale: stage2Scale,
              transformStyle: "preserve-3d",
              zIndex: activeStage === 1 ? 30 : 0
            }}
            className={`absolute inset-0 flex items-center justify-center p-4 sm:p-8 ${activeStage === 1 ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <SovereigntyStage t={t} />
          </motion.div>

          {/* ==========================================
              STAGE 3: CATÁLOGO FLOTANTE 3D (Z = -2000)
              ========================================== */}
          <motion.div
            style={{
              z: stage3Z,
              opacity: stage3Opacity,
              scale: stage3Scale,
              transformStyle: "preserve-3d",
              zIndex: activeStage === 2 ? 30 : 0
            }}
            className={`absolute inset-0 flex items-center justify-center p-4 sm:p-8 ${activeStage === 2 ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <ProductsStage t={t} language={language} featuredProducts={featuredProducts} />
          </motion.div>

          {/* ==========================================
              STAGE 4: COMUNIDAD & RED (Z = -3000)
              ========================================== */}
          <motion.div
            style={{
              z: stage4Z,
              opacity: stage4Opacity,
              scale: stage4Scale,
              transformStyle: "preserve-3d",
              zIndex: activeStage === 3 ? 30 : 0
            }}
            className={`absolute inset-0 flex items-center justify-center p-4 sm:p-8 ${activeStage === 3 ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <CommunityStage t={t} language={language} />
          </motion.div>

          {/* ==========================================
              STAGE 5: COSECHANDO FUTURO / CTA (Z = -4000)
              ========================================== */}
          <motion.div
            style={{
              z: stage5Z,
              opacity: stage5Opacity,
              scale: stage5Scale,
              transformStyle: "preserve-3d",
              zIndex: activeStage === 4 ? 30 : 0
            }}
            className={`absolute inset-0 flex flex-col items-center justify-center p-4 overflow-y-auto ${activeStage === 4 ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <CTAStage t={t} language={language} />
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default ImmersiveJourney;
