"use client";

import { motion } from "framer-motion";
import { Moon, Sun, Check, X, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/config/config";

const languages = [
    { code: "es", label: "Español", flagEmoji: "🇨🇴", region: "Colombia" },
    { code: "en", label: "English", flagEmoji: "🇺🇸", region: "United States" },
] as const;

type LanguageCode = (typeof languages)[number]["code"];

interface UserMenuMobileProps {
    isDark: boolean;
    language: LanguageCode;
    tNavbar: { tema?: string; idioma?: string } | undefined;
    onToggleTheme: () => void;
    onSetLanguage: (code: LanguageCode) => void;
    onClose: () => void;
}

export const UserMenuMobile = ({
    isDark,
    language,
    tNavbar,
    onToggleTheme,
    onSetLanguage,
    onClose,
}: UserMenuMobileProps) => {
    return (
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
                    onClick={onClose}
                    className="absolute top-6 right-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 active:scale-90 transition-all"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="flex flex-col gap-6 mt-6">
                    <h2 className="text-3xl font-display font-black text-white mb-2 tracking-tight">
                        Configuración
                    </h2>

                    <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/5 to-transparent" />

                    <div className="space-y-6">
                        {/* Theme */}
                        <div className="space-y-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">
                                {tNavbar?.tema ?? "Apariencia"}
                            </span>
                            <button
                                onClick={onToggleTheme}
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
                                <div className={cn(
                                    "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                                    isDark ? "bg-indigo-500/30" : "bg-white/20"
                                )}>
                                    <span className={cn(
                                        "inline-block h-5 w-5 transform rounded-full shadow-md transition-transform",
                                        isDark ? "translate-x-6 bg-indigo-400" : "translate-x-1 bg-white"
                                    )} />
                                </div>
                            </button>
                        </div>

                        {/* Language */}
                        <div className="space-y-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">
                                {tNavbar?.idioma ?? "Idioma"}
                            </span>
                            <div className="grid grid-cols-2 gap-3">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => onSetLanguage(lang.code)}
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
};