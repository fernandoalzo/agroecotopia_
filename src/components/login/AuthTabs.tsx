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
    <div className="tabs-container">
      <div className="flex w-full divide-x divide-transparent">
        {["login", "register"].map((tab) => {
          const isActive = (mode === tab);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab as AuthMode)}
              className={cn(
                "tab-button",
                isActive ? "tab-button-active" : "tab-button-inactive"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="active-tab-highlight"
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
