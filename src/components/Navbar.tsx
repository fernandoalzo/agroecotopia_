"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Menu, X, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useCart } from "@/context/CartContext";
import { LanguageSelector } from "./ui/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { t } = useLanguage();

  const links = [
    { label: t.navbar.inicio, href: "/" },
    { label: t.navbar.productos, href: "/products" },
    { label: t.navbar.nosotros, href: "/#nosotros" },
    { label: t.navbar.contacto, href: "/#contacto" },
  ];

  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sections = ["hero", "nosotros", "contacto"];
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          setActiveSection(id === "hero" ? "/" : `/#${id}`);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  const isActive = (href: string) => {
    if (pathname === "/" && (href === "/" || href.includes("#"))) {
      return activeSection === href;
    }
    return pathname === href;
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 md:h-20 md:px-6">
        <div className="flex-1">
          <Link href="/" className="group relative flex items-center gap-1.5 font-display text-lg font-bold md:gap-3 md:text-2xl transition-all duration-300">
            {/* Animated Logo Container */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 0.95, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <Leaf className="h-6 w-6 text-primary md:h-8 md:w-8 transition-transform duration-500 group-hover:rotate-[25deg] group-hover:scale-125" />
              </motion.div>
              
              {/* Subtle aura behind the leaf */}
              <div className="absolute inset-0 -z-10 h-full w-full rounded-full bg-primary/20 blur-xl transition-all duration-500 group-hover:bg-primary/40 group-hover:blur-2xl" />
            </div>

            {/* Premium Typography Container */}
            <div className="relative overflow-hidden">
              <div className="flex items-center tracking-tight md:tracking-tighter">
                {"Agroecotopia".split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 0 }}
                    whileHover={{ 
                      y: -2,
                      color: "var(--color-primary)",
                      textShadow: "0 0 8px rgba(34, 197, 94, 0.5)", // Subtle neon glow on hover
                      transition: { duration: 0.1 }
                    }}
                    className={cn(
                      "inline-block transition-all duration-300",
                      // Unified primary green for the entire brand title for consistency and maximum legibility
                      "text-primary font-bold md:font-black",
                      // Slightly smaller on mobile to prevent overflow
                      "text-[15px] md:text-2xl"
                    )}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>

              {/* Sophisticated Shine Sweep (Refined for maximum contrast in unified theme) */}
              <motion.div
                className="absolute inset-0 z-20 pointer-events-none"
                initial={{ x: "-100%", opacity: 0 }}
                whileHover={{ 
                  x: ["-100%", "200%"],
                  opacity: [0, 0.5, 0],
                  transition: { 
                    duration: 1, 
                    repeat: Infinity,
                    repeatDelay: 0.2,
                    ease: "easeInOut"
                  }
                }}
              >
                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent skew-x-[-25deg] blur-md dark:via-white/10" />
              </motion.div>

              {/* Luxury Underline */}
              <motion.div 
                className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-primary via-accent to-transparent"
                initial={{ width: 0, opacity: 0 }}
                whileHover={{ width: "100%", opacity: 1 }}
                transition={{ duration: 0.4, ease: "circOut" }}
              />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation (Center) */}
        <div className="hidden items-center gap-6 md:flex lg:gap-8 bg-secondary/30 backdrop-blur-sm px-6 py-2 rounded-full border border-border/40 shadow-inner group/nav overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/nav:translate-x-full transition-transform duration-1000" />
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative py-1 font-body text-sm font-bold tracking-tight transition-all hover:text-primary z-10",
                isActive(l.href) ? "text-primary" : "text-muted-foreground/80"
              )}
            >
              {l.label}
              {isActive(l.href) && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Action Group (Right) - Unified for both desktop and mobile */}
        <div className="flex flex-1 items-center justify-end gap-3 md:gap-4 lg:gap-6">
          {/* Desktop Cart Button (Moved outside the pill) */}
          <div className="hidden md:block">
            <Link
              href="/cart"
              className="group/cart relative flex items-center transition-all active:scale-95"
            >
              <div className="relative flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-black border shadow-lg overflow-hidden
                bg-white text-primary border-primary/20 hover:bg-primary hover:text-white
                dark:bg-primary/10 dark:text-primary dark:border-primary/40 dark:backdrop-blur-md dark:hover:bg-primary dark:hover:text-primary-foreground transition-all duration-300"
              >
                {/* Dynamic hover background sweep - now constrained to this inner dev */}
                <motion.div
                  className="absolute inset-0 bg-primary/20 dark:bg-primary/30 -translate-x-full group-hover/cart:translate-x-full"
                  transition={{ duration: 0.6 }}
                />

                <div className="relative z-10 flex items-center gap-2.5 font-display text-[11px] tracking-widest">
                  <motion.div
                    className="relative flex items-center justify-center"
                    animate={totalItems > 0 ? {
                      scale: [1, 1.15, 1],
                    } : {}}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    whileHover={{
                      scale: 1.3,
                      rotate: -12,
                      filter: "drop-shadow(0 0 8px currentColor)",
                      transition: { type: "spring", stiffness: 400, damping: 15 }
                    }}
                  >
                    <ShoppingCart className="h-4.5 w-4.5 transition-all duration-300" />
                  </motion.div>

                  <span className="transition-colors duration-300 uppercase">
                    {t.navbar.carrito}
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0, x: 5, y: -5 }}
                    animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                    exit={{ scale: 0, opacity: 0, x: 5, y: -5 }}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#ff3b30] text-[10px] font-black text-white shadow-[0_0_15px_rgba(255,59,48,0.5)] ring-2 ring-background z-20 transition-transform group-hover/cart:scale-110"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>

          <div className="flex items-center gap-2 bg-background/50 backdrop-blur-xl p-1 md:p-1.5 rounded-full border-2 border-primary/10 dark:border-primary/30 shadow-lg md:gap-3 group/pill hover:border-primary/30 dark:hover:border-primary/50 transition-all duration-300">
            <div className="hidden items-center gap-1 md:flex md:gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>

            {/* Mobile-only toggle unified in the pill */}
            <div className="md:hidden px-1">
              <button
                onClick={() => setOpen(!open)}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 text-foreground overflow-hidden group/menu",
                  open ? "bg-primary text-primary-foreground rotate-90" : "hover:bg-secondary"
                )}
                aria-label="Toggle menu"
              >
                <div className="relative h-5 w-5">
                  <Menu className={cn("absolute inset-0 transition-all duration-300", open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
                  <X className={cn("absolute inset-0 transition-all duration-300", open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Cart Button (Separated but visually consistent) */}
          <div className="relative md:hidden">
            <Link
              href="/cart"
              className="group flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95 shadow-xl border
                bg-white text-primary border-primary/20
                dark:bg-primary/20 dark:text-primary dark:border-primary/40 dark:backdrop-blur-md"
            >
              <div className="relative z-10 flex items-center justify-center">
                <motion.div
                  animate={totalItems > 0 ? { scale: [1, 1.2, 1] } : {}}
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ShoppingCart className="h-5 w-5" />
                </motion.div>
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -right-3 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff3b30] text-[10px] font-black text-white shadow-[0_0_10px_rgba(255,59,48,0.4)] ring-2 ring-background z-20"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-[60px] inset-x-4 bg-background/95 backdrop-blur-2xl px-6 py-10 rounded-3xl border border-border shadow-2xl md:hidden z-40 overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />

            <div className="flex flex-col gap-8 items-center">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-full text-center"
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "font-display text-3xl font-black transition-all block tracking-tight",
                      isActive(l.href) ? "text-primary scale-110" : "text-muted-foreground/60 hover:text-foreground"
                    )}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}

              <div className="w-full h-px bg-border/40 my-4" />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full mt-4 flex flex-col gap-6"
              >
                <div className="flex items-center justify-center gap-4 p-4 rounded-3xl bg-secondary/20 border border-border/40 backdrop-blur-md">
                   <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t.navbar.idioma}</span>
                      <LanguageSelector />
                   </div>
                   <div className="w-px h-10 bg-border/40" />
                   <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t.navbar.tema ?? "Theme"}</span>
                      <ThemeToggle />
                   </div>
                </div>

                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-4 rounded-3xl bg-primary px-8 py-5 font-display text-2xl font-black text-white transition-all relative group shadow-[0_10px_30px_rgba(var(--primary),0.3)] active:scale-95"
                >
                  <ShoppingCartIcon totalItems={totalItems} />
                  <span>{t.navbar.miCarrito}</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// Helper component for mobile cart icon
const ShoppingCartIcon = ({ totalItems }: { totalItems: number }) => (
  <div className="relative flex items-center justify-center">
    <ShoppingCart className="h-7 w-7 transition-colors duration-300" />
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.span
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 10 }}
          className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#ff3b30] text-[12px] font-black text-white shadow-[0_4px_15px_rgba(255,59,48,0.5)] ring-2 ring-background"
        >
          {totalItems}
        </motion.span>
      )}
    </AnimatePresence>
  </div>
);

export default Navbar;
