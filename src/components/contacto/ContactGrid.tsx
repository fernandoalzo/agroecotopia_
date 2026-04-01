"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Globe, MessageCircle, Share2 } from "lucide-react";

interface ContactGridProps {
  t: any;
}

export function ContactGrid({ t }: ContactGridProps) {
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
      {/* Contact Information Side */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="flex flex-col gap-10 md:gap-14"
      >
        <div className="space-y-6">
          <h2 className="font-display text-4xl font-black text-foreground">
            Datos de <span className="text-primary italic">Contacto</span>
          </h2>
          <div className="h-1.5 w-16 bg-primary/20 rounded-full" />
        </div>

        <div className="grid grid-cols-1 gap-8 md:gap-10">
          {[
            { icon: MapPin, title: "Ubicación", text: t.contact.address, color: "text-red-500" },
            { icon: Phone, title: "Teléfono", text: "+57 312 669 0108", color: "text-blue-500" },
            { icon: Mail, title: "Email", text: "hola@agroecotopia.eco", color: "text-emerald-500" },
          ].map((c, i) => (
            <motion.div 
              key={c.text} 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex items-start gap-6"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/30 dark:bg-primary/5 text-muted-foreground transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110">
                <c.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-sm font-bold uppercase tracking-widest text-primary/60">
                  {c.title}
                </h3>
                <p className="font-body text-lg font-bold text-foreground md:text-xl">{c.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto space-y-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <Share2 className="h-5 w-5 text-primary" />
            Nuestras Redes
          </h3>
          <div className="flex gap-4">
            {[Globe, MessageCircle].map((Icon, i) => (
              <button
                key={i}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50 border border-border/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 active:scale-95"
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Contact Form Side */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <form
          className="relative overflow-hidden space-y-6 rounded-[2.5rem] border border-border bg-card p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Subtle Form Background Effect */}
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          
          <div className="group space-y-2">
            <label className="font-display text-xs font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
              {t.contact.form.name}
            </label>
            <input
              type="text"
              placeholder="Tu nombre completo"
              className="w-full rounded-2xl border border-input bg-background/50 px-6 py-4 font-body text-base text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
            />
          </div>

          <div className="group space-y-2">
            <label className="font-display text-xs font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
              {t.contact.form.email}
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full rounded-2xl border border-input bg-background/50 px-6 py-4 font-body text-base text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
            />
          </div>

          <div className="group space-y-2">
            <label className="font-display text-xs font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
              {t.contact.form.message}
            </label>
            <textarea
              rows={5}
              placeholder="Cuéntanos en qué podemos ayudarte..."
              className="w-full rounded-2xl border border-input bg-background/50 px-6 py-4 font-body text-base text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
            />
          </div>

          <button
            type="submit"
            className="group relative w-full overflow-hidden rounded-2xl bg-primary px-8 py-5 font-display text-lg font-black text-primary-foreground shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10">{t.contact.form.submit}</span>
            <div className="absolute inset-0 -z-10 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-[100%]" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
