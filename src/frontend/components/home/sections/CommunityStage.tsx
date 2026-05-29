"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, TrendingUp, Globe } from "lucide-react";

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
}

const CommunityStage = ({ t, language }: CommunityStageProps) => {
  const tilt4 = useTiltEffect();
  const router = useRouter();

  return (
    <div className="container max-w-3xl mx-auto flex items-center justify-center p-4">
      <motion.div
        style={{
          rotateX: tilt4.rotateX,
          rotateY: tilt4.rotateY,
          transformStyle: "preserve-3d"
        }}
        onMouseMove={tilt4.handleMouseMove}
        onMouseLeave={tilt4.handleMouseLeave}
        className="w-full p-6 sm:p-10 rounded-3xl bg-card/90 border border-primary/20 shadow-2xl hover:shadow-3xl transition-all duration-300 backdrop-blur-md"
      >
        <span className="text-[10px] sm:text-xs font-bold text-primary tracking-widest uppercase mb-2 block">
          {t.comunidadPage.hero.badge}
        </span>
        <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4 leading-tight">
          {t.comunidadPage.hero.title} <span className="text-primary italic">{t.comunidadPage.hero.titleAccent}</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
          {t.comunidadPage.hero.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-6 text-center">
          <div className="p-2.5 bg-primary/5 rounded-2xl border border-primary/5">
            <Users className="w-4.5 h-4.5 text-primary mx-auto mb-1" />
            <h4 className="text-base sm:text-xl font-black text-foreground">500+</h4>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">
              {language === "es" ? "Familias" : "Families"}
            </p>
          </div>
          <div className="p-2.5 bg-primary/5 rounded-2xl border border-primary/5">
            <TrendingUp className="w-4.5 h-4.5 text-primary mx-auto mb-1" />
            <h4 className="text-base sm:text-xl font-black text-foreground">100%</h4>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">
              {language === "es" ? "Orgánico" : "Organic"}
            </p>
          </div>
          <div className="p-2.5 bg-primary/5 rounded-2xl border border-primary/5">
            <Globe className="w-4.5 h-4.5 text-primary mx-auto mb-1" />
            <h4 className="text-base sm:text-xl font-black text-foreground">15+</h4>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">
              {language === "es" ? "Veredas" : "Regions"}
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
      </motion.div>
    </div>
  );
};

export default CommunityStage;
