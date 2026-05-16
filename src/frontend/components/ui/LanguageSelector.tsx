"use client";

import * as React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const languages = [
  { code: "es", label: "Español", flag: "CO", flagEmoji: "🇨🇴" },
  { code: "en", label: "English", flag: "US", flagEmoji: "🇺🇸" },
] as const;

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "group flex items-center gap-2.5 rounded-full border-2 bg-background/40 px-3.5 py-1.5 font-display text-xs font-bold text-foreground backdrop-blur-xl transition-all hover:bg-background/80 hover:shadow-lg hover:shadow-primary/5 md:px-4 md:py-2",
            "border-primary/10 dark:border-primary/30 hover:border-primary/20 dark:hover:border-primary/40",
            isOpen && "border-primary/40 dark:border-primary/50 bg-background/90 ring-4 ring-primary/5 shadow-inner"
          )}
        >
          <div className="relative flex items-center justify-center">
            <Globe className={cn(
              "h-3.5 w-3.5 text-primary transition-transform duration-500 ease-out",
              isOpen ? "rotate-[120deg]" : "group-hover:rotate-12"
            )} />
            <motion.div 
              animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
              className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary"
            />
          </div>
          
          <div className="flex items-center gap-1.5 border-l border-border/50 pl-2.5 md:pl-3">
             <span className="hidden sm:inline-block text-[10px] text-muted-foreground/100 uppercase tracking-tighter">
                {currentLang.flag}
             </span>
             <span className="text-base leading-none translate-y-[0.5px]">{currentLang.flagEmoji}</span>
          </div>

          <ChevronDown className={cn(
            "h-3 w-3 text-muted-foreground/50 transition-transform duration-300 ease-in-out",
            isOpen ? "rotate-180 text-primary" : "group-hover:text-primary/70"
          )} />
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="mt-2 min-w-[170px] border-border/50 bg-background/95 p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 rounded-2xl"
      >
        <div className="px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">
          Select Language
        </div>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 outline-none",
              "focus:bg-primary/20 focus:text-foreground",
              language === lang.code 
                ? "bg-primary/10 font-bold text-primary" 
                : "text-muted-foreground hover:bg-primary/5"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/50 text-base shadow-inner group-hover:scale-110 transition-transform">
                {lang.flagEmoji}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-display tracking-tight leading-none">{lang.label}</span>
                <span className="text-[9px] text-muted-foreground/60 font-medium uppercase mt-0.5">{lang.flag}</span>
              </div>
            </div>
            
            {language === lang.code && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3 w-3 stroke-[3px]" />
                </div>
              </motion.div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
