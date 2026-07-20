"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import BirdFlockBackground from "./BirdFlockBackground";
import { HomeSkeleton } from "./HomeSkeleton";
import { useHomeData } from "@/hooks/useHomeData";

// Import modular sections
import WelcomeStage from "./sections/WelcomeStage";
import SovereigntyStage from "./sections/SovereigntyStage";
import ProductsStage from "./sections/ProductsStage";
import CommunityStage from "./sections/CommunityStage";

const ImmersiveJourney = () => {
  const { t, language } = useLanguage();
  const { products, forumTopics, stats, isPending, loadPopularProducts } = useHomeData();
  const containerRef = useRef<HTMLDivElement>(null);

  const welcomeRef = useRef<HTMLDivElement>(null);
  const sovereigntyRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const communityRef = useRef<HTMLDivElement>(null);

  const [activeStage, setActiveStage] = useState(0);

  const scrollToStage = (idx: number) => {
    const refs = [welcomeRef, sovereigntyRef, productsRef, communityRef];
    const targetRef = refs[idx];
    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-30% 0px -40% 0px",
      threshold: 0.1,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const indexStr = entry.target.getAttribute("data-stage-index");
          if (indexStr !== null) {
            setActiveStage(parseInt(indexStr, 10));
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const stageElements = [
      welcomeRef.current,
      sovereigntyRef.current,
      productsRef.current,
      communityRef.current
    ];

    stageElements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      stageElements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  if (isPending) {
    return <HomeSkeleton />;
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-background flex flex-col z-10"
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

      {/* FIXED AMBIENT BACKGROUND DECORATIONS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background">
        <div className="absolute inset-0 opacity-40 dark:opacity-60 mix-blend-multiply dark:mix-blend-screen">
          <motion.div
            animate={{
              x: ["-5%", "0%", "-5%"],
              y: ["-5%", "5%", "-5%"],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[130%] h-[130%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/30 via-primary/5 to-transparent blur-3xl opacity-20 dark:opacity-35"
          />
          <motion.div
            animate={{
              x: ["0%", "-5%", "0%"],
              y: ["5%", "-5%", "5%"],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/30 via-accent/5 to-transparent blur-[100px] opacity-15 dark:opacity-25"
          />
        </div>

        <div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{
            willChange: "transform",
            animation: "sovereignty-orb-a 20s ease-in-out infinite",
            background: "radial-gradient(circle, oklch(0.7 0.25 150 / 0.06), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full pointer-events-none"
          style={{
            willChange: "transform",
            animation: "sovereignty-orb-b 18s ease-in-out infinite",
            background: "radial-gradient(circle, oklch(0.6 0.2 100 / 0.06), transparent 70%)",
          }}
        />

        {/* LIGHTWEIGHT DYNAMIC WAVES */}
        <div className="absolute bottom-0 w-full h-[20vh] overflow-hidden pointer-events-none opacity-20 dark:opacity-30 z-0">
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
      </div>

      {/* SECTIONS: Normal vertical layout with viewport-based entry animations */}
      <div className="relative z-10 w-full flex flex-col">
        <BirdFlockBackground />
        {/* STAGE 1: PORTADA & BIENVENIDA */}
        <motion.section
          id="hero"
          ref={welcomeRef}
          data-stage-index="0"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={sectionVariants}
          className="w-full min-h-screen flex items-center justify-center p-4 relative border-b border-border/5"
        >
          <WelcomeStage t={t} language={language} onStartJourney={() => scrollToStage(1)} />
        </motion.section>

        {/* STAGE 2: SOBERANÍA ALIMENTARIA */}
        <motion.section
          ref={sovereigntyRef}
          data-stage-index="1"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={sectionVariants}
          className="w-full min-h-screen flex items-center justify-center p-4 relative border-b border-border/5"
        >
          <SovereigntyStage t={t} />
        </motion.section>

        {/* STAGE 3: CATÁLOGO */}
        <motion.section
          ref={productsRef}
          data-stage-index="2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={sectionVariants}
          className="w-full min-h-screen flex items-center justify-center p-4 sm:p-8 relative border-b border-border/5"
        >
          <ProductsStage
            t={t}
            language={language}
            initialProducts={products}
            loadPopularProducts={loadPopularProducts}
          />
        </motion.section>

        {/* STAGE 4: COMUNIDAD & RED */}
        <motion.section
          ref={communityRef}
          data-stage-index="3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={sectionVariants}
          className="w-full min-h-screen flex items-center justify-center p-4 relative"
        >
          <CommunityStage t={t} language={language} initialForumTopics={forumTopics} realStats={stats} />
        </motion.section>
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
