"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-16 rounded-full bg-secondary/50 animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-inner
        ${isDark
          ? "bg-primary/20 border-primary/30 hover:bg-primary/30"
          : "bg-secondary border-primary/10 hover:border-primary/20 shadow-sm"
        }`}
      aria-label="Toggle theme"
    >


      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 ${isDark ? "translate-x-8 rotate-0" : "translate-x-1 rotate-90"
          }`}
      >
        {isDark ? (
          <Moon className="h-4 w-4 transition-transform" />
        ) : (
          <Sun className="h-4 w-4 transition-transform" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;

