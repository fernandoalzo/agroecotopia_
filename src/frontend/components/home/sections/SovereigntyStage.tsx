"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { CheckCircle } from "lucide-react";

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

interface SovereigntyStageProps {
  t: any;
}

const SovereigntyStage = ({ t }: SovereigntyStageProps) => {
  const tilt2 = useTiltEffect();

  return (
    <div className="container max-w-3xl mx-auto flex items-center justify-center p-4">
      <motion.div
        style={{
          rotateX: tilt2.rotateX,
          rotateY: tilt2.rotateY,
          transformStyle: "preserve-3d"
        }}
        onMouseMove={tilt2.handleMouseMove}
        onMouseLeave={tilt2.handleMouseLeave}
        className="w-full p-6 sm:p-10 rounded-3xl bg-card/90 border border-primary/20 shadow-2xl hover:shadow-3xl transition-all duration-300 backdrop-blur-md"
      >
        <span className="text-[10px] sm:text-xs font-bold text-primary tracking-widest uppercase mb-2 block">
          {t.about.badge}
        </span>
        <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4 leading-tight">
          Soberanía <span className="text-primary italic">Alimentaria</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
          {t.about.description1}
        </p>

        {/* Features list inside card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border/50 pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm sm:text-base font-bold text-foreground">{t.about.pillars.organic.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{t.about.pillars.organic.desc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm sm:text-base font-bold text-foreground">{t.about.pillars.sustainable.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{t.about.pillars.sustainable.desc}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SovereigntyStage;
