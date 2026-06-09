"use client";
import { motion } from "framer-motion";
import { MessageCircle, Store, Briefcase, BookOpen, Globe, Users } from "lucide-react";

interface AboutPillarsProps { t: any; }

export function AboutPillars({ t }: AboutPillarsProps) {
  const pillars = [
    { icon: MessageCircle, title: t.about.pillars.foro.title, desc: t.about.pillars.foro.desc },
    { icon: Store, title: t.about.pillars.tiendas.title, desc: t.about.pillars.tiendas.desc },
    { icon: Briefcase, title: t.about.pillars.consultorias.title, desc: t.about.pillars.consultorias.desc },
    { icon: BookOpen, title: t.about.pillars.conocimiento.title, desc: t.about.pillars.conocimiento.desc },
    { icon: Globe, title: t.about.pillars.conexion.title, desc: t.about.pillars.conexion.desc },
    { icon: Users, title: t.about.pillars.comunidad.title, desc: t.about.pillars.comunidad.desc },
  ];

  return (
    <div className="container mx-auto px-4 md:px-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="group relative flex flex-col gap-4 rounded-3xl bg-card p-8 shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl border border-border/50 hover:border-primary/50 overflow-hidden"
          >
            {/* Background Grain/Texture effect */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,transparent_0%,rgba(var(--primary),0.03)_100%)] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground">
              <p.icon className="h-7 w-7" />
            </div>
            
            <div>
              <h3 className="mb-2 font-display text-xl font-bold text-card-foreground">
                {p.title}
              </h3>
              <p className="font-body text-sm leading-relaxed text-muted-foreground md:text-base">
                {p.desc}
              </p>
            </div>

            {/* Subtle decorative line */}
            <div className="mt-auto h-1 w-0 bg-primary/20 transition-all duration-500 group-hover:w-16" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
