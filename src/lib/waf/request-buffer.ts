/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from "@/utils/logger";

const log = logger.child("src/lib/waf/request-buffer.ts");

export interface WafRequestEntry {
  id: number;
  timestamp: string;
  method: string;
  path: string;
  query: string;
  ip: string;
  userAgent: string;
  wafAction: "ALLOW" | "BLOCK" | "MONITOR";
  wafRules: string[];
  elapsedMs: number;
  country?: string;
}

const MAX_ENTRIES = 200;

const BUFFER_KEY = "__wafRequestBuffer";

interface BufferState {
  entries: WafRequestEntry[];
  counter: number;
}

function getBuffer(): BufferState {
  if (typeof process !== "undefined" && (process as any)[BUFFER_KEY]) {
    return (process as any)[BUFFER_KEY];
  }
  if (typeof globalThis !== "undefined" && (globalThis as any)[BUFFER_KEY]) {
    return (globalThis as any)[BUFFER_KEY];
  }
  const fresh: BufferState = { entries: [], counter: 0 };
  if (typeof process !== "undefined") (process as any)[BUFFER_KEY] = fresh;
  (globalThis as any)[BUFFER_KEY] = fresh;
  return fresh;
}

const state = getBuffer();

export function pushEntry(entry: Omit<WafRequestEntry, "id">): WafRequestEntry {
  const full: WafRequestEntry = { id: ++state.counter, ...entry };
  state.entries.unshift(full);
  if (state.entries.length > MAX_ENTRIES) {
    state.entries.length = MAX_ENTRIES;
  }
  return full;
}

export function getEntries(n = 100): WafRequestEntry[] {
  return state.entries.slice(0, n);
}

export function clear(): void {
  state.entries = [];
  log.info("WAF request buffer cleared");
}

export function maskLastOctet(ip: string): string {
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 3).join(":") + "::";
  }
  return ip;
}

const STATIC_PREFIXES = ["/_next/static/", "/_next/image", "/__nextjs"];
const STATIC_SUFFIXES = [".hot-update."];

export function isStaticAsset(url: string): boolean {
  if (STATIC_PREFIXES.some((p) => url.startsWith(p))) return true;
  if (STATIC_SUFFIXES.some((s) => url.includes(s))) return true;
  if (url.includes("favicon.ico")) return true;
  return false;
}


