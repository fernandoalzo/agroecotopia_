"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const ContactSection = () => {
  const { t } = useLanguage();

  return (
    <section id="contacto" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center md:mb-16"
        >
          <span className="mb-2 inline-block font-body text-xs font-semibold uppercase tracking-widest text-primary md:text-sm">
            {t.contact.badge}
          </span>
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl md:text-5xl">{t.contact.title}</h2>
          <p className="mx-auto mt-3 max-w-md font-body text-sm text-muted-foreground md:mt-4 md:max-w-xl md:text-base">
            {t.contact.description}
          </p>
        </motion.div>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 md:gap-8">
        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-4 md:space-y-6"
        >
          {[
            { icon: MapPin, text: t.contact.address },
            { icon: Phone, text: "+57 312 669 0108" },
            { icon: Mail, text: "hola@agroecotopia.eco" },
          ].map((c) => (
            <div key={c.text} className="flex items-start gap-3 md:gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary md:h-10 md:w-10">
                <c.icon className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <p className="font-body text-sm text-muted-foreground md:text-base">{c.text}</p>
            </div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-card md:space-y-4 md:p-6"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="text"
            placeholder={t.contact.form.name}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring md:px-4 md:py-3"
          />
          <input
            type="email"
            placeholder={t.contact.form.email}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring md:px-4 md:py-3"
          />
          <textarea
            rows={4}
            placeholder={t.contact.form.message}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring md:px-4 md:py-3"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-5 py-2.5 font-body text-sm font-semibold text-primary-foreground shadow-card transition-shadow hover:shadow-card-hover md:px-6 md:py-3 md:text-base"
          >
            {t.contact.form.submit}
          </button>
        </motion.form>
      </div>
    </div>
  </section>
);
}

export default ContactSection;
