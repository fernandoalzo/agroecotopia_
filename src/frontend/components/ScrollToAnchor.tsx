"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const ScrollToAnchor = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // En Next.js, el hash no está en usePathname ni useSearchParams directamente.
    // Usamos window.location.hash para detectarlo.
    const hash = window.location.hash;
    
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);

      if (element) {
        // Delay para asegurar que el contenido esté renderizado
        const timeoutId = setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    } else {
      // Si no hay hash, subir al tope
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname, searchParams]);

  return null;
};

export default ScrollToAnchor;
