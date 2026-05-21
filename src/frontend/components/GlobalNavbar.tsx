"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

/** Routes where the Navbar should NOT be rendered */
const HIDDEN_ROUTES = ["/login"];

/**
 * Renders the Navbar globally across the app.
 * Automatically hidden on routes defined in HIDDEN_ROUTES
 * and when the `embedded=true` query param is present (iframe embed mode).
 * Mounted inside Providers.tsx alongside ChatWidget.
 */
export default function GlobalNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHidden = HIDDEN_ROUTES.some((route) => pathname?.startsWith(route));
  const isEmbedded = searchParams.get("embedded") === "true";

  if (isHidden || isEmbedded) return null;
  return <Navbar />;
}
