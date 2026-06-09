"use client";
import { motion } from "framer-motion";

interface AboutHeroProps { t: any; }

const words = [
  "Una", "plataforma", "que", "conecta", "a", "campesinos,",
  "agrónomos", "y", "profesionales", "del", "agro", "para",
  "cultivar", "conocimiento,", "comercio", "y", "comunidad",
  "en", "todo", "Colombia.",
];

export function AboutHero({ t }: AboutHeroProps) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="absolute top-1/4 left-1/4 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-accent/10 blur-[130px] animate-pulse" />
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary shadow-sm ring-1 ring-primary/20">
              {t.about.badge}
            </span>
            <h1 className="font-display text-4xl font-black leading-[1.15] sm:text-5xl md:text-7xl lg:text-8xl">
              <span className="text-foreground">Donde el Campo y la Tecnología</span>
              <br />
              <span
                className="inline-block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_200%] bg-clip-text text-transparent italic"
                style={{ animation: "gradient-shift 4s ease-in-out infinite" }}
              >
                se Encuentran
              </span>
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-0.5 w-20 sm:w-24 bg-gradient-to-r from-primary/60 via-accent/40 to-transparent rounded-full mb-6 mx-auto origin-center"
            />
            <p className="text-muted-foreground/90 text-sm sm:text-lg leading-[2] sm:leading-[2.2] max-w-xl mx-auto">
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
          </motion.div>
        </div>
      </div>
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes word-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
