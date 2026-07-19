"use client";

import { useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";

interface CTAStageProps {
  t: any;
  language: string;
}

const CTAStage = ({ t, language }: CTAStageProps) => {
  const router = useRouter();

  return (
    <div className="w-full max-w-4xl text-center my-auto px-4 py-16">

      <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 font-body text-xs font-semibold text-primary uppercase tracking-widest">
        <Heart className="w-3.5 h-3.5 fill-primary" />
        {t.about.tagline || "Cosechando Futuro"}
      </div>

      <h2 className="font-display text-4xl sm:text-7xl font-black text-foreground md:leading-tight mb-6">
        Cultivamos <span className="text-primary italic">conciencia</span>
      </h2>

      <p className="max-w-xl mx-auto font-body text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed">
        {t.common.footerCatchphrase || "Somos una red comprometida con la soberanía alimentaria y la agroecología. Conectamos el campo con tu hogar con productos agroecológicos, frescos y sustentables."}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-16">
        <button
          onClick={() => router.push("/products")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-10 py-4 font-display text-lg font-bold text-white shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        >
          <span>{language === "es" ? "Ir a la Tienda" : "Shop Catalog"}</span>
          <ShoppingCart className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
      </div>

      {/* Small credits footer inside Stage 5 */}
      <div className="border-t border-border/50 pt-8 max-w-md mx-auto text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {t.common.footerText || "Sembramos vida, cosechamos futuro."}</p>
        <p className="mt-1 opacity-75">{t.common.copyright}</p>
      </div>

    </div>
  );
};

export default CTAStage;
