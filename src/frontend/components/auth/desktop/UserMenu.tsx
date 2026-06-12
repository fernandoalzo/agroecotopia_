"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/config/config";

const languages = [
    { code: "es", label: "Español", flagEmoji: "🇨🇴", region: "Colombia" },
    { code: "en", label: "English", flagEmoji: "🇺🇸", region: "United States" },
] as const;

type LanguageCode = (typeof languages)[number]["code"];

interface UserMenuDesktopProps {
    isDark: boolean;
    language: LanguageCode;
    tNavbar: { tema?: string; idioma?: string } | undefined;
    onToggleTheme: () => void;
    onSetLanguage: (code: LanguageCode) => void;
}

export const UserMenuDesktop = ({
    isDark,
    language,
    tNavbar,
    onToggleTheme,
    onSetLanguage,
}: UserMenuDesktopProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "hidden md:block absolute right-0 top-full mt-[18px] w-80 z-[100] overflow-hidden",
                "rounded-2xl",
                "bg-card/80 dark:bg-card/60 backdrop-blur-2xl backdrop-saturate-150",
                "ring-1 ring-border/50 dark:ring-white/10",
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
                        <p className="text-sm font-bold text-foreground tracking-tight">Preferencias</p>
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
                        {tNavbar?.tema ?? "Apariencia"}
                    </p>
                    <button
                        onClick={onToggleTheme}
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
                            isDark ? "bg-indigo-500/30 dark:bg-indigo-500/40" : "bg-muted-foreground/20"
                        )}>
                            <motion.span
                                layout
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={cn(
                                    "inline-block h-5 w-5 rounded-full shadow-md transition-colors",
                                    isDark ? "translate-x-[22px] bg-indigo-400" : "translate-x-0.5 bg-white"
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
                        {tNavbar?.idioma ?? "Idioma"}
                    </p>
                    <div className="space-y-0.5">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => onSetLanguage(lang.code)}
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

            {/* Bottom accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="px-4 py-2.5 bg-muted/20 dark:bg-white/[0.02]">
                <p className="text-[9px] text-center uppercase tracking-[0.2em] text-muted-foreground/40 font-bold">
                    {config.app.name} · Ajustes
                </p>
            </div>
        </motion.div>
    );
};