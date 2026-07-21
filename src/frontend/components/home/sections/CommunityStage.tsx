"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, Globe, MessageCircle, ShoppingBag, TreePine, Bird } from "lucide-react";

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");



interface CommunityStageProps {
  language: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialForumTopics?: any[];
  realStats?: { users: number; posts: number; products: number };
}

const CommunityStage = ({ t, language, initialForumTopics, realStats }: CommunityStageProps) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);



  const [activeIndex, setActiveIndex] = useState(0);
  const [echoingIndex, setEchoingIndex] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const autoRotateRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const defaultTopics: Array<{
    title: string; author: string; avatar: string; participants: number;
    posts: number; time: string; color: string; href: string;
  }> = [
    {
      title: language === "es" ? "Nuevas técnicas de compostaje para el verano" : "New composting techniques for summer",
      author: "María G.",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Maria",
      participants: 24,
      posts: 156,
      time: "2h",
      color: "bg-emerald-500",
      href: "/comunidad/post/" + slugify(language === "es" ? "compostaje-verano" : "composting-summer")
    },
    {
      title: language === "es" ? "Intercambio de semillas nativas y ancestrales" : "Native and ancestral seeds exchange",
      author: "Carlos P.",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Carlos",
      participants: 12,
      posts: 89,
      time: "5h",
      color: "bg-amber-500",
      href: "/comunidad/post/" + slugify(language === "es" ? "intercambio-semillas" : "seed-exchange")
    },
    {
      title: language === "es" ? "Control orgánico de plagas en invernaderos" : "Organic pest control in greenhouses",
      author: "Ana M.",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Ana",
      participants: 45,
      posts: 312,
      time: "1d",
      color: "bg-blue-500",
      href: "/comunidad/post/" + slugify(language === "es" ? "control-plagas" : "pest-control")
    }
  ];

  const topicsToRender = initialForumTopics && initialForumTopics.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? initialForumTopics.map((t: any) => ({ ...t, href: t.href || `/comunidad/post/${t.id || slugify(t.title)}` }))
    : defaultTopics;

  // Auto-rotation carousel
  useEffect(() => {
    if (echoingIndex !== null) return;
    autoRotateRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(autoRotateRef.current);
  }, [echoingIndex]);

  const handleCardClick = useCallback(
    (index: number, href: string) => {
      if (echoingIndex !== null) return;
      setIsNavigating(true);
      setEchoingIndex(index);
      setTimeout(() => {
        router.push(href);
      }, 700);
    },
    [echoingIndex, router]
  );

  const getCardPosition = useCallback(
    (index: number) => {
      const diff = (index - activeIndex + 3) % 3;
      const offset = isMobile ? 44 : 72;
      if (diff === 0)
        return { y: 0, scale: 1, opacity: 1, rotateX: 0, rotateY: 0, zIndex: 30, shadow: true };
      if (diff === 1)
        return { y: offset, scale: isMobile ? 0.82 : 0.78, opacity: isMobile ? 0.35 : 0.45, rotateX: -3, rotateY: isMobile ? 0 : 6, zIndex: 28, shadow: false };
      return { y: -offset, scale: isMobile ? 0.9 : 0.88, opacity: isMobile ? 0.55 : 0.65, rotateX: 3, rotateY: isMobile ? 0 : -6, zIndex: 29, shadow: false };
    },
    [activeIndex, isMobile]
  );

  const words = t.comunidadPage.hero.description.split(" ");

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
    >



      {/* Horizontal rule decorations */}
      <div
        className="absolute top-[12%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.65 0.2 120 / 0.15), transparent)",
          animation: "community-line 4.5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[12%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.55 0.18 80 / 0.15), transparent)",
          animation: "community-line 5.5s ease-in-out 1s infinite",
        }}
      />

      {/* Content */}
      <motion.div
        animate={isNavigating ? { scale: 1.4, opacity: 0, filter: "blur(10px)" } : {}}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center"
      >
        {/* Left column: text + stats */}
        <div className="flex flex-col">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
            className="mb-3 sm:mb-5"
          >
            <span
              className="inline-flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-bold text-accent/70 tracking-[0.25em] uppercase"
              style={{ animation: "badge-letter-space 3s ease-in-out infinite" }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-accent"
                style={{
                  willChange: "transform",
                  animation: "dot-pulse 2s ease-in-out infinite",
                }}
              />
              {t.comunidadPage.hero.badge}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight mb-2 sm:mb-3"
          >
            {t.comunidadPage.hero.title}{" "}
            <span
              className="inline-block bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_200%] bg-clip-text text-transparent"
              style={{ animation: "gradient-community 4s ease-in-out infinite" }}
            >
              {t.comunidadPage.hero.titleAccent}
            </span>
          </motion.h2>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="h-0.5 w-16 sm:w-24 bg-gradient-to-r from-accent/60 via-primary/40 to-transparent rounded-full mb-4 sm:mb-5 origin-left"
          />

          {/* Description - CSS word reveal */}
          <p className="text-muted-foreground/90 text-xs sm:text-base leading-relaxed mb-4 sm:mb-6 max-w-lg">
            {words.map((word: string, i: number) => (
              <span
                key={i}
                className="inline-block mr-[0.25em]"
                style={{
                  animation: `word-fade 0.4s ease-out ${0.45 + i * 0.025}s both`,
                }}
              >
                {word}
              </span>
            ))}
          </p>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-3 gap-2 sm:gap-4"
          >
            {[
              { icon: Users, value: realStats?.users || 500, label: language === "es" ? "Familias" : "Families" },
              { icon: MessageCircle, value: realStats?.posts || 100, label: language === "es" ? "Discusiones" : "Discussions" },
              { icon: ShoppingBag, value: realStats?.products || 15, label: language === "es" ? "Productos" : "Products" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                whileTap={{ scale: 0.97 }}
                className="relative p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-accent/[0.04] border border-accent/10 overflow-hidden group cursor-default"
              >
                <div className="relative text-center">
                  <div
                    style={{
                      animation: `stat-float 3s ease-in-out ${i * 0.3}s infinite`,
                    }}
                  >
                    <stat.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent mx-auto mb-0.5 sm:mb-1" />
                  </div>
                  <h4 className="text-sm sm:text-xl font-black text-foreground">{stat.value}+</h4>
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase font-bold tracking-wide mt-0.5">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-4 sm:mt-6"
          >
            <button
              onClick={() => {
                setIsNavigating(true);
                setTimeout(() => {
                  router.push("/comunidad");
                }, 800);
              }}
              disabled={isNavigating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent/10 border border-accent/20 text-accent px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold hover:bg-accent hover:text-white transition-all duration-300 w-full sm:w-auto cursor-pointer relative z-50 active:scale-95 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-70"
            >
              <span style={{ animation: "cta-shift 2s ease-in-out infinite" }}>
                {t.comunidadPage.hero.ctaPrimary}
              </span>
            </button>
          </motion.div>
        </div>

        {/* Right column: forum carousel */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="relative w-full h-[280px] sm:h-[340px] lg:h-[420px] flex items-center justify-center perspective-[1200px] mt-6 lg:mt-0"
        >
          {/* Carousel stage glow */}
          <div
            className="absolute w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{
              willChange: "transform",
              animation: "carousel-glow 4s ease-in-out infinite",
              background: "radial-gradient(circle, oklch(0.65 0.2 120 / 0.1), transparent 70%)",
            }}
          />

          {topicsToRender.slice(0, 3).map((topic: {
            title: string; author: string; avatar: string; participants: number;
            posts: number; time: string; color: string; href: string;
          }, i: number) => {
            const pos = getCardPosition(i);
            const isActive = pos.zIndex === 30;
            const isEchoing = echoingIndex === i;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 80, scale: 0.8, rotateX: 15 }}
                animate={{
                  y: pos.y,
                  scale: pos.scale,
                  opacity: isEchoing ? 0 : pos.opacity,
                  rotateX: pos.rotateX,
                  rotateY: pos.rotateY,
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 18,
                  mass: isActive ? 0.8 : 1.0,
                }}
                whileHover={
                  !isMobile && isActive && echoingIndex === null
                    ? {
                        y: -6,
                        scale: 1.04,
                        rotateX: 0,
                        rotateY: 0,
                        transition: { type: "spring", stiffness: 250, damping: 16 },
                      }
                    : {}
                }
                whileTap={isActive && echoingIndex === null ? { scale: 0.96 } : {}}
                onClick={() => handleCardClick(i, topic.href)}
                style={{
                  zIndex: pos.zIndex,
                  transformStyle: "preserve-3d",
                  willChange: "transform",
                }}
                className={`absolute w-full max-w-none sm:max-w-[340px] select-none ${
                  isActive
                    ? "bg-background/85 sm:bg-background/90 border-accent/40 shadow-accent/10 shadow-2xl cursor-pointer"
                    : "bg-background/60 sm:bg-background/70 border-accent/10 shadow-lg cursor-pointer"
                } border p-3.5 sm:p-5 rounded-2xl sm:backdrop-blur-xl backdrop-blur-md flex flex-col gap-2.5 sm:gap-4 group overflow-hidden`}
                role="button"
                tabIndex={0}

              >
                {/* Echo ripple overlay */}
                {isEchoing && (
                  <div
                    className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                    style={{
                      animation: "echo-ripple 0.6s ease-out forwards",
                    }}
                  >
                    <div
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full"
                      style={{
                        background: "radial-gradient(circle, oklch(0.65 0.2 120 / 0.3), oklch(0.55 0.18 80 / 0.3), transparent)",
                        animation: "echo-expand 0.6s ease-out forwards",
                      }}
                    />
                  </div>
                )}

                {/* Card content — shrink on echo */}
                <motion.div
                  className="relative flex flex-col gap-2.5 sm:gap-4"
                  animate={isEchoing ? { scale: 0.9, opacity: 0, filter: "blur(4px)" } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                        <img src={topic.avatar} alt={topic.author} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-sm font-semibold text-foreground leading-none truncate">{topic.author}</p>
                        <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 font-medium">{topic.time} {language === "es" ? "atrás" : "ago"}</p>
                      </div>
                    </div>
                    <div className="flex -space-x-1.5 sm:-space-x-2 shrink-0">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 border-2 border-background z-20 flex items-center justify-center overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/notionists/svg?seed=User1" alt="" className="w-full h-full opacity-70" />
                      </div>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent/20 border-2 border-background z-10 flex items-center justify-center overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/notionists/svg?seed=User2" alt="" className="w-full h-full opacity-70" />
                      </div>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted border-2 border-background z-0 flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-foreground">
                        +{topic.participants}
                      </div>
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-base font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                    {topic.title}
                  </h4>

                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold text-muted-foreground">
                        <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-accent/70" />
                        <span>{topic.posts}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold text-muted-foreground">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-accent/70" />
                        <span>{topic.participants}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-[8px] sm:text-[10px] font-bold uppercase text-muted-foreground/70 tracking-wider">
                        {isActive ? (language === "es" ? "Activo" : "Active") : (language === "es" ? "Explorar" : "Explore")}
                      </span>
                      <div
                        className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full ${topic.color} ${isActive ? "shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "opacity-50"}`}
                        style={isActive ? {
                          willChange: "transform",
                          animation: "dot-pulse 2s ease-in-out infinite",
                        } : {}}
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}

          {/* Carousel nav dots */}
          {!isMobile && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => {
                  if (echoingIndex === null) {
                    setActiveIndex(i);
                  }
                }}
                className="group relative w-8 h-8 flex items-center justify-center"
              >
                <span
                  className={`block ${i === activeIndex ? "bg-accent" : "bg-accent/30 group-hover:bg-accent/60"}`}
                  style={{
                    transition: "all 0.3s",
                    width: i === activeIndex ? 20 : 6,
                    height: 6,
                    borderRadius: i === activeIndex ? 3 : 9999,
                  }}
                />
              </button>
            ))}
          </div>
          )}
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes gradient-community {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes badge-letter-space {
          0%, 100% { letter-spacing: 0.25em; }
          50% { letter-spacing: 0.35em; }
        }
        @keyframes word-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes stat-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes cta-shift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }

        @keyframes community-line {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        @keyframes carousel-glow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
        @keyframes echo-ripple {
          0% { transform: scale(0.3); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes echo-expand {
          0% { transform: scale(0); opacity: 0.8; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CommunityStage;
