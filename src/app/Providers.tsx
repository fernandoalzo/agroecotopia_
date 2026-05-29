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
import { useState, Suspense, useEffect, useCallback } from "react";
import ScrollToAnchor from "@/components/ScrollToAnchor";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocket } from "@/frontend/context/SocketContext";
import { getAdminConversations, getOrCreateMyConversation, getConversationMessages, markAsRead, deleteConversationAction, getOrCreateConversationForAdmin } from "@/backend/modules/chat/chat.actions";
import logger from "@/utils/logger";
import { getConversationUnreadCount } from "@/frontend/lib/chatUnread";
import { useSocketRefresh } from "@/frontend/hooks/useSocketRefresh";

const log = logger.child("src/app/Providers.tsx");

function PageFocusTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const handleFocus = () => {
      log.info("Page focus changed", { pathname });
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

function AppChromeData() {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = session?.user?.role === "admin";
  const isOnDashboard = pathname?.startsWith("/admin/dashboard") ?? false;

  const refreshUnread = useCallback(async () => {
    if (!isAdmin || isOnDashboard) {
      setUnreadCount(0);
      return;
    }

    const res = await getAdminConversations();
    if (Array.isArray(res)) {
      setUnreadCount(res.reduce((acc: number, conv: any) => acc + getConversationUnreadCount(conv), 0));
    }
  }, [isAdmin, isOnDashboard]);

  useSocketRefresh({
    socket,
    enabled: isAdmin && !isOnDashboard,
    refresh: refreshUnread,
  });

  // Initial load — useSocketRefresh is purely event-driven
  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  return (
    <>
      <GlobalNavbar unreadCount={unreadCount} />
      <ChatWidget
        chatDeps={{
          getOrCreateMyConversation,
          getConversationMessages,
          markAsRead,
          deleteConversationAction,
          getOrCreateConversationForAdmin,
        }}
      />
    </>
  );
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
                  <AppChromeData />
                  {children}
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
