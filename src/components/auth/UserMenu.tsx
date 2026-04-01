"use client";

import { useSession, signOut } from "next-auth/react";
import { signInAction } from "@/actions/auth.actions";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, LogOut, ChevronDown, Moon, Sun, Check, Settings, X, Leaf } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const languages = [
  { code: "es", label: "Español", flagEmoji: "🇨🇴" },
  { code: "en", label: "English", flagEmoji: "🇺🇸" },
] as const;

/**
 * UserMenu — Unified Settings & Auth Menu.
 * Consolidates Theme, Language, and Authentication into a single professional dropdown on Desktop,
 * and a beautiful full-screen overlay on Mobile (matching the main navigation menu).
 */
export default function UserMenu() {
  const { data: session, status } = useSession();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click and wait for mount
  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      // Only handle outside click for desktop (since mobile is full screen portal)
      if (window.innerWidth >= 768 && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent scrolling when mobile menu is open
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

  // Loading skeleton
  if (status === "loading" || !mounted) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-secondary/60" />
    );
  }

  const isDark = theme === "dark";
  const isAuthenticated = !!session?.user;
  const userName = session?.user?.name ?? "Usuario";
  const userImage = session?.user?.image;
  const userEmail = session?.user?.email ?? "";
  const userInitial = userName.charAt(0).toUpperCase();

  // Desktop Dropdown Content
  const DesktopDropdown = (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(
        "hidden md:block absolute right-0 top-full mt-3 w-72 z-[100] overflow-hidden",
        "rounded-2xl border bg-card backdrop-blur-3xl",
        "shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)]",
        "border-border"
      )}
    >
      {/* Header / User Info */}
      {isAuthenticated ? (
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11">
              <div className="h-full w-full overflow-hidden rounded-full ring-2 ring-primary/20 shadow-inner">
                {userImage ? (
                  <Image src={userImage} alt={userName} fill className="object-cover rounded-full" sizes="44px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/20 text-primary font-bold text-lg rounded-full">
                    {userInitial}
                  </div>
                )}
              </div>
              {session?.user?.role === "admin" ? (
                <div className="absolute -bottom-2 -right-2 text-lg drop-shadow-md pointer-events-none select-none">
                  👑
                </div>
              ) : (
                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-sm" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-card-foreground truncate">{userName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-border bg-muted/20">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">
            Mi Cuenta
          </p>
          <p className="text-sm font-medium text-card-foreground">Invitado</p>
        </div>
      )}

      <div className="p-2 space-y-1">
        {/* Appearance Section */}
        <div className="px-2 py-2">
          <p className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
            {t.navbar?.tema ?? "Apariencia"}
          </p>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none hover:bg-muted/50 text-foreground group focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              <span className="group-hover:text-primary transition-colors">{isDark ? "Modo Oscuro" : "Modo Claro"}</span>
            </div>
            <div className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", isDark ? "bg-primary" : "bg-muted-foreground/30")}>
              <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm", isDark ? "translate-x-4" : "translate-x-0.5")} />
            </div>
          </button>
        </div>

        <div className="h-px bg-border/40 dark:bg-white/5 mx-2" />

        {/* Language Section */}
        <div className="px-2 py-2">
          <p className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
            {t.navbar?.idioma ?? "Idioma"}
          </p>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary group",
                language === lang.code ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted/50 text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg group-hover:scale-110 transition-transform">{lang.flagEmoji}</span>
                <span className="group-hover:text-primary transition-colors">{lang.label}</span>
              </div>
              {language === lang.code && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check className="h-4 w-4 text-primary stroke-[3px]" />
                </motion.div>
              )}
            </button>
          ))}
        </div>

        <div className="h-px bg-border/40 dark:bg-white/5 mx-2" />

        {/* Auth Section */}
        <div className="p-2">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-red-500 text-destructive hover:bg-destructive/10 group"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>{t.auth?.signOut ?? "Cerrar sesión"}</span>
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary text-primary hover:bg-primary/10 group font-bold"
            >
              <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              <span>{t.auth?.signIn ?? "Ingresar"}</span>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Mobile Full Screen Menu (Matches Navbar Format)
  const MobileFullScreenMenu = (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 top-0 z-[200] flex h-[100dvh] w-full flex-col bg-primary dark:bg-[#0a1f14] md:hidden overflow-y-auto overscroll-none"
    >
      {/* Background pattern layer (matched with Navbar) */}
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
        {/* Top Header inside menu */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <Leaf className="h-6 w-6 text-white/90" />
          <span className="font-display text-xl font-bold text-white tracking-tight">Agroecotopia</span>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="absolute top-6 right-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 active:scale-90 transition-all"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col gap-6 mt-6">
          <h2 className="text-3xl font-display font-black text-white mb-2 tracking-tight">Configuración</h2>

          {/* User Profile Card */}
          <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm -mx-1">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14">
                  <div className="h-full w-full overflow-hidden rounded-2xl ring-2 ring-white/20">
                    {userImage ? (
                      <Image src={userImage} alt={userName} fill className="object-cover rounded-2xl" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/10 text-white font-bold text-2xl rounded-2xl">
                        {userInitial}
                      </div>
                    )}
                  </div>
                  {session?.user?.role === "admin" ? (
                    <div className="absolute -bottom-2 -right-2 text-2xl drop-shadow-xl pointer-events-none select-none">
                      👑
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-[#0a1f14] shadow-lg" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-white truncate">{userName}</p>
                  <p className="text-sm text-white/60 truncate">{userEmail}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">{t.auth?.myAccount ?? "Mi Cuenta"}</span>
                <span className="text-xl font-bold text-white tracking-tight">Modo Invitado</span>
              </div>
            )}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/5 to-transparent my-2" />

          {/* Settings Grid */}
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">{t.navbar?.tema ?? "Apariencia"}</span>
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm active:scale-95 transition-all text-white"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/5">
                    {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </div>
                  <span className="font-bold text-lg">{isDark ? "Modo Oscuro" : "Modo Claro"}</span>
                </div>
                <div className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", isDark ? "bg-white/20" : "bg-black/20")}>
                  <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md", isDark ? "translate-x-6" : "translate-x-1")} />
                </div>
              </button>
            </div>

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
                    <span className="font-bold text-left text-base">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Lock Info */}
        <div className="mt-auto space-y-4">
          <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/5 to-transparent" />

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex items-center justify-between gap-4 w-full rounded-3xl bg-[#0f2a1d] hover:bg-red-950 border border-white/10 px-8 py-5 text-white shadow-xl active:scale-95 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 text-red-400">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="font-display text-xl font-bold tracking-tight text-red-400">Cerrar Sesión</span>
              </div>
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-4 w-full rounded-3xl bg-white text-primary px-8 py-5 shadow-xl active:scale-95 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                  <LogIn className="h-5 w-5" />
                </div>
                <span className="font-display text-xl font-bold tracking-tight">{t.auth?.signIn ?? "Ingresar"}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-black/5 flex items-center justify-center">
                <Leaf className="h-4 w-4 text-primary" />
              </div>
            </Link>
          )}

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
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "flex items-center gap-2 rounded-full transition-all duration-300",
          isAuthenticated
            ? "py-1 pl-1 pr-3 bg-secondary/40 hover:bg-secondary/70 border border-border/50 hover:border-primary/30 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:hover:border-primary/30"
            : "p-2 px-3 bg-secondary/40 hover:bg-secondary/70 border border-border/50 hover:border-primary/30 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:hover:border-primary/30",
          open && "ring-2 ring-primary/30 border-primary/50 bg-secondary/70 dark:bg-white/10"
        )}
      >
        {isAuthenticated ? (
          <>
            <div className="relative h-8 w-8">
              <div className="h-full w-full overflow-hidden rounded-full ring-2 ring-primary/30 ring-offset-1 ring-offset-background transition-all group-hover:ring-primary/60">
                {userImage ? (
                  <Image src={userImage} alt={userName} fill className="object-cover rounded-full" sizes="32px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/20 text-primary font-bold text-sm rounded-full">
                    {userInitial}
                  </div>
                )}
              </div>
              {/* Online indicator / Admin Crown */}
              {session?.user?.role === "admin" ? (
                <div className="absolute -bottom-1.5 -right-1.5 text-base drop-shadow-md pointer-events-none select-none">
                  👑
                </div>
              ) : (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background shadow-sm" />
              )}
            </div>

            {/* Name (desktop only) */}
            <span className="hidden lg:inline text-xs font-semibold text-foreground/80 max-w-[100px] truncate">
              {userName.split(" ")[0]}
            </span>

            <ChevronDown className={cn("hidden lg:block h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180 text-primary")} />
          </>
        ) : (
          <div className="flex items-center gap-2 text-foreground/80">
            <Settings className="h-4 w-4 text-primary/80" />
            <span className="hidden lg:inline text-xs font-semibold">Configuración</span>
            <ChevronDown className={cn("hidden lg:block h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180 text-primary")} />
          </div>
        )}
      </motion.button>

      {/* Render Dropdown for Desktop and Portaled Overlay for Mobile */}
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
