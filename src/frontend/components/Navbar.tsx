"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Menu, X, ShoppingCart, LogIn, LogOut, Package, ChevronDown, ChevronRight, MessageSquare, LayoutDashboard, Store } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import UserMenu from "@/components/auth/UserMenu";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/frontend/context/SocketContext";
import { NotificationBell } from "@/frontend/components/notifications/NotificationBell";
import logger from "@/utils/logger";
import { config } from "@/config/config";

const log = logger.child();

type NavbarProps = {
  unreadCount?: number;
};

const Navbar = ({ unreadCount = 0 }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const pathname = usePathname();
  const { totalItems, clearCart } = useCart();
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { socket } = useSocket();
  const isAdmin = session?.user?.role === "admin";

  const isAuthenticated = !!session?.user;
  const userName = session?.user?.name ?? (t.navbar?.usuario ?? "Usuario");
  const userImage = session?.user?.image;
  const userInitial = userName.charAt(0).toUpperCase();

  const links = [
    { label: t.navbar.inicio, href: "/" },
    { label: t.navbar.productos, href: "/products" },
    { label: t.navbar.nosotros, href: "/nosotros" },
    { label: t.navbar.contacto, href: "/contacto" },
    { label: t.navbar.comunidad, href: "/comunidad" },
  ];

  useEffect(() => {
    setActiveSection(pathname);
  }, [pathname]);

  const isActive = (href: string) => {
    if (pathname === "/" && (href === "/" || href.includes("#"))) {
      return activeSection === href;
    }
    return pathname === href;
  };

  useEffect(() => {
    if (!open) {
      setConfirmLogout(false);
    }

    // Dispatch event to notify other components (like ChatWidget) about menu state
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mobile-menu-state", { detail: open }));
    }
  }, [open]);

  return (
    <nav className="fixed top-0 z-50 w-full bg-gradient-to-b from-background/95 via-background/85 to-background/60 backdrop-blur-md">
      {/* Soft gradient fade into page content */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 -bottom-6 h-6 bg-gradient-to-b from-background/30 to-transparent" />
      <div className="mx-auto flex h-14 items-center justify-between px-4 lg:h-20 lg:px-6 max-w-[1440px]">
        <div className="flex items-center justify-start">
          <Link href="/" className="group relative flex shrink-0 items-center gap-1.5 font-display text-lg font-bold lg:gap-3 lg:text-2xl transition-all duration-300">
            {/* Animated Logo Container */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 0.95, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <Leaf className="h-6 w-6 text-primary lg:h-8 lg:w-8 transition-transform duration-500 group-hover:rotate-[25deg] group-hover:scale-125" />
              </motion.div>

              {/* Subtle aura behind the leaf */}
              <div className="absolute inset-0 -z-10 h-full w-full rounded-full bg-primary/20 blur-xl transition-all duration-500 group-hover:bg-primary/40 group-hover:blur-2xl" />
            </div>

            {/* Premium Typography Container */}
            <div className="relative overflow-hidden">
              <div className="flex items-center tracking-tight lg:tracking-tighter">
                {config.app.name.split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 0 }}
                    whileHover={{
                      y: -2,
                      color: "var(--color-primary)",
                      textShadow: "0 0 8px oklch(var(--color-primary) / 0.5)", // Subtle neon glow on hover
                      transition: { duration: 0.1 }
                    }}
                    className={cn(
                      "inline-block transition-all duration-300",
                      // Unified primary green for the entire brand title for consistency and maximum legibility
                      "text-primary font-bold md:font-black",
                      // Slightly smaller on mobile to prevent overflow
                      "text-[15px] lg:text-2xl"
                    )}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>

              {/* Sophisticated Shine Sweep */}
              <motion.div
                className="absolute inset-0 z-20 pointer-events-none"
                initial={{ x: "-100%", opacity: 0 }}
                whileHover={{
                  x: ["-100%", "200%"],
                  opacity: [0, 0.5, 0],
                  transition: {
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 0.2,
                    ease: "easeInOut"
                  }
                }}
              >
                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent skew-x-[-25deg] blur-md dark:via-white/10" />
              </motion.div>

              {/* Luxury Underline */}
              <motion.div
                className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-primary via-accent to-transparent"
                initial={{ width: 0, opacity: 0 }}
                whileHover={{ width: "100%", opacity: 1 }}
                transition={{ duration: 0.4, ease: "circOut" }}
              />
            </div>
          </Link>
        </div>

        {/* Right Side Action Group: Contains Nav Pill, Auth, and Settings with homogeneous spacing */}
        <div className="flex shrink-0 items-center gap-2 lg:gap-3 justify-end min-w-0">
          {/* Desktop Navigation (Center Pill) */}
          <div className="hidden items-center lg:flex gap-1 xl:gap-2 bg-secondary/30 backdrop-blur-sm pl-4 xl:pl-6 pr-3 xl:pr-4 py-2 rounded-full border border-border/40 shadow-inner group/nav overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/nav:translate-x-full transition-transform duration-1000 pointer-events-none" />

            <div className="flex items-center gap-3 xl:gap-6">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative py-1 font-body text-[13px] xl:text-sm font-bold tracking-tight transition-all hover:text-primary z-20 whitespace-nowrap",
                    isActive(l.href) ? "text-primary" : "text-muted-foreground/80"
                  )}
                >
                  <span className="relative z-10 pointer-events-none">{l.label}</span>
                  {isActive(l.href) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_oklch(var(--color-primary)/0.5)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Integrated Orders Link — only visible if logged in */}
            {isAuthenticated && (
              <Link
                href={isAdmin ? "/admin/dashboard" : "/pedidos"}
                className={cn(
                  "group/orders relative flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all duration-300 hover:bg-primary/5 z-20",
                  (isAdmin ? pathname?.startsWith("/admin/dashboard") : isActive("/pedidos")) ? "bg-primary/10 text-primary" : "text-muted-foreground/80"
                )}
              >
                <div className="relative flex items-center justify-center pointer-events-none">
                  {isAdmin ? (
                    <LayoutDashboard className={cn(
                      "h-4.5 w-4.5 transition-transform duration-300 group-hover/orders:scale-110",
                      pathname?.startsWith("/admin/dashboard") ? "text-primary" : "text-primary/70"
                    )} />
                  ) : (
                    <Package className={cn(
                      "h-4.5 w-4.5 transition-transform duration-300 group-hover/orders:scale-110",
                      isActive("/pedidos") ? "text-primary" : "text-primary/70"
                    )} />
                  )}
                </div>
                <div className="flex flex-col leading-tight pointer-events-none">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                    (isAdmin ? pathname?.startsWith("/admin/dashboard") : isActive("/pedidos")) ? "text-primary" : "text-primary/60 group-hover/orders:text-primary"
                  )}>
                    {isAdmin ? t.navbar.dashboard : t.navbar.pedidos}
                  </span>
                </div>
                {isAdmin && unreadCount > 0 && (
                  <span className="min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[8px] font-bold px-1 bg-red-500 text-white animate-pulse shadow-sm shadow-red-500/20 pointer-events-none">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Vertical Separator */}
            <div className="h-6 w-px bg-border/40 mx-1 z-10" />

            {/* Integrated Cart Button */}
            <Link
              href="/cart"
              className={cn(
                "group/cart relative flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all duration-300 hover:bg-primary/5 z-20",
                isActive("/cart") ? "bg-primary/10 text-primary" : "text-muted-foreground/80"
              )}
            >
              <div className="relative flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={totalItems > 0 ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ShoppingCart className={cn(
                    "h-4.5 w-4.5 transition-transform duration-300 group-hover/cart:scale-110 group-hover/cart:rotate-[-8deg]",
                    isActive("/cart") ? "text-primary" : "text-primary/70"
                  )} />
                </motion.div>

                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -right-2.5 -top-2.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[8px] font-black text-primary-foreground shadow-sm ring-2 ring-background/50"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-col leading-tight pointer-events-none">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest transition-colors",
                  isActive("/cart") ? "text-primary" : "text-primary/60 group-hover/cart:text-primary"
                )}>
                  {t.navbar.carrito}
                </span>
                {totalItems > 0 && (
                  <span className={cn(
                    "text-[8px] font-bold transition-colors",
                    isActive("/cart") ? "text-primary/70" : "text-muted-foreground/60"
                  )}>
                    {totalItems} {totalItems === 1 ? "Item" : "Items"}
                  </span>
                )}
              </div>
            </Link>
          </div>




          {/* Auth Button and Notifications — standalone, outside settings dropdown */}
          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated && (
              <div className="flex shrink-0 items-center bg-background/50 backdrop-blur-xl p-1 rounded-full border border-border/50 shadow-sm mr-1">
                <NotificationBell />
              </div>
            )}
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 bg-secondary/40 hover:bg-secondary/60 border border-border/50 hover:border-primary/30 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 transition-all duration-300 group/auth outline-none"
                  >
                    <div className="relative h-7 w-7">
                      <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-primary/20">
                        {userImage ? (
                          <Image src={userImage} alt={userName} fill className="object-cover rounded-full" sizes="28px" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/20 text-primary font-bold text-xs rounded-full">
                            {userInitial}
                          </div>
                        )}
                      </div>
                      {session?.user?.role === "admin" && unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-foreground/80 group-hover/auth:text-primary transition-colors">
                      {userName.split(" ")[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground group-hover/auth:text-primary transition-all" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-card/95 backdrop-blur-2xl border-border/50 shadow-xl p-2 z-[100]">
                  <DropdownMenuLabel className="font-normal px-2 py-1.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        {session?.user?.email ?? "Usuario registrado"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50 my-1" />
                  {session?.user?.role === "admin" && (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-2 py-2 transition-colors focus:bg-primary/5 focus:text-primary">
                        <Link href="/admin/dashboard" className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{t.navbar?.dashboard ?? "Dashboard"}</span>
                          </div>
                          <LayoutDashboard className="h-4 w-4 text-primary" />
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/50 my-1" />
                    </>
                  )}
                  {session?.user?.role === "seller" && (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-2 py-2 transition-colors focus:bg-primary/5 focus:text-primary">
                        <Link href="/mi-tienda" className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Mi Tienda</span>
                          </div>
                          <Store className="h-4 w-4 text-primary" />
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/50 my-1" />
                    </>
                  )}
                  {session?.user?.role === "user" && (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-2 py-2 transition-colors focus:bg-primary/5 focus:text-primary">
                        <Link href="/solicitar-tienda" className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Vender con Nosotros</span>
                          </div>
                          <Leaf className="h-4 w-4 text-primary" />
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/50 my-1" />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      clearCart();
                      signOut({ callbackUrl: "/" });
                    }}
                    className="text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer flex items-center justify-between rounded-xl px-2 py-2 transition-colors"
                  >
                    <span className="font-medium text-sm">{t.navbar?.cerrarSesion ?? "Cerrar Sesión"}</span>
                    <LogOut className="h-4 w-4" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider border shadow-lg overflow-hidden relative
                    bg-primary text-primary-foreground border-primary/80 hover:shadow-primary/20
                    dark:bg-primary dark:text-primary-foreground dark:border-primary/60 transition-all duration-300 group/login"
                >
                  <LogIn className="h-4 w-4 transition-transform group-hover/login:translate-x-0.5" />
                  <span>{t.auth?.signIn ?? "Ingresar"}</span>
                </motion.div>
              </Link>
            )}
          </div>

          {/* Settings + Mobile Toggle pill */}
          <div className="flex shrink-0 items-center gap-1 bg-background/50 backdrop-blur-xl p-1 lg:p-1.5 rounded-full border-2 border-primary/10 dark:border-primary/30 shadow-lg lg:gap-2 group/pill hover:border-primary/30 dark:hover:border-primary/50 transition-all duration-300">
            <div className="flex items-center">
              <UserMenu />
            </div>
            <div className="lg:hidden px-1">
              <button
                onClick={() => setOpen(!open)}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 text-foreground overflow-hidden group/menu",
                  open ? "bg-primary text-primary-foreground rotate-90" : "hover:bg-secondary"
                )}
                aria-label="Toggle menu"
              >
                <div className="relative h-5 w-5">
                  <Menu className={cn("absolute inset-0 transition-all duration-300", open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
                  <X className={cn("absolute inset-0 transition-all duration-300", open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Notification Bell */}
          <div className="relative shrink-0 lg:hidden">
            {isAuthenticated && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card/80 backdrop-blur-xl border-border/60 dark:bg-white/5 dark:border-white/10 shadow-sm mr-2">
                <NotificationBell isMobile />
              </div>
            )}
          </div>

          {/* Mobile Cart Button */}
          <div className="relative shrink-0 lg:hidden">
            <Link href="/cart" className="group relative flex items-center">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300
                  bg-card/80 backdrop-blur-xl text-foreground border-border/60
                  dark:bg-white/5 dark:border-white/10 shadow-sm"
              >
                <ShoppingCart className="h-[18px] w-[18px] text-primary" />
              </motion.div>
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[8px] font-black text-primary-foreground ring-2 ring-background z-20"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 top-0 z-[60] flex h-screen w-full flex-col bg-primary dark:bg-[#0a1f14] lg:hidden overflow-y-auto"
          >
            {/* Background pattern layer - Organic Leaf SVGs from Visual Concept */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.07] mix-blend-overlay">
              <div className="absolute top-0 -left-10 w-64 h-64 rotate-12">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
                  <path d="M40 160C40 160 20 120 40 80C60 40 100 20 140 40C180 60 180 120 160 140C140 160 100 180 40 160Z" stroke="currentColor" strokeWidth="1" />
                  <path d="M40 160L140 40" stroke="currentColor" strokeWidth="0.5" />
                  <path d="M80 120C100 110 120 100 140 100" stroke="currentColor" strokeWidth="0.5" />
                  <path d="M60 100C80 90 100 80 120 80" stroke="currentColor" strokeWidth="0.5" />
                </svg>
              </div>
              <div className="absolute bottom-20 -right-16 w-80 h-80 -rotate-45">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
                  <path d="M40 160C40 160 20 120 40 80C60 40 100 20 140 40C180 60 180 120 160 140C140 160 100 180 40 160Z" stroke="currentColor" strokeWidth="1" />
                  <path d="M40 160L140 40" stroke="currentColor" strokeWidth="0.5" />
                </svg>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20">
                <div className="w-full h-full bg-[radial-gradient(circle,transparent_20%,#000_100%)] mix-blend-multiply" />
              </div>
            </div>

            <div className="relative flex flex-col min-h-full px-6 pt-24 pb-20">
              {/* Top Header inside menu */}
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <Leaf className="h-6 w-6 text-white/90" />
                <span className="font-display text-xl font-bold text-white tracking-tight">{config.app.name}</span>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="absolute top-6 right-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 active:scale-90 transition-all"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="flex flex-col gap-6 mt-12">
                {links.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.2, type: "spring", damping: 20 }}
                    className="w-full"
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group relative flex items-center justify-between py-2 transition-all",
                        isActive(l.href) ? "text-white" : "text-white/60 hover:text-white"
                      )}
                    >
                      <span className="font-display text-4xl font-black tracking-tighter">
                        {l.label}
                      </span>
                      {isActive(l.href) && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="h-2 w-2 rounded-full bg-accent"
                        />
                      )}

                      {/* Hover effect underline */}
                      <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-accent transition-all duration-300 group-hover:w-16" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto space-y-8">
                <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/5 to-transparent" />

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4"
                >


                  {/* Orders / Dashboard Button — visible if logged in */}
                  {isAuthenticated && (
                    <div className="relative group">
                      <Link href={isAdmin ? "/admin/dashboard" : "/pedidos"} onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-4 rounded-3xl bg-[#0f2a1d] border border-white/10 px-8 py-6 text-white shadow-xl active:scale-95 transition-all overflow-hidden relative"
                      >
                        <div className="flex items-center gap-5 relative z-10">
                          <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-white/10 border border-white/10">
                            {isAdmin ? (
                              <LayoutDashboard className="h-6 w-6 text-white" />
                            ) : (
                              <Package className="h-6 w-6 text-white" />
                            )}
                            {isAdmin && unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f2a1d] animate-pulse" />
                            )}
                          </div>
                          <span className="font-display text-2xl font-black tracking-tight uppercase">
                            {isAdmin ? t.navbar.dashboard : t.navbar.pedidos}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                          {isAdmin && unreadCount > 0 && (
                            <span className="min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px] font-bold px-1.5 bg-red-500 text-white animate-pulse shadow-sm shadow-red-500/20">
                              {unreadCount}
                            </span>
                          )}
                          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-white/40" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Store Dashboard Button — visible for sellers */}
                  {isAuthenticated && session?.user?.role === "seller" && (
                    <div className="relative group">
                      <Link href="/mi-tienda" onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-4 rounded-3xl bg-[#0f2a1d] border border-white/10 px-8 py-6 text-white shadow-xl active:scale-95 transition-all overflow-hidden relative"
                      >
                        <div className="flex items-center gap-5 relative z-10">
                          <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-white/10 border border-white/10">
                            <Store className="h-6 w-6 text-white" />
                          </div>
                          <span className="font-display text-2xl font-black tracking-tight uppercase">
                            Mi Tienda
                          </span>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-white/40" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Request Store Button — visible for regular users */}
                  {isAuthenticated && session?.user?.role === "user" && (
                    <div className="relative group">
                      <Link href="/solicitar-tienda" onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-4 rounded-3xl bg-[#0f2a1d] border border-white/10 px-8 py-6 text-white shadow-xl active:scale-95 transition-all overflow-hidden relative"
                      >
                        <div className="flex items-center gap-5 relative z-10">
                          <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-white/10 border border-white/10">
                            <Leaf className="h-6 w-6 text-white" />
                          </div>
                          <span className="font-display text-2xl font-black tracking-tight uppercase">
                            Vender con Nosotros
                          </span>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-white/40" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Cart Button */}
                  <div className="relative group">
                    <Link href="/cart" onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-4 rounded-3xl bg-[#0f2a1d] border border-white/10 px-8 py-6 text-white shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95 transition-all overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-white/10 border border-white/10">
                          <ShoppingCart className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-display text-2xl font-black tracking-tight uppercase">{t.navbar.miCarrito}</span>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center relative z-10">
                        <Leaf className="h-4 w-4 text-white/40 group-hover:text-accent transition-colors" />
                      </div>
                    </Link>
                    <AnimatePresence>
                      {totalItems > 0 && (
                        <motion.div
                          initial={{ scale: 0, x: 10, y: -10 }}
                          animate={{ scale: 1, x: 0, y: 0 }}
                          exit={{ scale: 0, x: 10, y: -10 }}
                          className="absolute -right-3 -top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#ff3b30] text-[15px] font-black text-white shadow-[0_10px_20px_rgba(255,59,48,0.5)] border-[3px] border-[#0f2a1d]"
                        >
                          {totalItems}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Separator for Auth Section */}
                  <div className="flex items-center gap-4 pt-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{t.navbar.miCuenta || "Mi Cuenta"}</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {/* Auth Button — Mobile (Now at the end) */}
                  {isAuthenticated ? (
                    !confirmLogout ? (
                      <button
                        type="button"
                        onClick={() => setConfirmLogout(true)}
                        className="flex items-center justify-between gap-4 w-full rounded-3xl bg-[#0f2a1d] hover:bg-[#1a3d2c] border border-white/10 px-8 py-5 text-white shadow-xl active:scale-95 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative h-10 w-10">
                            <div className="relative h-full w-full overflow-hidden rounded-xl ring-2 ring-white/20">
                              {userImage ? (
                                <Image src={userImage} alt={userName} fill className="object-cover rounded-xl" sizes="40px" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-white/10 text-white font-bold text-lg rounded-xl">{userInitial}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="block font-display text-lg font-bold tracking-tight">{userName}</span>
                            <span className="block text-xs text-white/60">{t.navbar?.miPerfil ?? "Mi Perfil"}</span>
                          </div>
                        </div>
                        <LogOut className="h-5 w-5 text-white/40" />
                      </button>
                    ) : (
                      <div className="flex flex-col gap-3 rounded-3xl bg-red-950/50 border border-red-500/20 p-5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <p className="text-center text-sm font-medium text-white mb-1">{t.navbar?.confirmarCerrarSesion ?? "¿Estás seguro de cerrar sesión?"}</p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setConfirmLogout(false)}
                            className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-bold text-white transition-all active:scale-95 hover:bg-white/20"
                          >
                            {t.navbar?.cancelar ?? "Cancelar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { 
                              clearCart();
                              setOpen(false); 
                              signOut({ callbackUrl: "/" }); 
                            }}
                            className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition-all active:scale-95 hover:bg-red-600 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                          >
                            {t.navbar?.salir ?? "Salir"} <LogOut className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <Link href="/login" onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-4 w-full rounded-3xl bg-white text-primary px-8 py-5 shadow-xl active:scale-95 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                          <LogIn className="h-5 w-5" />
                        </div>
                        <span className="font-display text-xl font-bold tracking-tight">{t.auth?.signIn ?? "Ingresar"}</span>
                      </div>
                      <Leaf className="h-4 w-4 text-primary/40" />
                    </Link>
                  )}

                  <div className="flex justify-center gap-6 pt-4 text-white/30">
                    <div className="text-[10px] uppercase font-bold tracking-widest">© 2024 {config.app.name}</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// Helper component for mobile cart icon
const ShoppingCartIcon = ({ totalItems }: { totalItems: number }) => (
  <div className="relative flex items-center justify-center">
    <ShoppingCart className="h-7 w-7 transition-colors duration-300" />
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.span
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 10 }}
          className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#ff3b30] text-[12px] font-black text-white shadow-[0_4px_15px_rgba(255,59,48,0.5)] ring-2 ring-background"
        >
          {totalItems}
        </motion.span>
      )}
    </AnimatePresence>
  </div>
);

export default Navbar;
