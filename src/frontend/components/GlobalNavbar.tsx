"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

/** Routes where the Navbar should NOT be rendered */
const HIDDEN_ROUTES = ["/login"];

/**
 * Renders the Navbar globally across the app.
 * Automatically hidden on routes defined in HIDDEN_ROUTES.
 * Mounted inside Providers.tsx alongside ChatWidget.
 */
export default function GlobalNavbar() {
  const pathname = usePathname();
  const isHidden = HIDDEN_ROUTES.some((route) => pathname?.startsWith(route));

  if (isHidden) return null;
  return <Navbar />;
}
