"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AuthMode } from "@/types/auth.types";

interface AuthTabsProps {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  t: any;
}

export function AuthTabs({ mode, setMode, t }: AuthTabsProps) {
  return (
    <div className="flex p-1 bg-secondary border border-border rounded-xl mb-8 relative">
      <div className="flex w-full relative">
        {["login", "register"].map((tab) => {
          const isActive = (mode === tab);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab as AuthMode)}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 relative z-10",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-background rounded-lg border border-border shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {tab === "login" ? (t.auth?.signIn ?? "Ingresar") : (t.auth?.createAccount ?? "Crear Cuenta")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
