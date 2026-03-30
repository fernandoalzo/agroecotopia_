"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "next-themes";
import { useState, Suspense } from "react";
import ScrollToAnchor from "./ScrollToAnchor";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <TooltipProvider>
              <Suspense fallback={null}>
                <ScrollToAnchor />
              </Suspense>
              {children}
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </CartProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

