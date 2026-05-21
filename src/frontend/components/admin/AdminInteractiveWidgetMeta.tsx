"use client";

import { useEffect } from "react";

const META_NAME = "interactive-widget";
const ADMIN_VALUE = "resizes-content";

/**
 * Ensures admin routes use resizes-content even if nested viewport merge
 * does not override the root overlays-content meta tag in every browser.
 */
export function AdminInteractiveWidgetMeta() {
  useEffect(() => {
    let el = document.querySelector(`meta[name="${META_NAME}"]`) as HTMLMetaElement | null;
    const created = !el;

    if (!el) {
      el = document.createElement("meta");
      el.name = META_NAME;
      document.head.appendChild(el);
    }

    const previous = el.getAttribute("content") ?? "";
    el.setAttribute("content", ADMIN_VALUE);

    return () => {
      if (created) {
        el?.remove();
        return;
      }
      if (previous) el?.setAttribute("content", previous);
      else el?.removeAttribute("content");
    };
  }, []);

  return null;
}
