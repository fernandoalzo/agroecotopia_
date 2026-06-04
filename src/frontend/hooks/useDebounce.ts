"use client";

import { useState, useEffect } from "react";

/**
 * Hook que retorna un valor debounced.
 * Útil para retrasar búsquedas hasta que el usuario deje de escribir.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
