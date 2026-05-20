"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SocketProvider } from "@/frontend/context/SocketContext";
import ChatWidget from "@/frontend/components/chat/ChatWidget";
import GlobalNavbar from "@/frontend/components/GlobalNavbar";
import { ThemeProvider } from "next-themes";
import { useState, Suspense, useEffect } from "react";
import ScrollToAnchor from "@/components/ScrollToAnchor";
import { usePathname } from "next/navigation";

function PageFocusTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const handleFocus = () => {
      console.log(`[Page Focus] Estoy en la página: ${pathname}`);
    };

    // Log on initial load / pathname navigation
    handleFocus();

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [pathname]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider basePath="/api/v1/auth">
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <CartProvider>
              <SocketProvider>
                <TooltipProvider>
                  <Suspense fallback={null}>
                    <ScrollToAnchor />
                  </Suspense>
                  <PageFocusTracker />
                  <GlobalNavbar />
                  {children}
                  <ChatWidget />
                  <Sonner />
                </TooltipProvider>
              </SocketProvider>
            </CartProvider>
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
