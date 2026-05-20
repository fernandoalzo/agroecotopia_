"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Check, Settings, X, Leaf, Sparkles, Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { config } from "@/config/config";

const languages = [
  { code: "es", label: "Español", flagEmoji: "🇨🇴", region: "Colombia" },
  { code: "en", label: "English", flagEmoji: "🇺🇸", region: "United States" },
] as const;

/**
 * UserMenu — Premium Settings Menu.
 * Consolidates Theme and Language preferences into a refined glassmorphism dropdown on Desktop,
 * and a full-screen overlay on Mobile. Auth is handled separately in the Navbar.
 */
export default function UserMenu() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      if (window.innerWidth >= 768 && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-secondary/60" />
    );
  }

  const isDark = theme === "dark";

  // ──────────────────────────────────────────────
  // Desktop Premium Dropdown
  // ──────────────────────────────────────────────
  const DesktopDropdown = (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "hidden md:block absolute right-0 top-full mt-3 w-80 z-[100] overflow-hidden",
        "rounded-2xl",
        // Premium glassmorphism
        "bg-card/80 dark:bg-card/60 backdrop-blur-2xl backdrop-saturate-150",
        // Gradient border effect
        "ring-1 ring-border/50 dark:ring-white/10",
        // Elevated shadow
        "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15),0_0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6),0_0_1px_0_rgba(255,255,255,0.05)]",
      )}
    >
      {/* Subtle top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/10 dark:border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tracking-tight">
              {t.navbar?.tema ? "Preferencias" : "Preferencias"}
            </p>
            <p className="text-[10px] text-muted-foreground/70 font-medium">
              Personaliza tu experiencia
            </p>
          </div>
        </div>
      </div>

      <div className="h-px mx-4 bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      <div className="p-3 space-y-1">
        {/* Appearance Section */}
        <div className="px-1 pt-2 pb-1">
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50 mb-2 flex items-center gap-1.5">
            <span className="h-px w-3 bg-muted-foreground/20" />
            {t.navbar?.tema ?? "Apariencia"}
          </p>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 outline-none group
              hover:bg-primary/5 dark:hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-300",
                isDark
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              )}>
                <motion.div
                  key={isDark ? "moon" : "sun"}
                  initial={{ rotate: -30, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </motion.div>
              </div>
              <div className="text-left">
                <span className="block text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {isDark ? "Modo Oscuro" : "Modo Claro"}
                </span>
                <span className="block text-[10px] text-muted-foreground/60">
                  {isDark ? "Tema nocturno activo" : "Tema diurno activo"}
                </span>
              </div>
            </div>
            <div className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 shadow-inner",
              isDark
                ? "bg-indigo-500/30 dark:bg-indigo-500/40"
                : "bg-muted-foreground/20"
            )}>
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                  "inline-block h-5 w-5 rounded-full shadow-md transition-colors",
                  isDark
                    ? "translate-x-[22px] bg-indigo-400"
                    : "translate-x-0.5 bg-white"
                )}
              />
            </div>
          </button>
        </div>

        <div className="h-px mx-3 bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* Language Section */}
        <div className="px-1 pt-2 pb-1">
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50 mb-2 flex items-center gap-1.5">
            <span className="h-px w-3 bg-muted-foreground/20" />
            {t.navbar?.idioma ?? "Idioma"}
          </p>
          <div className="space-y-0.5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary group",
                  language === lang.code
                    ? "bg-primary/8 dark:bg-primary/15 ring-1 ring-primary/15 dark:ring-primary/25"
                    : "hover:bg-muted/40 dark:hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center h-9 w-9 rounded-xl border transition-all",
                    language === lang.code
                      ? "bg-primary/10 border-primary/20 shadow-sm"
                      : "bg-secondary/50 border-border/30"
                  )}>
                    <span className="text-lg transition-transform group-hover:scale-110">{lang.flagEmoji}</span>
                  </div>
                  <div className="text-left">
                    <span className={cn(
                      "block text-sm font-semibold transition-colors",
                      language === lang.code ? "text-primary" : "text-foreground group-hover:text-primary"
                    )}>
                      {lang.label}
                    </span>
                    <span className="block text-[10px] text-muted-foreground/60">{lang.region}</span>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {language === lang.code && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 45 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 dark:bg-primary/25"
                    >
                      <Check className="h-3.5 w-3.5 text-primary stroke-[3px]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="px-4 py-2.5 bg-muted/20 dark:bg-white/[0.02]">
        <p className="text-[9px] text-center uppercase tracking-[0.2em] text-muted-foreground/40 font-bold">
          {config.app.name} · Ajustes
        </p>
      </div>
    </motion.div>
  );

  // ──────────────────────────────────────────────
  // Mobile Full Screen Settings Menu
  // ──────────────────────────────────────────────
  const MobileFullScreenMenu = (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 top-0 z-[200] flex h-[100dvh] w-full flex-col bg-primary dark:bg-[#0a1f14] md:hidden overflow-y-auto overscroll-none"
    >
      {/* Background pattern layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.07] mix-blend-overlay">
        <div className="absolute top-0 -left-10 w-64 h-64 rotate-12">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
            <path d="M40 160C40 160 20 120 40 80C60 40 100 20 140 40C180 60 180 120 160 140C140 160 100 180 40 160Z" stroke="currentColor" strokeWidth="1" />
            <path d="M40 160L140 40" stroke="currentColor" strokeWidth="0.5" />
            <path d="M80 120C100 110 120 100 140 100" stroke="currentColor" strokeWidth="0.5" />
            <path d="M60 100C80 90 100 80 120 80" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="absolute bottom-20 -right-16 w-80 h-80 -rotate-45">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
            <path d="M40 160C40 160 20 120 40 80C60 40 100 20 140 40C180 60 180 120 160 140C140 160 100 180 40 160Z" stroke="currentColor" strokeWidth="1" />
            <path d="M40 160L140 40" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20">
          <div className="w-full h-full bg-[radial-gradient(circle,transparent_20%,#000_100%)] mix-blend-multiply" />
        </div>
      </div>

      <div className="relative flex flex-col min-h-full px-6 pt-24 pb-16">
        {/* Top Header */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <Leaf className="h-6 w-6 text-white/90" />
          <span className="font-display text-xl font-bold text-white tracking-tight">{config.app.name}</span>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="absolute top-6 right-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 active:scale-90 transition-all"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col gap-6 mt-6">
          <h2 className="text-3xl font-display font-black text-white mb-2 tracking-tight">
            Configuración
          </h2>

          <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/5 to-transparent" />

          {/* Settings Grid */}
          <div className="space-y-6">
            {/* Theme */}
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">{t.navbar?.tema ?? "Apariencia"}</span>
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm active:scale-95 transition-all text-white"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl border",
                    isDark
                      ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                      : "bg-amber-500/20 border-amber-500/30 text-amber-300"
                  )}>
                    {isDark ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-lg">{isDark ? "Modo Oscuro" : "Modo Claro"}</span>
                    <span className="block text-xs text-white/50">{isDark ? "Tema nocturno" : "Tema diurno"}</span>
                  </div>
                </div>
                <div className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", isDark ? "bg-indigo-500/30" : "bg-white/20")}>
                  <span className={cn("inline-block h-5 w-5 transform rounded-full shadow-md transition-transform", isDark ? "translate-x-6 bg-indigo-400" : "translate-x-1 bg-white")} />
                </div>
              </button>
            </div>

            {/* Language */}
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">{t.navbar?.idioma ?? "Idioma"}</span>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={cn(
                      "flex flex-col gap-3 p-4 rounded-2xl border backdrop-blur-sm active:scale-95 transition-all outline-none",
                      language === lang.code
                        ? "bg-white/20 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)] text-white"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-2xl">{lang.flagEmoji}</span>
                      {language === lang.code && <Check className="h-5 w-5 text-white" />}
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-base">{lang.label}</span>
                      <span className="block text-[10px] text-white/40">{lang.region}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-auto space-y-4 pt-8">
          <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/5 to-transparent" />
          <div className="flex justify-center pt-2 text-white/30">
            <div className="text-[10px] uppercase font-bold tracking-widest">Ajustes del Sistema</div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div ref={menuRef} className="relative z-[100]">
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center justify-center gap-2 rounded-full transition-all duration-300",
          "h-9 w-9 md:h-auto md:w-auto md:py-2 md:px-3",
          "bg-secondary/40 hover:bg-secondary/70 border border-border/50 hover:border-primary/30",
          "dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:hover:border-primary/30",
          open && "ring-2 ring-primary/30 border-primary/50 bg-secondary/70 dark:bg-white/10"
        )}
        aria-label="Settings"
      >
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Settings className={cn(
            "h-4 w-4 transition-colors duration-200",
            open ? "text-primary" : "text-muted-foreground"
          )} />
        </motion.div>
        <span className="hidden lg:inline text-xs font-semibold text-foreground/80">
          Ajustes
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="hidden lg:block"
        >
          <Globe className={cn("h-3 w-3 text-muted-foreground/50 transition-colors", open && "text-primary/60")} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {DesktopDropdown}
            {mounted && createPortal(MobileFullScreenMenu, document.body)}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
