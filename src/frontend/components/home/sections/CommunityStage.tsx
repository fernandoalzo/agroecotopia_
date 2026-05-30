"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, Globe, MessageCircle, ShoppingBag } from "lucide-react";

// Custom hook to create a 3D tilt effect on elements based on mouse position
const useTiltEffect = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    // Normalize coordinates (-0.5 to 0.5)
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Map normalized coordinates to rotation angles (degrees)
  const rotateX = useTransform(y, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-10, 10]);

  return { rotateX, rotateY, handleMouseMove, handleMouseLeave };
};

interface CommunityStageProps {
  t: any;
  language: string;
  initialForumTopics?: any[];
  realStats?: { users: number; posts: number; products: number };
}

const CommunityStage = ({ t, language, initialForumTopics, realStats }: CommunityStageProps) => {
  const tilt4 = useTiltEffect();
  const router = useRouter();
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const defaultTopics = [
    {
      title: language === "es" ? "Nuevas técnicas de compostaje para el verano" : "New composting techniques for summer",
      author: "María G.",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Maria",
      participants: 24,
      posts: 156,
      time: "2h",
      color: "bg-emerald-500"
    },
    {
      title: language === "es" ? "Intercambio de semillas nativas y ancestrales" : "Native and ancestral seeds exchange",
      author: "Carlos P.",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Carlos",
      participants: 12,
      posts: 89,
      time: "5h",
      color: "bg-amber-500"
    },
    {
      title: language === "es" ? "Control orgánico de plagas en invernaderos" : "Organic pest control in greenhouses",
      author: "Ana M.",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Ana",
      participants: 45,
      posts: 312,
      time: "1d",
      color: "bg-blue-500"
    }
  ];

  const topicsToRender = initialForumTopics && initialForumTopics.length > 0 ? initialForumTopics : defaultTopics;

  return (
    <div className="container max-w-5xl mx-auto flex items-center justify-center p-4">
      <motion.div
        style={{
          rotateX: tilt4.rotateX,
          rotateY: tilt4.rotateY,
          transformStyle: "preserve-3d"
        }}
        onMouseMove={tilt4.handleMouseMove}
        onMouseLeave={tilt4.handleMouseLeave}
        className="w-full max-h-[85vh] overflow-y-auto sm:max-h-none sm:overflow-visible p-5 sm:p-8 lg:p-10 rounded-3xl bg-card/90 border border-primary/20 shadow-2xl hover:shadow-3xl transition-all duration-300 backdrop-blur-md grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 items-center scrollbar-hide"
      >
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-xs font-bold text-primary tracking-widest uppercase mb-2 block">
          {t.comunidadPage.hero.badge}
        </span>
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground mb-2 sm:mb-4 leading-tight">
          {t.comunidadPage.hero.title} <span className="text-primary italic">{t.comunidadPage.hero.titleAccent}</span>
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed mb-4 sm:mb-6">
          {t.comunidadPage.hero.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-6 text-center">
          <div className="p-2.5 bg-primary/5 rounded-2xl border border-primary/5">
            <Users className="w-4.5 h-4.5 text-primary mx-auto mb-1" />
            <h4 className="text-base sm:text-xl font-black text-foreground">{realStats?.users || 500}+</h4>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">
              {language === "es" ? "Familias" : "Families"}
            </p>
          </div>
          <div className="p-2.5 bg-primary/5 rounded-2xl border border-primary/5">
            <MessageCircle className="w-4.5 h-4.5 text-primary mx-auto mb-1" />
            <h4 className="text-base sm:text-xl font-black text-foreground">{realStats?.posts || 100}+</h4>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">
              {language === "es" ? "Discusiones" : "Discussions"}
            </p>
          </div>
          <div className="p-2.5 bg-primary/5 rounded-2xl border border-primary/5">
            <ShoppingBag className="w-4.5 h-4.5 text-primary mx-auto mb-1" />
            <h4 className="text-base sm:text-xl font-black text-foreground">{realStats?.products || 15}+</h4>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">
              {language === "es" ? "Productos" : "Products"}
            </p>
          </div>
        </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.location.href = "/comunidad";
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 text-primary px-6 py-3 text-sm font-bold hover:bg-primary hover:text-white transition-all w-full sm:w-auto cursor-pointer relative z-50"
            >
              <span>{t.comunidadPage.hero.ctaPrimary}</span>
            </button>
          </div>
        </div>

        {/* Forum Simulation Right Column */}
        <div className="relative w-full h-[260px] sm:h-[320px] lg:h-[400px] flex items-center justify-center perspective-[1000px] mt-4 lg:mt-0">
          {topicsToRender.slice(0, 3).map((topic, i) => {
            let visualIndex = i;
            if (i === activeCardIndex) {
              visualIndex = 0;
            } else if (i < activeCardIndex) {
              visualIndex = i + 1;
            } else {
              visualIndex = i;
            }

            return (
            <motion.div
              key={i}
              layout
              onClick={() => setActiveCardIndex(i)}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1 }}
              animate={{ y: visualIndex * 60 - 60, scale: 1 - visualIndex * 0.06 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{ zIndex: 30 - visualIndex }}
              className={`absolute w-full max-w-[300px] sm:max-w-[340px] bg-background/95 border ${visualIndex === 0 ? "border-primary/40 shadow-primary/10" : "border-primary/20 shadow-primary/5"} p-4 sm:p-5 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-3 sm:gap-4 cursor-pointer hover:!scale-105 hover:border-primary/50 transition-colors duration-300 group`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border">
                    <img src={topic.avatar} alt={topic.author} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground leading-none">{topic.author}</p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 font-medium">{topic.time} {language === "es" ? "atrás" : "ago"}</p>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background z-20 flex items-center justify-center overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=User1" className="w-full h-full opacity-70" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-accent/20 border-2 border-background z-10 flex items-center justify-center overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=User2" className="w-full h-full opacity-70" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-muted border-2 border-background z-0 flex items-center justify-center text-[9px] font-bold text-foreground">
                    +{topic.participants}
                  </div>
                </div>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {topic.title}
              </h4>

              <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <MessageCircle className="w-4 h-4 text-primary/70" />
                    <span>{topic.posts} {language === "es" ? "respuestas" : "replies"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Users className="w-4 h-4 text-primary/70" />
                    <span>{topic.participants}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    {visualIndex === 0 ? (language === "es" ? "Activo" : "Active") : (language === "es" ? "Visto" : "Viewed")}
                  </span>
                  <div className={`w-2.5 h-2.5 rounded-full ${topic.color} ${visualIndex === 0 ? "animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "opacity-50"}`} />
                </div>
              </div>
            </motion.div>
          )})}
        </div>
      </motion.div>
    </div>
  );
};

export default CommunityStage;
