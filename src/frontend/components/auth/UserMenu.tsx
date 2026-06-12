"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { UserMenuDesktop } from "./desktop/UserMenu";
import { UserMenuMobile } from "./mobile/UserMenu";

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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("settings-menu-state", { detail: open }));
      if (open) {
        window.dispatchEvent(new CustomEvent("close-other-menus", { detail: "preferences" }));
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleCloseOther = (e: any) => {
      if (e.detail !== "preferences") setOpen(false);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("close-other-menus", handleCloseOther);
      return () => window.removeEventListener("close-other-menus", handleCloseOther);
    }
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-secondary/60" />;
  }

  const isDark = theme === "dark";

  const sharedProps = {
    isDark,
    language,
    tNavbar: t.navbar,
    onToggleTheme: () => setTheme(isDark ? "light" : "dark"),
    onSetLanguage: setLanguage,
  };

  return (
    <div ref={menuRef} className="relative z-[100]">
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-300",
          "h-9 w-9",
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
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <UserMenuDesktop {...sharedProps} />
            {mounted && createPortal(
              <UserMenuMobile {...sharedProps} onClose={() => setOpen(false)} />,
              document.body
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}