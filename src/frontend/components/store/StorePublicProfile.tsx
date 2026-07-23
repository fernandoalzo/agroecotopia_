"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Store as StoreIcon,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  User,
  ShieldCheck,
  MessageSquare,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { OrderChatPanel, type OrderConversation } from "@/components/chat/OrderChatPanel";
import type { Message } from "@/components/chat/ChatWidget";
import { toast } from "sonner";
import logger from "@/utils/logger";
import { useSocket } from "@/frontend/context/SocketContext";
import { useSocketRefresh } from "@/frontend/hooks/useSocketRefresh";
import type { Product } from "@/types";
import type { Store as StoreType } from "@/types/store";

const log = logger.child();

interface StorePublicProfileProps {
  store: StoreType & {
    owner?: { id: string; name?: string | null; image?: string | null };
    _count?: { products: number };
  };
  products: Product[];
  openStoreChatAction?: (storeId: string) => Promise<{ conversation: OrderConversation; messages: Message[] } | { error: string }>;
  getStoreChatUnreadAction?: (storeId: string) => Promise<{ hasConversation: boolean; unreadCount: number; conversationId: string | null } | { error: string }>;
}

export function StorePublicProfile({ store, products, openStoreChatAction, getStoreChatUnreadAction }: StorePublicProfileProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { language } = useLanguage();
  const { socket } = useSocket();
  const [storeChat, setStoreChat] = useState<{ conversation: OrderConversation; messages: Message[] } | null>(null);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchParams = useSearchParams();
  const shouldAutoOpenChat = searchParams.get("openChat") === "true";
  const autoOpenTriggeredRef = useRef(false);

  const isOwner = session?.user?.id === store.owner?.id;

  const loadUnreadCount = useCallback(async () => {
    if (!session?.user?.id || isOwner || !getStoreChatUnreadAction) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await getStoreChatUnreadAction(store.id);
      if (res && "unreadCount" in res) {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      setUnreadCount(0);
    }
  }, [store.id, session?.user?.id, isOwner, getStoreChatUnreadAction]);

  useSocketRefresh({
    socket,
    enabled: !!session?.user?.id && !isOwner && !!getStoreChatUnreadAction,
    refresh: loadUnreadCount,
    events: ["new_message_notification", "unread_count_updated"],
  });

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  const t = {
    back: language === "es" ? "Volver" : "Back",
    details: language === "es" ? "Información de la Tienda" : "Store Information",
    owner: language === "es" ? "Propietario" : "Owner",
    products: language === "es" ? "Catálogo de Productos" : "Product Catalog",
    memberSince: language === "es" ? "Miembro desde" : "Member since",
    city: language === "es" ? "Ciudad" : "City",
    address: language === "es" ? "Dirección" : "Address",
    phone: language === "es" ? "Teléfono" : "Phone",
    email: language === "es" ? "Correo" : "Email",
    notSpecified: language === "es" ? "No especificado" : "Not specified",
    activeStore: language === "es" ? "Tienda Verificada" : "Verified Store",
    productCount: (n: number) =>
      language === "es" ? `${n} producto${n !== 1 ? "s" : ""}` : `${n} product${n !== 1 ? "s" : ""}`,
    noProducts: language === "es" ? "Esta tienda aún no tiene productos." : "This store has no products yet.",
    storeOwner: language === "es" ? "Propietario de la tienda" : "Store owner",
    talkToSeller: language === "es" ? "Habla con el vendedor" : "Talk to the seller",
  };

  const infoItems = [
    { icon: MapPin, label: t.city, value: store.city || t.notSpecified },
    { icon: MapPin, label: t.address, value: store.address || t.notSpecified },
    { icon: Phone, label: t.phone, value: store.phone || t.notSpecified },
    { icon: Mail, label: t.email, value: store.email || t.notSpecified },
    {
      icon: Calendar,
      label: t.memberSince,
      value: new Date(store.createdAt).toLocaleDateString(
        language === "es" ? "es-CO" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      ),
    },
  ];

  const handleOpenStoreChat = useCallback(async () => {
    if (!openStoreChatAction) {
      toast.error("Chat no disponible");
      return;
    }
    setIsOpeningChat(true);
    try {
      const res = await openStoreChatAction(store.id);
      if (!res || "error" in res) {
        toast.error("No se pudo abrir el chat", {
          description: res && "error" in res ? String(res.error) : undefined,
        });
        return;
      }
      setStoreChat({
        conversation: res.conversation as OrderConversation,
        messages: (res.messages || []) as Message[],
      });
      setUnreadCount(0);
    } catch (err) {
      log.error("Error abriendo chat de tienda:", err);
      toast.error("No se pudo abrir el chat");
    } finally {
      setIsOpeningChat(false);
    }
  }, [store.id, openStoreChatAction]);

  const handleMarkAsRead = useCallback(async (_conversationId: string) => {
  }, []);

  useEffect(() => {
    if (!shouldAutoOpenChat || !store?.id || storeChat || autoOpenTriggeredRef.current || !openStoreChatAction) return;
    autoOpenTriggeredRef.current = true;

    const cleaned = new URL(window.location.href);
    cleaned.searchParams.delete("openChat");
    window.history.replaceState(null, "", cleaned.pathname + cleaned.search);

    handleOpenStoreChat();
  }, [shouldAutoOpenChat, store?.id, storeChat, openStoreChatAction, handleOpenStoreChat]);

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <main className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t.back}
          </button>

          {/* ── Seamless Header & Store Info Section ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            {/* Store Name, Avatar & Badges Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-border/40">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-secondary/40 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                {store.logo ? (
                  <Image
                    src={store.logo}
                    alt={store.name}
                    width={112}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <StoreIcon className="w-12 h-12 text-primary" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t.activeStore}
                  </span>
                  {store._count && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/50 border border-border/30">
                      <Package className="w-3.5 h-3.5" />
                      {t.productCount(store._count.products)}
                    </span>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
                  {store.name}
                </h1>

                {store.description && (
                  <p className="text-base text-muted-foreground leading-relaxed mt-3 max-w-4xl">
                    {store.description}
                  </p>
                )}
              </div>
            </div>

            {/* Seamless Details Grid + Owner Profile (No Cards / Native Background) */}
            <div className="pt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Info Items Column */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  {t.details}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  {infoItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3.5">
                        <div className="p-2 rounded-lg bg-secondary/40 text-primary shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                            {item.label}
                          </p>
                          <p className="text-sm text-foreground font-semibold truncate">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Owner Column */}
              <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-border/40 pt-8 lg:pt-0 lg:pl-10">
                <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  {t.owner}
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-secondary/50 border border-border/40 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {store.owner?.image ? (
                      <Image
                        src={store.owner.image}
                        alt={store.owner.name || ""}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <User className="w-7 h-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-base text-foreground truncate">
                      {store.owner?.name || t.notSpecified}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {t.storeOwner}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Divider line before products catalog */}
          <div className="h-px w-full bg-border/40 mb-12" />

          {/* ── Products Catalog Section ── */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-black text-foreground">
                {t.products}
              </h2>
              {store._count && (
                <span className="text-sm text-muted-foreground font-medium">
                  {t.productCount(store._count.products)}
                </span>
              )}
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((p, i) => (
                  <ProductCard key={p.id} p={p} priority={i < 4} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">{t.noProducts}</p>
              </div>
            )}
          </motion.section>
        </div>
      </main>
      <Footer />

      {/* Chat Panel Modal */}
      {storeChat && (
        <OrderChatPanel
          conversation={storeChat.conversation}
          initialMessages={storeChat.messages}
          title={store.name}
          onClose={() => setStoreChat(null)}
          onMarkAsRead={handleMarkAsRead}
        />
      )}

      {/* Floating Chat Button */}
      {session?.user && !isOwner && !storeChat && openStoreChatAction && (
        <div className="fixed bottom-6 right-6 z-[998]">
          <AnimatePresence>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              onClick={handleOpenStoreChat}
              disabled={isOpeningChat}
              className="flex items-center gap-3 rounded-full bg-primary px-5 py-3.5 text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-70"
            >
              {isOpeningChat ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
              ) : (
                <MessageSquare className="h-5 w-5 shrink-0" />
              )}
              <span className="text-sm font-semibold whitespace-nowrap">
                {t.talkToSeller}
              </span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-primary">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </motion.button>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
