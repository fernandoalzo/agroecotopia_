"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

/** Routes where the Navbar should NOT be rendered */
const HIDDEN_ROUTES = ["/login"];

function GlobalNavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHidden = HIDDEN_ROUTES.some((route) => pathname?.startsWith(route));
  const isEmbedded = searchParams.get("embedded") === "true";

  if (isHidden || isEmbedded) return null;
  return <Navbar />;
}

/**
 * Renders the Navbar globally across the app.
 * Automatically hidden on routes defined in HIDDEN_ROUTES
 * and when the `embedded=true` query param is present (iframe embed mode).
 * Mounted inside Providers.tsx alongside ChatWidget.
 */
export default function GlobalNavbar() {
  return (
    <Suspense fallback={<Navbar />}>
      <GlobalNavbarContent />
    </Suspense>
  );
}

