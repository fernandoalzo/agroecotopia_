"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Loader2, Info, Leaf, X } from "lucide-react";
import { useNotifications } from "@/frontend/hooks/useNotifications";
import { config } from "@/config/config";
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export function NotificationBell({ isMobile }: { isMobile?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);
  const { unreadCount, notifications, isLoading, hasMore, loadMore, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("notifications-menu-state", { detail: isOpen }));
      if (isOpen) {
        window.dispatchEvent(new CustomEvent("close-other-menus", { detail: "notifications" }));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleCloseOther = (e: any) => {
      if (e.detail !== "notifications") setIsOpen(false);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("close-other-menus", handleCloseOther);
      return () => window.removeEventListener("close-other-menus", handleCloseOther);
    }
  }, []);

  const handleNotificationClick = (n: any) => {
    if (n.status !== "READ") markAsRead(n.id);
    setIsOpen(false);
    
    const metadata = n.notification.metadata as { actionUrl?: string } | undefined | null;
    if (metadata?.actionUrl) {
      router.push(metadata.actionUrl);
    } else if (n.notification.type === "store_request") {
      router.push("/admin/dashboard?tab=store_requests");
    } else if (n.notification.type === "store_request_approved") {
      router.push("/mi-tienda");
    } else if (n.notification.type === "store_request_rejected") {
      router.push("/solicitar-tienda");
    } else if (n.notification.type === "new_order") {
      router.push("/mi-tienda");
    }
  };

  const content = (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold tracking-tight">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount} nuevas
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors mr-2"
            >
              <Check className="h-3 w-3" />
              <span className="hidden sm:inline">Marcar todas como leídas</span>
              <span className="sm:hidden">Marcar todas</span>
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <p className="text-sm">Cargando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground p-8">
            <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
              <Bell className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground/80">Estás al día</p>
            <p className="text-xs mt-1">No tienes notificaciones nuevas en este momento.</p>
          </div>
        ) : (
          <div className="flex flex-col pb-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "relative group w-full text-left flex transition-colors border-b border-border/50 last:border-0 hover:bg-secondary/30",
                  n.status !== "READ" ? "bg-primary/[0.03]" : ""
                )}
              >
                <button
                  onClick={() => handleNotificationClick(n)}
                  className="flex-1 p-4 flex gap-3 min-w-0 text-left"
                >
                  <div className="shrink-0 mt-0.5">
                    {n.notification.type === "announcement" ? (
                      <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                        <Info className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        n.status !== "READ" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                      )}>
                        <Bell className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={cn(
                      "text-sm mb-1 line-clamp-2",
                      n.status !== "READ" ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                    )}>
                      {n.notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {n.notification.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/80 font-medium">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  {n.status !== "READ" && (
                    <div className="shrink-0 flex items-center justify-center w-3">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteNotification(n.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                  aria-label="Borrar notificación"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {hasMore && (
              <div className="p-4 flex justify-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    loadMore();
                  }}
                  disabled={isLoading}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Cargar más
                </button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const triggerButton = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "group/bell relative flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300",
        isOpen ? "bg-primary/10" : "hover:bg-primary/5",
        "outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <motion.div
        animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.5, delay: 2, repeat: Infinity, repeatDelay: 5 }}
      >
        <Bell className={cn(
          "h-5 w-5 transition-colors",
          isOpen || unreadCount > 0 ? "text-primary fill-primary/20" : "text-muted-foreground"
        )} />
      </motion.div>
      
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-background shadow-sm"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  if (isMobile) {
    return (
      <>
        {triggerButton}
        {mounted && createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-black/35 backdrop-blur-[3px] z-[998] cursor-pointer"
                />
                <motion.div
                  initial={{ opacity: 0, x: "100%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed inset-0 top-0 z-[999] flex h-full w-full flex-col bg-background overflow-y-auto overscroll-none"
                >
                  <div className="relative flex flex-col min-h-full px-6 pt-24 pb-6">
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                      <Leaf className="h-6 w-6 text-primary" />
                      <span className="font-display text-xl font-bold text-foreground tracking-tight">{config.app.name}</span>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
                      aria-label="Cerrar notificaciones"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex-1 mt-8">
                      {content}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        sideOffset={15}
        className="w-[380px] p-1.5 rounded-2xl bg-card/90 backdrop-blur-3xl border-border/30 shadow-2xl shadow-black/5 dark:shadow-black/30 z-[100] h-[450px] flex flex-col relative overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent z-10" />
        <div className="flex flex-col h-full w-full bg-card/50 rounded-xl overflow-hidden border border-border/5">
          {content}
        </div>
      </PopoverContent>
    </Popover>
  );
}
