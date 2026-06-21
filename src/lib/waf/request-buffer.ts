/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from "@/utils/logger";
import { config } from "@/config/config";

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
  headers?: Record<string, string | string[] | undefined>;
}

const MAX_ENTRIES = config.security.waf.monitor.bufferSize;

const BUFFER_KEY = "__wafRequestBuffer";

interface BufferState {
  entries: WafRequestEntry[];
  head: number;
  size: number;
  counter: number;
}

function getBuffer(): BufferState {
  if (typeof process !== "undefined" && (process as any)[BUFFER_KEY]) {
    return (process as any)[BUFFER_KEY];
  }
  if (typeof globalThis !== "undefined" && (globalThis as any)[BUFFER_KEY]) {
    return (globalThis as any)[BUFFER_KEY];
  }
  const fresh: BufferState = { entries: new Array(MAX_ENTRIES), head: 0, size: 0, counter: 0 };
  if (typeof process !== "undefined") (process as any)[BUFFER_KEY] = fresh;
  (globalThis as any)[BUFFER_KEY] = fresh;
  return fresh;
}

const state = getBuffer();

export function pushEntry(entry: Omit<WafRequestEntry, "id">): WafRequestEntry {
  const full: WafRequestEntry = { id: ++state.counter, ...entry };
  state.head = (state.head - 1 + MAX_ENTRIES) % MAX_ENTRIES;
  state.entries[state.head] = full;
  if (state.size < MAX_ENTRIES) state.size++;
  return full;
}

export function getEntries(n = 100): WafRequestEntry[] {
  const count = Math.min(n, state.size);
  const result: WafRequestEntry[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const idx = (state.head + i) % MAX_ENTRIES;
    result[i] = state.entries[idx];
  }
  return result;
}

export interface PaginatedEntries {
  entries: WafRequestEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function getEntriesPaginated(page = 1, pageSize = 50): PaginatedEntries {
  const total = state.size;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const skip = (safePage - 1) * pageSize;
  const count = Math.min(pageSize, total - skip);

  const entries: WafRequestEntry[] = [];
  for (let i = 0; i < count; i++) {
    const idx = (state.head + skip + i) % MAX_ENTRIES;
    entries.push(state.entries[idx]);
  }

  return { entries, total, page: safePage, pageSize, totalPages };
}

export function clear(): void {
  state.entries = new Array(MAX_ENTRIES);
  state.head = 0;
  state.size = 0;
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


